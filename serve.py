#!/usr/bin/env python3
"""Local dev server — يخدم مجلد public/ (تصميم دأب)."""
import http.server
import os
import socketserver

PORT = 8080
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".task": "application/octet-stream",
        ".js": "application/javascript",
    }

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        ip = "YOUR-IP"
    print(f"Serving at http://localhost:{PORT}")
    print(f"Mobile needs HTTPS — run: python3 serve_https.py")
    print(f"Then open on phone: https://{ip}:8443")
    httpd.serve_forever()
