#!/usr/bin/env python3
# The sandboxed recipe's Linux launcher (src/sandbox.mjs): runs a command
# under a Landlock ruleset (Linux >= 5.13), with the standard library only.
# Reads and executes are allowed beneath the --read paths; with --no-tcp
# (ABI >= 4), every TCP bind and connect is refused, and (ABI >= 6) so is a
# connection to an abstract Unix socket outside the run. Writes are not
# handled, so they are not restricted.
#
# --loopback (a test run) leaves TCP to a seccomp filter in the command's
# process instead. Sockets other than Unix, netlink and inet TCP streams are
# refused when they are created, and so are sendto, sendmsg and sendmmsg with
# MSG_FASTOPEN (a connect without connect), io_uring_setup, and any foreign
# architecture's or x32 system call. Every connect goes to the launcher
# (seccomp user notification). It lets through AF_UNSPEC, an unnamed or
# abstract Unix socket, a Unix socket file beneath a --write place, and the
# local host (loopback, 0.0.0.0, ::) on a port no process listens on or one
# of the run's own processes listens on: not a service started outside the
# run. It refuses the rest. Nothing else goes through the launcher, so worker
# processes' IPC is untouched; bind is allowed anywhere.
#
# --deny-write PATH (a test run's /tmp and /var/tmp) handles writes too: they
# are allowed everywhere but beneath those paths, and beneath each --write
# PATH (the run's own temporary directory).
#
# --hide PATH keeps the run from reading or executing beneath PATH, inside a
# --read place. Landlock only grants, beneath a whole directory, so such a
# place gets listing rights (beneath it all, hidden entries included) and
# read and execute rights on each of its entries that is not hidden and
# holds nothing hidden, descending into the ones that do. A hidden path can
# still be listed and stat'ed. --stats FILE writes the rule count and the
# time the rules took, as JSON; with --loopback, rewritten when the command
# ends with `supervisor`: "ok" when it served the whole run, else what went
# wrong. A missing or other value means the network was not supervised.
#
# The launcher stays as the command's parent and a child subreaper: when the
# command exits, it stops every process the command left running, daemons
# that started their own session included (they are reparented to it), as a
# CI job's end does. The command runs in its own process group; a signal the
# launcher gets is passed to that group once. The launcher then ends as the
# command did: with its exit status, or by its signal.
#
#   landlock.py --read /usr --read /tmp ... [--hide P ...] [--stats F] [--no-tcp | --loopback]
#               [--deny-write P ... --write P ...] -- cmd args...
#   landlock.py --probe     # prints {"abi": N} or {"abi": null, "errno": E}
import ctypes
import errno
import json
import os
import select
import signal
import socket
import sys
import threading
import time

SYS_CREATE, SYS_ADD, SYS_RESTRICT = 444, 445, 446  # the same on x86_64 and aarch64
EXECUTE, READ_FILE, READ_DIR = 1 << 0, 1 << 2, 1 << 3
# Writing, making and removing files, renaming across directories (ABI 2), truncating (ABI 3).
WRITE = sum(1 << bit for bit in (1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14))
BIND_TCP, CONNECT_TCP = 1 << 0, 1 << 1
SCOPE_ABSTRACT_UNIX_SOCKET = 1 << 0
PR_SET_NO_NEW_PRIVS, PR_SET_CHILD_SUBREAPER = 38, 36

libc = ctypes.CDLL(None, use_errno=True)
libc.syscall.restype = ctypes.c_long
libc.ioctl.argtypes = [ctypes.c_int, ctypes.c_ulong, ctypes.c_void_p]

# The seccomp filter --loopback installs, per architecture: its audit value
# and the system calls it looks at.
ARCH = {'x86_64': (0xC000003E, {'socket': 41, 'connect': 42, 'sendto': 44, 'sendmsg': 46, 'sendmmsg': 307,
                                'io_uring_setup': 425, 'seccomp': 317}),
        'aarch64': (0xC00000B7, {'socket': 198, 'connect': 203, 'sendto': 206, 'sendmsg': 211, 'sendmmsg': 269,
                                 'io_uring_setup': 425, 'seccomp': 277})}
