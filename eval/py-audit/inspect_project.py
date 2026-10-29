# Python census (eval/python-census.mjs): what a checked-out Python project
# declares. Prints one JSON object: the package manager, how to install it,
# and the test, typecheck and lint commands it runs, taken from its CI
# workflows, Makefile, tox.ini or configuration, in that order.
#
#   python3 inspect_project.py <checkout>
import json, os, re, shlex, sys, tomllib

root = sys.argv[1]
def read(rel):
    try:
        with open(os.path.join(root, rel), encoding='utf8', errors='replace') as f:
            return f.read()
    except OSError:
        return ''
def exists(rel): return os.path.exists(os.path.join(root, rel))
def norm(name): return re.sub(r'[-_.]+', '-', name.lower())

def reqnames(lines):
    out = set()
    for line in lines:
        line = line.split('#')[0].strip()
        m = re.match(r'([A-Za-z0-9][A-Za-z0-9._-]*)', line) if line and not line.startswith('-') else None
        if m: out.add(norm(m.group(1)))
    return out

pyproject = {}
try: pyproject = tomllib.loads(read('pyproject.toml')) if exists('pyproject.toml') else {}
except Exception as e: pyproject = {'_error': str(e)[:200]}
tool = pyproject.get('tool', {})
project = pyproject.get('project', {})
deps = reqnames(project.get('dependencies', []))
extras = sorted(project.get('optional-dependencies', {}))
for v in project.get('optional-dependencies', {}).values(): deps |= reqnames(v)
groups = sorted(pyproject.get('dependency-groups', {}))
for v in pyproject.get('dependency-groups', {}).values(): deps |= reqnames(x for x in v if isinstance(x, str))
poetry = tool.get('poetry', {})
deps |= {norm(k) for k in poetry.get('dependencies', {})} | {norm(k) for k in poetry.get('dev-dependencies', {})}
for g in poetry.get('group', {}).values(): deps |= {norm(k) for k in g.get('dependencies', {})}
deps |= reqnames(tool.get('uv', {}).get('dev-dependencies', []))
for v in tool.get('pdm', {}).get('dev-dependencies', {}).values(): deps |= reqnames(v)

requirements = []
for dirpath in ('.', 'requirements', 'reqs'):
    try: names = os.listdir(os.path.join(root, dirpath))
    except OSError: continue
    for n in sorted(names):
        rel = os.path.normpath(os.path.join(dirpath, n))
        if re.match(r'.*requirements.*\.txt$' if dirpath == '.' else r'.*\.txt$', n):
            requirements.append(rel)
            deps |= reqnames(read(rel).splitlines())

workflows = []
try: workflows = sorted(os.path.join('.github/workflows', n) for n in os.listdir(os.path.join(root, '.github/workflows')) if n.endswith(('.yml', '.yaml')))
except OSError: pass
ci = '\n'.join(read(w) for w in workflows)
make = '\n'.join(read(f) for f in ('Makefile', 'makefile', 'GNUmakefile', 'justfile', 'Justfile'))
tox = read('tox.ini')
nox = read('noxfile.py')
precommit = read('.pre-commit-config.yaml')
setup_cfg = read('setup.cfg')

locks = [pm for f, pm in (('uv.lock', 'uv'), ('poetry.lock', 'poetry'), ('pdm.lock', 'pdm'), ('Pipfile.lock', 'pipenv'), ('pixi.lock', 'pixi')) if exists(f)]
def package_manager():
    if locks: return locks[0]
    if 'poetry' in tool and poetry.get('dependencies') or re.search(r'\bpoetry (install|run)\b', ci + make): return 'poetry'
    if re.search(r'astral-sh/setup-uv|\buv (sync|run)\b', ci + make): return 'uv'
    if 'pdm' in tool or re.search(r'\bpdm (install|sync|run)\b', ci + make): return 'pdm'
    if exists('Pipfile'): return 'pipenv'
    if 'pixi' in tool or exists('pixi.toml'): return 'pixi'
    if exists('environment.yml') or exists('environment.yaml') or re.search(r'setup-miniconda|setup-micromamba', ci): return 'conda'
    if project or exists('setup.py') or exists('setup.cfg') or requirements: return 'pip'
    return None
pm = package_manager()

