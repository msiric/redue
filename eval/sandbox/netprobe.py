# Research (census.mjs --probe-network): what a Linux runner allows for a test
# sandbox with loopback but no remote hosts, and a private /tmp. Prints JSON.
import json, os, subprocess, sys
def run(argv):
    try:
        r = subprocess.run(argv, capture_output=True, text=True, timeout=60)
        return {'status': r.returncode, 'out': (r.stdout + r.stderr).strip()[-400:]}
    except Exception as e:
        return {'error': str(e)[:200]}
def read(path):
    try:
        return open(path).read().strip()
    except OSError as e:
        return 'unreadable: %s' % e
here = os.path.dirname(os.path.abspath(__file__))
test = os.path.join(here, 'nettest.py')
out = {
    'kernel': os.uname().release,
    'apparmor_restrict_unprivileged_userns': read('/proc/sys/kernel/apparmor_restrict_unprivileged_userns'),
    'unprivileged_userns_clone': read('/proc/sys/kernel/unprivileged_userns_clone'),
    'max_user_namespaces': read('/proc/sys/user/max_user_namespaces'),
    'unshare_user_net': run(['unshare', '--user', '--map-root-user', '--net', 'sh', '-c', 'ip link set lo up 2>&1; python3 -I ' + test]),
    'unshare_user_net_mount_tmp': run(['unshare', '--user', '--map-root-user', '--net', '--mount', 'sh', '-c',
        'mount -t tmpfs tmpfs /tmp && touch /tmp/private && ls /tmp && ip link set lo up && python3 -I ' + test]),
    'plain': run(['python3', '-I', test]),
}
print(json.dumps(out))