AF_UNSPEC, AF_UNIX, AF_INET, AF_INET6, AF_NETLINK = 0, 1, 2, 10, 16
SOCK_STREAM, IPPROTO_TCP, IPPROTO_MPTCP, MSG_FASTOPEN = 1, 6, 262, 0x20000000
RET_ALLOW, RET_NOTIFY, RET_ERRNO = 0x7fff0000, 0x7fc00000, 0x00050000
LD, JEQ, JGE, JSET, AND, RET = 0x20, 0x15, 0x35, 0x45, 0x54, 0x06
SECCOMP_SET_MODE_FILTER, SECCOMP_FILTER_FLAG_NEW_LISTENER, SECCOMP_USER_NOTIF_FLAG_CONTINUE = 1, 1 << 3, 1
NOTIF_RECV, NOTIF_SEND, NOTIF_ID_VALID, NOTIF_ID_VALID_OLD = 0xc0502100, 0xc0182101, 0x40082102, 0x80082102


class SockFilter(ctypes.Structure):
    _fields_ = [('code', ctypes.c_uint16), ('jt', ctypes.c_uint8), ('jf', ctypes.c_uint8), ('k', ctypes.c_uint32)]


class SockFprog(ctypes.Structure):
    _fields_ = [('len', ctypes.c_ushort), ('filter', ctypes.POINTER(SockFilter))]


class SeccompData(ctypes.Structure):
    _fields_ = [('nr', ctypes.c_int), ('arch', ctypes.c_uint32), ('ip', ctypes.c_uint64), ('args', ctypes.c_uint64 * 6)]


class Notif(ctypes.Structure):
    _fields_ = [('id', ctypes.c_uint64), ('pid', ctypes.c_uint32), ('flags', ctypes.c_uint32), ('data', SeccompData)]


class NotifResp(ctypes.Structure):
    _fields_ = [('id', ctypes.c_uint64), ('val', ctypes.c_int64), ('error', ctypes.c_int32), ('flags', ctypes.c_uint32)]


def filter_program(machine):
    # Little-endian: an argument's low 32 bits are at 16 + 8 * index.
    audit, nr = ARCH[machine]
    program, labels = [], {}
    def op(code, k, jt=None, jf=None):
        program.append([code, jt, jf, k])
    def label(name):
        labels[name] = len(program)
    op(LD, 4); op(JEQ, audit, None, 'deny')
    op(LD, 0)
    if machine == 'x86_64':
        op(JGE, 0x40000000, 'deny')
    op(JEQ, nr['connect'], 'notify'); op(JEQ, nr['io_uring_setup'], 'deny'); op(JEQ, nr['socket'], 'socket')
    op(JEQ, nr['sendto'], 'flags3'); op(JEQ, nr['sendmmsg'], 'flags3'); op(JEQ, nr['sendmsg'], 'flags2')
    op(RET, RET_ALLOW)
    # Unix and netlink sockets; inet only as TCP (or MPTCP) streams, which reach a host through connect alone.
    label('socket'); op(LD, 16)
    op(JEQ, AF_UNIX, 'allow'); op(JEQ, AF_NETLINK, 'allow'); op(JEQ, AF_INET, 'inet'); op(JEQ, AF_INET6, 'inet'); op(RET, RET_ERRNO | errno.EPERM)
    label('inet'); op(LD, 24); op(AND, 0xf); op(JEQ, SOCK_STREAM, 'protocol', 'deny')
    label('protocol'); op(LD, 32); op(JEQ, 0, 'allow'); op(JEQ, IPPROTO_TCP, 'allow'); op(JEQ, IPPROTO_MPTCP, 'allow', 'deny')
    label('flags3'); op(LD, 16 + 8 * 3); op(JSET, MSG_FASTOPEN, 'deny', 'allow')
    label('flags2'); op(LD, 16 + 8 * 2); op(JSET, MSG_FASTOPEN, 'deny', 'allow')
    label('allow'); op(RET, RET_ALLOW)
    label('notify'); op(RET, RET_NOTIFY)
    label('deny'); op(RET, RET_ERRNO | errno.EPERM)
    jump = lambda at, name: labels[name] - at - 1 if name else 0
    return [SockFilter(code, jump(at, jt), jump(at, jf), k) for at, (code, jt, jf, k) in enumerate(program)]