python = None
if exists('.python-version'): python = read('.python-version').split()[0] if read('.python-version').split() else None

# Commands: CI first, then Makefile/justfile, then tox, as users run them.
TOOLS = {'test': ['pytest', 'py.test', 'unittest'], 'typecheck': ['mypy', 'pyright', 'basedpyright', 'ty', 'pyrefly'],
         'lint': ['ruff', 'flake8', 'pylint']}
WRAPPERS = [['uv', 'run'], ['poetry', 'run'], ['pdm', 'run'], ['pipenv', 'run'], ['hatch', 'run'], ['pixi', 'run'], ['uvx'],
            ['python', '-m'], ['python3', '-m'], ['coverage', 'run', '-m']]
UNSAFE = re.compile(r'[$`{}|&;<>]')

def command_lines(text):
    lines, buf = [], ''
    for raw in text.splitlines():
        s = raw.strip()
        if s.endswith('\\'):
            buf += s[:-1] + ' '; continue
        lines.append((buf + s).strip()); buf = ''
    return lines

def parse(line, kind):
    s = re.sub(r'^(-\s*)?(run:\s*)?[|>]?\s*', '', line)
    s = re.sub(r'^@?-?', '', s) if s.startswith(('@', '-')) else s
    for sep in ('&&', ';', '||', '|'):
        parts = [p.strip() for p in s.split(sep)]
        hit = [p for p in parts if any(re.search(r'(^|\s|/)' + re.escape(t) + r'(\s|$)', p) for t in TOOLS[kind])]
        if hit: s = hit[0]
    try: words = shlex.split(s, comments=True)
    except ValueError: return None
    form = []
    while words:
        for w in WRAPPERS:
            if words[:len(w)] == w or (w[0].startswith('python') and re.fullmatch(r'python3?(\.\d+)?', words[0] or '') and words[1:2] == ['-m']):
                n = len(w) if words[:len(w)] == w else 2
                form += words[:n]; words = words[n:]
                # Wrapper options: uv run --group test --with x pytest ...
                while words and words[0].startswith('-'):
                    form.append(words.pop(0))
                    if words and not words[0].startswith('-') and form[-1] in ('--group', '--with', '--extra', '--python', '-p', '--env', '-e', '--from', '--package', '--directory'):
                        form.append(words.pop(0))
                break
        else: break
    if not words: return None
    name = os.path.basename(words[0])
    if name == 'py.test': name = 'pytest'
    if name == 'ty' and words[1:2] != ['check']: return None
    if name not in TOOLS[kind]: return None
    args = words[2:] if name == 'ty' else words[1:]
    if name == 'ruff' and args[:1] not in (['check'], []) : return None
    if name == 'ruff' and args[:1] == ['check']: args = args[1:]
    if name == 'pyrefly' and args[:1] == ['check']: args = args[1:]
    simple = not any(UNSAFE.search(a) for a in args)
    return {'tool': name, 'args': args if simple else None, 'form': ' '.join(form + [words[0]]), 'line': line.strip()[:200]}

scripts = {}
for d in ('scripts', 'script', 'bin', 'tools', 'ci'):
    try: names = sorted(os.listdir(os.path.join(root, d)))
    except OSError: continue
    for n in names:
        if n.endswith('.sh'): scripts[os.path.join(d, n)] = read(os.path.join(d, n))

def tox_text(text):
    text = re.sub(r'\{posargs:([^}]*)\}', r'\1', text)
    return re.sub(r'\{(posargs|toxinidir)\}', lambda m: '.' if m.group(1) == 'toxinidir' else '', text)

# A filtered or special-purpose run is a worse example of how tests run.
def penalty(c):
    a = c['args']
    if a is None: return 50
    p = 0
    if any(x in ('-k', '--lf', '--ff', '--codspeed', '--benchmark-only', '--collect-only', '--co') or x.startswith('--deselect') for x in a): p += 10
    if any(re.search(r'bench|memory|smoke|e2e|integration|doctest', x) for x in a): p += 8
    if any(x.endswith('.py') or '::' in x for x in a): p += 6
    if any(x.startswith('-o') for x in a): p += 3
    return p + {'ci': 0, 'script': 1, 'make': 2, 'tox': 3, 'nox': 4}[c['source']]

