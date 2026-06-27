#!/usr/bin/env python3
"""Local dev server with correct MIME types for MediaPipe WASM."""
import http.server
import socketserver

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
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
