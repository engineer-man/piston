import signal
import sys
import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler


def signal_handler(sig, frame):
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