def found(kind):
    candidates = []
    sources = [('ci', ci, None), ('tox', tox_text(tox), None), ('nox', nox, None)] + [('script', t, f) for f, t in scripts.items()]
    for source, text, file in sources:
        for line in command_lines(text):
            if line.lstrip().startswith('#') or re.search(r'\b(pip|uv pip|uv add|pipx|poetry add|uv tool) install\b', line): continue
            line = re.sub(r'"?\$\{?@\}?"?', '', line)
            c = parse(line, kind)
            if c: candidates.append({**c, 'source': source, **({'file': file} if file else {})})
    target = None
    for line in command_lines(make):
        m = re.match(r'^([A-Za-z0-9_.-]+)\s*:(?!=)', line)
        if m: target = m.group(1); continue
        if not target or line.lstrip().startswith('#'): continue
        c = parse(line, kind)
        if c: candidates.append({**c, 'source': 'make', 'target': target})
    out = {}
    for c in sorted(candidates, key=lambda c: (penalty(c), len(c['args'] or []))):
        out.setdefault(c['tool'], {**c, 'penalty': penalty(c)})
    return out

def configured(name):
    if name == 'pytest': return 'pytest' in tool or exists('pytest.ini') or exists('conftest.py') or bool(re.search(r'^\[(tool:)?pytest\]', setup_cfg + tox, re.M)) or 'pytest' in deps
    if name == 'mypy': return 'mypy' in tool or exists('mypy.ini') or exists('.mypy.ini') or '[mypy' in setup_cfg or 'mypy' in deps or 'mirrors-mypy' in precommit
    if name == 'pyright': return 'pyright' in tool or exists('pyrightconfig.json') or 'pyright' in deps
    if name == 'basedpyright': return 'basedpyright' in tool or 'basedpyright' in deps
    if name == 'ty': return 'ty' in tool or exists('ty.toml') or 'ty' in deps
    if name == 'pyrefly': return 'pyrefly' in tool or exists('pyrefly.toml') or 'pyrefly' in deps
    if name == 'ruff': return 'ruff' in tool or exists('ruff.toml') or exists('.ruff.toml') or 'ruff' in deps or 'ruff' in precommit
    if name == 'flake8': return exists('.flake8') or '[flake8]' in setup_cfg + tox or 'flake8' in deps or 'flake8' in precommit
    if name == 'pylint': return 'pylint' in tool or exists('.pylintrc') or exists('pylintrc') or 'pylint' in deps
    return False

def test_files():
    n = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith('.') and d not in ('node_modules', 'venv', 'site-packages')]
        n += sum(bool(re.match(r'(test_.*|.*_test)\.py$', f)) for f in filenames)
        if n > 2000: break
    return n

checks = {}
for kind in ('test', 'typecheck', 'lint'):
    seen = found(kind)
    picks = []
    for name in TOOLS[kind]:
        if name == 'py.test': continue
        if name in seen: picks.append(seen[name])
        elif configured(name) and name != 'unittest': picks.append({'tool': name, 'args': None, 'form': None, 'line': None, 'source': 'config'})
    checks[kind] = picks

print(json.dumps({
    'pm': pm, 'locks': locks, 'python': python, 'requiresPython': project.get('requires-python') or (poetry.get('dependencies') or {}).get('python'),
    'project': bool(project), 'poetry': bool(poetry), 'setupPy': exists('setup.py'), 'extras': extras, 'groups': groups,
    'requirements': requirements, 'pyprojectError': pyproject.get('_error'),
    'pytestConfig': tool.get('pytest', {}).get('ini_options') or None, 'mypyFiles': tool.get('mypy', {}).get('files'),
    'testFiles': test_files(), 'checks': checks, 'workflows': len(workflows), 'tox': bool(tox), 'nox': bool(nox),
    'scripts': sorted(scripts), 'deps': sorted(d for d in deps if d.startswith('pytest') or d in ('hypothesis', 'mypy', 'pyright', 'basedpyright', 'ty', 'ruff', 'flake8', 'pylint',
        'coverage', 'responses', 'respx', 'vcrpy', 'moto', 'requests-mock', 'testcontainers', 'aioresponses', 'django', 'pyrefly')),
}))
