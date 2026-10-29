# Research prototype for the Python census (eval/python-census.mjs), not part
# of the package: what an audit hook loaded through sitecustomize sees of a
# Python run. Loaded when this directory is on PYTHONPATH and
# REDUE_PY_AUDIT_DIR names a directory; each process writes <pid>.jsonl there.
import os, sys

def _install():
    out_dir = os.environ.get('REDUE_PY_AUDIT_DIR')
    if not out_dir:
        return
    import json, atexit
    state = {'pid': None, 'file': None, 'busy': False}

    def target():
        if state['pid'] != os.getpid():
            # Opening the log raises an audit event too.
            state['busy'] = True
            try:
                state['pid'] = os.getpid()
                state['file'] = open(os.path.join(out_dir, f'{state["pid"]}.jsonl'), 'a', buffering=1 << 16)
                state['file'].write(json.dumps(['start', sys.executable, sys.argv[:8], os.getcwd(), sys.prefix, sys.base_prefix, sys.version.split()[0]]) + '\n')
            finally:
                state['busy'] = False
        return state['file']

    def text(value):
        if isinstance(value, bytes):
            return os.fsdecode(value)
        return value if isinstance(value, str) else None

    def log(*record):
        if state['busy']:
            return
        try:
            target().write(json.dumps(record, default=str) + '\n')
        except Exception:
            pass

    seen_env = set()
    def flush():
        try:
            state['file'] and state['file'].flush()
        except Exception:
            pass

    def hook(event, args):
        if event == 'open':
            path = text(args[0])
            if path is not None:
                log('open', os.path.join(os.getcwd(), path) if not os.path.isabs(path) else path, args[1] if len(args) > 1 else None)
        elif event in ('os.listdir', 'os.scandir'):
            path = text(args[0]) if args and args[0] is not None else '.'
            if path is not None:
                log('list', os.path.join(os.getcwd(), path) if not os.path.isabs(path) else path)
        elif event == 'os.chdir':
            log('chdir', text(args[0]))
        elif event in ('subprocess.Popen', 'os.exec', 'os.posix_spawn', 'os.spawn', 'os.system'):
            flush()
            log('exec', event, [text(a) for a in (args[1] if event != 'os.system' and len(args) > 1 and isinstance(args[1], (list, tuple)) else args[:1])][:12],
                text(args[0]) if args else None)
            flush()
        elif event in ('socket.connect', 'socket.sendto', 'socket.bind'):
            log('net', event, str(args[1])[:120] if len(args) > 1 else None)
        elif event == 'socket.getaddrinfo':
            log('net', event, str(args[0])[:120])
        elif event in ('os.remove', 'os.rename', 'os.mkdir', 'os.rmdir', 'os.truncate', 'os.utime', 'os.chmod', 'os.link', 'os.symlink'):
            log('write', event, text(args[0]) if args else None)
        elif event == 'ctypes.dlopen':
            log('dlopen', text(args[0]) if args else None)
        elif event == 'os.fork':
            flush()

    # os.stat and friends raise no audit event; wrap the Python-level names.
    posix_stat = os.stat
    def wrap(module, name, kind):
        original = getattr(module, name)
        def wrapper(path, *a, **k):
            p = text(path) if not isinstance(path, int) else None
            if p is not None:
                log(kind, os.path.join(os.getcwd(), p) if not os.path.isabs(p) else p)
            return original(path, *a, **k)
        setattr(module, name, wrapper)
    for name in ('stat', 'lstat', 'access', 'readlink'):
        wrap(os, name, 'stat')

    # Environment reads: os.environ is a mapping read through __getitem__.
    Env = type(os.environ)
    get = Env.__getitem__
    def getitem(self, key):
        if key not in seen_env:
            seen_env.add(key)
            log('env', key)
        return get(self, key)
    Env.__getitem__ = getitem
    iterate = Env.__iter__
    def every(self):
        if '*' not in seen_env:
            seen_env.add('*')
            # Who copies the whole environment: the first frames outside os.
            frames, f = [], sys._getframe(1)
            while f and len(frames) < 4:
                name = f.f_code.co_filename
                if not name.endswith(('/os.py', '/_collections_abc.py')) and not name.startswith('<frozen'):
                    frames.append(f'{name}:{f.f_code.co_name}')
                f = f.f_back
            log('env', '*', frames)
        return iterate(self)
    Env.__iter__ = every

    def at_exit():
        files = []
        for m in list(sys.modules.values()):
            f = getattr(m, '__file__', None)
            if isinstance(f, str):
                files.append(f)
        log('modules', files)
        flush()
    atexit.register(at_exit)
    # Multiprocessing and xdist workers leave through os._exit, which skips
    # atexit and would drop what is still buffered.
    exit_now = os._exit
    def _exit(code):
        at_exit()
        exit_now(code)
    os._exit = _exit
    target()
    os.register_at_fork(after_in_child=lambda: state.update(pid=None, file=None))
    sys.addaudithook(hook)
    # A marker for strace (eval/python-census.mjs): the hook sees what follows.
    try:
        posix_stat('/.redue-py-audit-ready')
    except OSError:
        pass

_install()
del _install

# Load the sitecustomize this one shadows, if any.
def _chain():
    import importlib.util
    here = os.path.dirname(os.path.abspath(__file__))
    rest = [p for p in sys.path if os.path.abspath(p or '.') != here]
    spec = importlib.machinery.PathFinder.find_spec('sitecustomize', rest)
    if spec and spec.origin and os.path.dirname(os.path.abspath(spec.origin)) != here:
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
_chain()
del _chain