# In the command's process, before exec: the filter, and its listener for the launcher.
def install_filter():
    machine = os.uname().machine
    if machine not in ARCH:
        raise OSError(f'no seccomp filter for {machine}')
    program = filter_program(machine)
    buffer = (SockFilter * len(program))(*program)
    fprog = SockFprog(len(program), ctypes.cast(buffer, ctypes.POINTER(SockFilter)))
    fd = libc.syscall(ARCH[machine][1]['seccomp'], SECCOMP_SET_MODE_FILTER, SECCOMP_FILTER_FLAG_NEW_LISTENER, ctypes.byref(fprog))
    if fd < 0:
        raise OSError(ctypes.get_errno(), f'seccomp: {os.strerror(ctypes.get_errno())}')
    return fd


# The run's processes: the launcher's descendants (it is their subreaper).
def run_processes(launcher):
    parents = {}
    for entry in os.listdir('/proc'):
        if entry.isdigit():
            try:
                with open(f'/proc/{entry}/stat') as f:
                    stat = f.read()
                parents[int(entry)] = int(stat[stat.rindex(')') + 2:].split()[1])
            except (OSError, ValueError, IndexError):
                pass
    def descends(pid, seen=0):
        while pid in parents and seen < 64:
            pid, seen = parents[pid], seen + 1
            if pid == launcher:
                return True
        return False
    return [pid for pid in parents if descends(pid)]


# Who listens on a local TCP port: None when nobody does, else whether one of
# the run's processes does.
def listener_in_run(port, launcher):
    inodes = set()
    for table in ('/proc/net/tcp', '/proc/net/tcp6'):
        try:
            with open(table) as f:
                rows = f.read().splitlines()[1:]
        except OSError:
            continue
        for row in rows:
            fields = row.split()
            if len(fields) > 9 and fields[3] == '0A' and int(fields[1].rsplit(':', 1)[1], 16) == port:
                inodes.add(fields[9])
    if not inodes:
        return None
    links = {f'socket:[{inode}]' for inode in inodes}
    for pid in run_processes(launcher):
        try:
            for fd in os.listdir(f'/proc/{pid}/fd'):
                try:
                    if os.readlink(f'/proc/{pid}/fd/{fd}') in links:
                        return True
                except OSError:
                    pass
        except OSError:
            pass
    return False


# Whether a process may connect to the address it names (see --loopback).
def connect_allowed(pid, address, length, places, launcher, ports):
    if not address or length < 2:
        return False
    try:
        fd = os.open(f'/proc/{pid}/mem', os.O_RDONLY | os.O_CLOEXEC)
        try:
            raw = os.pread(fd, min(length, 128), address)
        finally:
            os.close(fd)
    except OSError:
        return False
    family = int.from_bytes(raw[:2], sys.byteorder)
    if family == AF_UNSPEC:
        return True
    if family == AF_UNIX:
        name = raw[2:].split(b'\0', 1)[0] if len(raw) > 2 and raw[2] != 0 else b''
        if not name:
            return True
        try:
            target = os.path.realpath(os.path.join(os.readlink(f'/proc/{pid}/cwd'), os.fsdecode(name)))
        except OSError:
            return False
        return any(target == place or target.startswith(place.rstrip('/') + '/') for place in places)
    if family == AF_INET and len(raw) >= 8:
        local = raw[4] == 127 or raw[4:8] == bytes(4)
    elif family == AF_INET6 and len(raw) >= 24:
        host = raw[8:24]
        mapped = host[:12] == bytes(10) + b'\xff\xff'
        local = host in (bytes(15) + b'\x01', bytes(16)) or mapped and (host[12] == 127 or host[12:] == bytes(4))
    else:
        return False
    if not local:
        return False
    port = int.from_bytes(raw[2:4], 'big')
    if port in ports:
        return True
    owner = listener_in_run(port, launcher)
    if owner:
        ports.add(port)
    return owner is not False


