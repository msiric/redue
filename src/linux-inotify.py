#!/usr/bin/env python3
"""Linux-only inotify transport. Emits paths and continuity faults, never file data.

Unlike the pinned Parcel inotify backend, IN_Q_OVERFLOW is reported. The Node
engine owns all content inspection and deterministic reconciliation.
"""
import ctypes
import errno
import json
import os
import re
import select
import struct
import sys
import time

IN_MODIFY = 0x00000002
IN_ATTRIB = 0x00000004
IN_CLOSE_WRITE = 0x00000008
IN_MOVED_FROM = 0x00000040
IN_MOVED_TO = 0x00000080
IN_CREATE = 0x00000100
IN_DELETE = 0x00000200
IN_DELETE_SELF = 0x00000400
IN_MOVE_SELF = 0x00000800
IN_UNMOUNT = 0x00002000
IN_Q_OVERFLOW = 0x00004000
IN_IGNORED = 0x00008000
IN_ISDIR = 0x40000000
FILE_MASK = IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE | IN_DELETE_SELF | IN_MOVE_SELF
MASK = (IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE | IN_MOVED_FROM |
        IN_MOVED_TO | IN_CREATE | IN_DELETE | IN_DELETE_SELF |
        IN_MOVE_SELF | IN_UNMOUNT)
HEADER = struct.Struct('iIII')
LOCAL_FILESYSTEMS = {'ext2', 'ext3', 'ext4', 'xfs', 'btrfs', 'f2fs',
                     'tmpfs', 'zfs'}


def emit(kind, **fields):
    print(json.dumps({'kind': kind, **fields}, ensure_ascii=True), flush=True)


def filesystem_type(folder):
    best = ('', None)
    with open('/proc/self/mountinfo', encoding='utf-8') as mounts:
        for line in mounts:
            before, after = line.rstrip('\n').split(' - ', 1)
            point = re.sub(r'\\([0-7]{3})', lambda m: chr(int(m[1], 8)),
                           before.split()[4])
            if (folder == point or folder.startswith(point.rstrip('/') + '/')) \
                    and len(point) > len(best[0]):
                best = (point, after.split()[0])
    return best[1]


