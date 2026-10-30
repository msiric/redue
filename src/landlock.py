#!/usr/bin/env python3
# The sandboxed recipe's Linux launcher (src/sandbox.mjs): runs a command
# under a Landlock ruleset (Linux >= 5.13), with the standard library only.
# Reads and executes are allowed beneath the --read paths; with --no-tcp
# (ABI >= 4), every TCP bind and connect is refused, and (ABI >= 6) so is a
# connection to an abstract Unix socket outside the run. Writes are not
# handled, so they are not restricted.
#
# The launcher stays as the command's parent and a child subreaper: when the
# command exits, it stops every process the command left running, daemons
# that started their own session included (they are reparented to it), as a
# CI job's end does. The command runs in its own process group; a signal the
# launcher gets is passed to that group once. The launcher then ends as the
# command did: with its exit status, or by its signal.
#
#   landlock.py --read /usr --read /tmp ... [--no-tcp] -- cmd args...
#   landlock.py --probe     # prints {"abi": N} or {"abi": null, "errno": E}
import ctypes
import json
import os
import signal
import sys
import time

SYS_CREATE, SYS_ADD, SYS_RESTRICT = 444, 445, 446  # the same on x86_64 and aarch64
EXECUTE, READ_FILE, READ_DIR = 1 << 0, 1 << 2, 1 << 3
BIND_TCP, CONNECT_TCP = 1 << 0, 1 << 1
SCOPE_ABSTRACT_UNIX_SOCKET = 1 << 0
PR_SET_NO_NEW_PRIVS, PR_SET_CHILD_SUBREAPER = 38, 36

libc = ctypes.CDLL(None, use_errno=True)
libc.syscall.restype = ctypes.c_long


class RulesetAttr(ctypes.Structure):
    _fields_ = [('fs', ctypes.c_uint64), ('net', ctypes.c_uint64), ('scoped', ctypes.c_uint64)]


class PathBeneath(ctypes.Structure):
    # Packed, as the kernel's struct is: 12 bytes. Python 3.14 asks for the layout.
    _layout_ = 'ms'
    _pack_ = 1
    _fields_ = [('allowed', ctypes.c_uint64), ('fd', ctypes.c_int32)]


def abi():
    v = libc.syscall(SYS_CREATE, None, ctypes.c_size_t(0), ctypes.c_uint32(1))
    return (v, 0) if v >= 0 else (None, ctypes.get_errno())


def main(argv):
    if argv == ['--probe']:
        v, err = abi()
        print(json.dumps({'abi': v, 'errno': err}))
        return 0
    reads, no_tcp = [], False
    while argv and argv[0] != '--':
        if argv[0] == '--read':
            reads.append(argv[1]); argv = argv[2:]
        elif argv[0] == '--no-tcp':
            no_tcp = True; argv = argv[1:]
        else:
            sys.exit(f'landlock.py: unknown option {argv[0]}')
    cmd = argv[1:]
    version, err = abi()
    if version is None:
        sys.exit(f'landlock.py: Landlock unavailable (errno {err})')
    handled = EXECUTE | READ_FILE | READ_DIR
    attr = RulesetAttr(handled, (BIND_TCP | CONNECT_TCP) if no_tcp and version >= 4 else 0,
                       SCOPE_ABSTRACT_UNIX_SOCKET if no_tcp and version >= 6 else 0)
    size = 24 if attr.scoped else 16 if attr.net else 8
    ruleset = libc.syscall(SYS_CREATE, ctypes.byref(attr), ctypes.c_size_t(size), ctypes.c_uint32(0))
    if ruleset < 0:
        sys.exit(f'landlock.py: create_ruleset errno {ctypes.get_errno()}')
    for place in reads:
        try:
            fd = os.open(place, os.O_PATH | os.O_CLOEXEC)
        except OSError:
            continue
        # A file takes file rights only.
        rights = handled if os.path.isdir(place) else EXECUTE | READ_FILE
        rule = PathBeneath(rights, fd)
        if libc.syscall(SYS_ADD, ctypes.c_int(ruleset), ctypes.c_int(1), ctypes.byref(rule), ctypes.c_uint32(0)) < 0:
            sys.exit(f'landlock.py: add_rule {place} errno {ctypes.get_errno()}')
        os.close(fd)
    if libc.prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0:
        sys.exit(f'landlock.py: no_new_privs errno {ctypes.get_errno()}')
    if libc.syscall(SYS_RESTRICT, ctypes.c_int(ruleset), ctypes.c_uint32(0)) < 0:
        sys.exit(f'landlock.py: restrict_self errno {ctypes.get_errno()}')
    os.close(ruleset)
    libc.prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)
    pid = os.fork()
    if pid == 0:
        os.setpgid(0, 0)
        try:
            os.execvp(cmd[0], cmd)
        except OSError as e:
            sys.stderr.write(f'landlock.py: exec {cmd[0]}: {e}\n')
        os._exit(127)
    # Also here, so a signal that comes before the child runs finds its group.
    try:
        os.setpgid(pid, pid)
    except OSError:
        pass
    def forward(number, frame):
        try:
            os.killpg(pid, number)
        except (ProcessLookupError, PermissionError):
            pass
    for number in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(number, forward)
    _, status = os.waitpid(pid, 0)
    stop_left()
    code = os.waitstatus_to_exitcode(status)
    if code >= 0:
        return code
    # Killed by a signal: end the same way, so the caller sees the signal.
    try:
        signal.signal(-code, signal.SIG_DFL)
    except (OSError, ValueError):
        pass
    os.kill(os.getpid(), -code)
    return 128 - code


def children(me):
    # The kernel's list of this process's children, where it keeps one.
    try:
        found = set()
        for task in os.listdir('/proc/self/task'):
            with open(f'/proc/self/task/{task}/children') as f:
                found.update(int(pid) for pid in f.read().split())
        return list(found)
    except OSError:
        pass
    # Else every process's parent. The fields after the command name, which
    # may hold spaces or parentheses.
    found = []
    for entry in os.listdir('/proc'):
        if not entry.isdigit():
            continue
        try:
            with open(f'/proc/{entry}/stat') as f:
                stat = f.read()
        except OSError:
            continue
        if int(stat[stat.rindex(')') + 2:].split()[1]) == me:
            found.append(int(entry))
    return found


# Every process left under the launcher: SIGTERM, then SIGKILL after a second.
# A process's own children are reparented here when it ends, so this repeats
# until none is left, for at most three seconds: a process in uninterruptible
# sleep is named and left.
def stop_left():
    me, start, number = os.getpid(), time.monotonic(), signal.SIGTERM
    while True:
        while True:
            try:
                done, _ = os.waitpid(-1, os.WNOHANG)
            except ChildProcessError:
                done = 0
            if done == 0:
                break
        left = children(me)
        if not left:
            return
        if time.monotonic() > start + 3:
            sys.stderr.write(f'landlock.py: processes {left} did not stop\n')
            return
        if time.monotonic() > start + 1:
            number = signal.SIGKILL
        for pid in left:
            try:
                os.kill(pid, number)
            except ProcessLookupError:
                pass
        time.sleep(0.05)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