# The launcher's side: every connect the command's processes make, until none is left.
def supervise(fd, state, places, die=False):
    def valid(id):
        value = ctypes.c_uint64(id)
        if libc.ioctl(fd, NOTIF_ID_VALID, ctypes.byref(value)) == 0:
            return True
        return ctypes.get_errno() in (errno.EINVAL, errno.ENOTTY) and libc.ioctl(fd, NOTIF_ID_VALID_OLD, ctypes.byref(value)) == 0
    launcher, ports = os.getpid(), set()
    places = [os.path.realpath(place) for place in places]
    try:
        poller = select.poll()
        poller.register(fd, select.POLLIN)
        while True:
            events = dict(poller.poll())
            if events.get(fd, 0) & select.POLLIN == 0:
                break
            notif = Notif()
            if libc.ioctl(fd, NOTIF_RECV, ctypes.byref(notif)) < 0:
                if ctypes.get_errno() in (errno.EINTR, errno.ENOENT):
                    continue
                raise OSError(ctypes.get_errno(), 'receive')
            if die:
                raise RuntimeError('test fault')
            allowed = connect_allowed(notif.pid, notif.data.args[1], notif.data.args[2], places, launcher, ports)
            state['connects'] = state.get('connects', 0) + 1
            if not valid(notif.id):
                continue
            response = NotifResp(notif.id, 0, 0 if allowed else -errno.EPERM, SECCOMP_USER_NOTIF_FLAG_CONTINUE if allowed else 0)
            if libc.ioctl(fd, NOTIF_SEND, ctypes.byref(response)) < 0 and ctypes.get_errno() != errno.ENOENT:
                raise OSError(ctypes.get_errno(), 'respond')
        state['supervisor'] = 'ok'
    except Exception as e:
        state['supervisor'] = f'failed: {e}'
        # A closed listener makes every later connect fail (ENOSYS).
        try:
            os.close(fd)
        except OSError:
            pass


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
    reads, hidden, stats, no_tcp, loopback, deny_write, writes, fault = [], set(), None, False, False, set(), [], None
    while argv and argv[0] != '--':
        if argv[0] == '--read':
            reads.append(argv[1]); argv = argv[2:]
        elif argv[0] == '--loopback':
            loopback = True; argv = argv[1:]
        elif argv[0] == '--deny-write':
            deny_write.add(os.path.normpath(argv[1])); argv = argv[2:]
        elif argv[0] == '--write':
            writes.append(argv[1]); argv = argv[2:]
        elif argv[0] == '--test-fault':
            # Tests only: the supervisor cannot start (unavailable) or stops at the first connect (die).
            fault = argv[1]; argv = argv[2:]
        elif argv[0] == '--hide':
            hidden.add(os.path.normpath(argv[1])); argv = argv[2:]
        elif argv[0] == '--stats':
            stats = argv[1]; argv = argv[2:]
        elif argv[0] == '--no-tcp':
            no_tcp = True; argv = argv[1:]
        else:
            sys.exit(f'landlock.py: unknown option {argv[0]}')
    cmd = argv[1:]
    version, err = abi()
    if version is None:
        sys.exit(f'landlock.py: Landlock unavailable (errno {err})')
    reading = EXECUTE | READ_FILE | READ_DIR
    handled = reading | (WRITE if deny_write else 0)
    attr = RulesetAttr(handled, (BIND_TCP | CONNECT_TCP) if no_tcp and version >= 4 else 0,
                       SCOPE_ABSTRACT_UNIX_SOCKET if (no_tcp or loopback) and version >= 6 else 0)
    size = 24 if attr.scoped else 16 if attr.net else 8
    ruleset = libc.syscall(SYS_CREATE, ctypes.byref(attr), ctypes.c_size_t(size), ctypes.c_uint32(0))
    if ruleset < 0:
        sys.exit(f'landlock.py: create_ruleset errno {ctypes.get_errno()}')
    started, count = time.monotonic(), 0
    def add(place, rights=None):
        nonlocal count
        try:
            fd = os.open(place, os.O_PATH | os.O_CLOEXEC)
        except OSError:
            return
        # A file takes file rights only.
        if rights is None:
            rights = reading if os.path.isdir(place) else EXECUTE | READ_FILE
        if not os.path.isdir(place):
            rights &= EXECUTE | READ_FILE | (1 << 1) | (1 << 14)
        rule = PathBeneath(rights, fd)
        if libc.syscall(SYS_ADD, ctypes.c_int(ruleset), ctypes.c_int(1), ctypes.byref(rule), ctypes.c_uint32(0)) < 0:
            sys.exit(f'landlock.py: add_rule {place} errno {ctypes.get_errno()}')
        os.close(fd)
        count += 1
    # The directories that hold an excluded path, up to the root.
    def holders_of(excluded):
        holders = set()
        for path in excluded:
            at = os.path.dirname(path)
            while at not in holders and at != os.path.dirname(at):
                holders.add(at); at = os.path.dirname(at)
        return holders
    # `rights` on every entry beneath `directory` but the excluded ones.
    def grant(directory, excluded, holders, rights):
        # Links are not followed: what they lead to is granted on its own or not at all.
        try:
            entries = list(os.scandir(directory))
        except OSError:
            return
        for entry in entries:
            if entry.path in excluded or entry.is_symlink():
                continue
            if entry.path in holders:
                grant(entry.path, excluded, holders, rights)
            else:
                add(entry.path, rights)
    holders = holders_of(hidden)
    for place in reads:
        place = os.path.normpath(place)
        if place in holders and os.path.isdir(place):
            add(place, READ_DIR)
            grant(place, hidden, holders, reading)
        else:
            add(place)
    if deny_write:
        grant('/', deny_write, holders_of(deny_write), WRITE)
        for place in writes:
            add(place, WRITE)
    state = {'rules': count, 'ms': round((time.monotonic() - started) * 1000, 1)}
    # Opened before the ruleset applies, so a write rule cannot refuse it later; not inherited.
    stats_fd = os.open(stats, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_CLOEXEC, 0o600) if stats else None
    def report():
        if stats_fd is not None:
            data = json.dumps(state).encode()
            os.ftruncate(stats_fd, 0)
            os.pwrite(stats_fd, data, 0)
    report()
    if libc.prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0:
        sys.exit(f'landlock.py: no_new_privs errno {ctypes.get_errno()}')
    if libc.syscall(SYS_RESTRICT, ctypes.c_int(ruleset), ctypes.c_uint32(0)) < 0:
        sys.exit(f'landlock.py: restrict_self errno {ctypes.get_errno()}')
    os.close(ruleset)
    libc.prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)
    # The command's process sends its filter's listener back over this pair.
    if loopback:
        state['supervisor'] = 'not started'
        report()
        parent_end, child_end = socket.socketpair()
    pid = os.fork()
    if pid == 0:
        os.setpgid(0, 0)
        if loopback:
            parent_end.close()
            try:
                if fault == 'unavailable':
                    raise OSError('test fault')
                listener = install_filter()
                socket.send_fds(child_end, [b'x'], [listener])
                os.close(listener)
                child_end.close()
            except OSError as e:
                # Never run the command unsupervised.
                sys.stderr.write(f'landlock.py: network supervisor unavailable: {e}\n')
                os._exit(125)
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
    supervisor = None
    if loopback:
        child_end.close()
        try:
            _, fds, _, _ = socket.recv_fds(parent_end, 1, 1)
        except OSError:
            fds = []
        parent_end.close()
        if fds:
            state['supervisor'] = 'running'
            supervisor = threading.Thread(target=supervise, args=(fds[0], state, writes, fault == 'die'), daemon=True)
            supervisor.start()
        else:
            state['supervisor'] = 'unavailable'
    _, status = os.waitpid(pid, 0)
    stop_left()
    # Every filtered process is gone: the supervisor sees its listener hang up.
    if supervisor:
        supervisor.join(5)
        if supervisor.is_alive():
            state['supervisor'] = 'did not end with the command'
    report()
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