def main(root):
    root = os.path.realpath(root)
    if filesystem_type(root) not in LOCAL_FILESYSTEMS:
        emit('gap', reason='inotify_filesystem_untrusted')
        return 2
    libc = ctypes.CDLL(None, use_errno=True)
    libc.inotify_init1.argtypes = [ctypes.c_int]
    libc.inotify_init1.restype = ctypes.c_int
    libc.inotify_add_watch.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
    libc.inotify_add_watch.restype = ctypes.c_int
    libc.inotify_rm_watch.argtypes = [ctypes.c_int, ctypes.c_int]
    libc.inotify_rm_watch.restype = ctypes.c_int
    fd = libc.inotify_init1(os.O_NONBLOCK | os.O_CLOEXEC)
    if fd < 0:
        raise OSError(ctypes.get_errno(), 'inotify_init1 failed')
    watches = {}
    file_watches = {}
    file_paths = {}
    intentional_removals = set()

    # No input lies in a .git directory (config refuses such patterns and the
    # index skips them), so none is watched: git creates object directories
    # there on most commits, and each would be an observation gap.
    def in_git(target):
        return '.git' in os.path.relpath(target, root).split(os.sep)

    def add_tree(folder):
        stack = [folder]
        while stack:
            current = stack.pop()
            if in_git(current):
                continue
            wd = libc.inotify_add_watch(fd, os.fsencode(current), MASK)
            if wd < 0:
                error = ctypes.get_errno()
                # A new directory deleted before its watch: nothing to watch,
                # and its parent reports the deletion.
                if current != root and error in (errno.ENOENT, errno.ENOTDIR):
                    continue
                raise OSError(error, 'inotify_add_watch failed')
            watches[wd] = current
            try:
                with os.scandir(current) as entries:
                    for entry in entries:
                        if entry.is_dir(follow_symlinks=False):
                            stack.append(entry.path)
            except (FileNotFoundError, NotADirectoryError):
                if current == root:
                    raise

    def drain():
        while True:
            try:
                block = os.read(fd, 65536)
            except BlockingIOError:
                return True
            if not block:
                emit('gap', reason='inotify_closed')
                return False
            offset = 0
            while offset < len(block):
                wd, mask, _, length = HEADER.unpack_from(block, offset)
                offset += HEADER.size
                raw = block[offset:offset + length].split(b'\0', 1)[0]
                offset += length
                if mask & IN_Q_OVERFLOW:
                    emit('gap', reason='inotify_overflow')
                    return False
                if wd in intentional_removals and mask & IN_IGNORED:
                    intentional_removals.remove(wd)
                    continue
                if wd in file_watches:
                    if mask & (IN_UNMOUNT | IN_DELETE_SELF | IN_MOVE_SELF | IN_IGNORED):
                        emit('gap', reason='inotify_file_watch_lost')
                        return False
                    for watched in file_watches[wd]:
                        emit('event', type='update', path=watched)
                    continue
                parent = watches.get(wd)
                if parent is None:
                    emit('gap', reason='inotify_watch_unknown')
                    return False
                target = os.path.join(parent, os.fsdecode(raw)) if raw else parent
                if in_git(target):
                    continue
                if mask & IN_DELETE_SELF and parent != root:
                    # A watched directory was deleted: its IN_IGNORED follows
                    # and is expected. The engine rescans the path.
                    del watches[wd]
                    intentional_removals.add(wd)
                    emit('event', type='delete', path=parent)
                    continue
                if mask & (IN_UNMOUNT | IN_DELETE_SELF | IN_MOVE_SELF | IN_IGNORED):
                    emit('gap', reason='inotify_watch_lost')
                    return False
                if (mask & IN_ISDIR) and (mask & (IN_CREATE | IN_MOVED_TO)):
                    try:
                        add_tree(target)
                    except OSError as error:
                        emit('gap', reason='inotify_watch_add_failed', errno=error.errno)
                        return False
                    # Contents can appear before the new directory has its
                    # watch. The watches exist now, so later changes raise
                    # events; the engine rescans the directory on this event
                    # and finds what came before.
                    emit('event', type='create', path=target)
                    continue
                # A moved-away directory keeps watches under its old paths.
                if (mask & IN_ISDIR) and (mask & IN_MOVED_FROM):
                    emit('gap', reason='inotify_directory_removed')
                    return False
                event = ('delete' if mask & (IN_DELETE | IN_MOVED_FROM) else
                         'create' if mask & (IN_CREATE | IN_MOVED_TO) else 'update')
                emit('event', type=event, path=target)

    def replace_file_watches(paths):
        requested = set(paths)
        removed = False
        for old in set(file_paths) - requested:
            wd = file_paths.pop(old)
            aliases = file_watches[wd]
            aliases.remove(old)
            if not aliases:
                del file_watches[wd]
                intentional_removals.add(wd)
                libc.inotify_rm_watch(fd, wd)
                removed = True
        # Consume IN_IGNORED before adding new watches so a recycled watch
        # descriptor cannot be mistaken for an intentionally removed one.
        if removed and not drain():
            return False
        for added in requested - set(file_paths):
            absolute = os.path.abspath(added)
            if os.path.commonpath((root, absolute)) != root or \
                    os.path.commonpath((root, os.path.realpath(absolute))) != root:
                raise ValueError('installed watch escaped checkout')
            wd = libc.inotify_add_watch(fd, os.fsencode(absolute), FILE_MASK)
            if wd < 0:
                raise OSError(ctypes.get_errno(), 'installed inotify_add_watch failed')
            file_paths[added] = wd
            file_watches.setdefault(wd, set()).add(added)
        return True

    try:
        add_tree(root)
        emit('ready', watches=len(watches))
        stdin = b''
        heartbeat = time.monotonic()
        while True:
            injected = os.environ.get('VSTATE_TEST_LINUX_GAP_FILE') if \
                os.environ.get('VSTATE_TEST_FAULTS') == '1' else None
            if injected and os.path.exists(injected):
                with open(injected, encoding='utf-8') as source:
                    reason = source.read(64).strip()
                os.unlink(injected)
                emit('gap', reason=reason if reason in
                     ('inotify_overflow', 'inotify_watch_lost',
                      'inotify_watch_add_failed') else 'inotify_test_gap')
                return 2
            readable, _, _ = select.select([fd, 0], [], [], 0.25)
            if fd in readable and not drain():
                return 2
            if 0 in readable:
                chunk = os.read(0, 4096)
                if not chunk:
                    return 0
                stdin += chunk
                while b'\n' in stdin:
                    line, stdin = stdin.split(b'\n', 1)
                    message = json.loads(line)
                    if message.get('kind') == 'barrier':
                        hang = os.environ.get('VSTATE_TEST_LINUX_HANG_FILE') if \
                            os.environ.get('VSTATE_TEST_FAULTS') == '1' else None
                        if hang and os.path.exists(hang):
                            continue
                        if not drain():
                            return 2
                        emit('barrier', id=message['id'])
                    elif message.get('kind') == 'watch-files':
                        try:
                            if not replace_file_watches(message['paths']):
                                return 2
                        except (OSError, ValueError) as error:
                            emit('gap', reason='inotify_file_watch_add_failed',
                                 errno=getattr(error, 'errno', None))
                            return 2
                        if not drain():
                            return 2
                        emit('watched', id=message['id'], files=len(file_paths))
            if time.monotonic() - heartbeat >= 1:
                emit('heartbeat', watches=len(watches))
                heartbeat = time.monotonic()
    finally:
        os.close(fd)


if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1]))
    except (OSError, ValueError, IndexError) as error:
        emit('gap', reason='inotify_backend_error', errno=getattr(error, 'errno', None))
        sys.exit(2)
