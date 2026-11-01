# Research (netprobe.py): loopback, IPv6 loopback, a remote host and DNS from inside a sandbox.
import socket, sys, threading
r = {}
try:
    s = socket.socket(); s.bind(('127.0.0.1', 0)); s.listen(1); port = s.getsockname()[1]
    t = threading.Thread(target=lambda: s.accept(), daemon=True); t.start()
    c = socket.create_connection(('127.0.0.1', port), timeout=3); c.close(); r['loopback'] = 'ok'
except OSError as e: r['loopback'] = str(e)
try:
    s6 = socket.socket(socket.AF_INET6); s6.bind(('::1', 0)); s6.listen(1); r['loopback6'] = 'ok'
except OSError as e: r['loopback6'] = str(e)
try:
    socket.create_connection(('1.1.1.1', 443), timeout=3).close(); r['remote'] = 'connected'
except OSError as e: r['remote'] = str(e)
try:
    socket.getaddrinfo('example.com', 443); r['dns'] = 'resolved'
except OSError as e: r['dns'] = str(e)
print(r)
