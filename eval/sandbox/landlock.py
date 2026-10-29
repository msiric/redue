#!/usr/bin/env python3
# Research launcher: run a command under a Landlock ruleset (Linux >= 5.13),
# with the standard library only. Reads and executes are allowed beneath the
# --read paths; with --no-tcp (ABI >= 4), every TCP bind and connect is
# refused. Writes are not handled, so they are not restricted.
#
#   landlock.py --read /usr --read /tmp ... [--no-tcp] -- cmd args...
#   landlock.py --probe     # prints {"abi": N} or {"abi": null, "errno": E}
import ctypes
import json
import os
import sys

SYS_CREATE, SYS_ADD, SYS_RESTRICT = 444, 445, 446  # the same on x86_64 and aarch64
EXECUTE, READ_FILE, READ_DIR = 1 << 0, 1 << 2, 1 << 3
BIND_TCP, CONNECT_TCP = 1 << 0, 1 << 1
PR_SET_NO_NEW_PRIVS = 38

libc = ctypes.CDLL(None, use_errno=True)
libc.syscall.restype = ctypes.c_long


class RulesetAttr(ctypes.Structure):
    _fields_ = [('fs', ctypes.c_uint64), ('net', ctypes.c_uint64)]


class PathBeneath(ctypes.Structure):
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
    attr = RulesetAttr(handled, (BIND_TCP | CONNECT_TCP) if no_tcp and version >= 4 else 0)
    size = ctypes.sizeof(attr) if attr.net else 8
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
    try:
        os.execvp(cmd[0], cmd)
    except OSError as e:
        sys.stderr.write(f'landlock.py: exec {cmd[0]}: {e}\n')
        return 127


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
