#!/usr/bin/env python3
"""HTTPS server for mobile camera testing (getUserMedia needs secure context)."""
import http.server
import socketserver
import ssl
import subprocess
import os
from pathlib import Path

PORT = 8443
DIR = Path(__file__).parent / "public"

# انسخ ملفات الجذر إلى public قبل التشغيل — حتى تشوف آخر تعديل
import shutil
for _f in ("index.html", "daab-pose.js"):
    _src = Path(__file__).parent / _f
    if _src.exists():
        shutil.copyfile(_src, DIR / _f)
# خارج public/ — وإلا يُرفع المفتاح الخاص مع الموقع عند النشر
CERT_DIR = Path(__file__).parent / ".certs"
CERT = CERT_DIR / "cert.pem"
KEY = CERT_DIR / "key.pem"


def ensure_cert():
    if CERT.exists() and KEY.exists():
        return
    CERT_DIR.mkdir(exist_ok=True)
    print("Creating self-signed certificate (first time only)...")
    subprocess.run(
        [
            "openssl", "req", "-x509", "-newkey", "rsa:2048",
            "-keyout", str(KEY), "-out", str(CERT),
            "-days", "365", "-nodes", "-subj", "/CN=localhost",
        ],
        check=True,
    )


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIR), **kwargs)

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".task": "application/octet-stream",
        ".js": "application/javascript",
    }


def local_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "YOUR-IP"


if __name__ == "__main__":
    if not DIR.is_dir():
        print("مجلد public/ غير موجود — شغّلي sync-design.sh أو انسخي index.html إلى public/")
        raise SystemExit(1)
    os.chdir(DIR)
    ensure_cert()
    ip = local_ip()

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(str(CERT), str(KEY))
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
        print(f"\n  Mac:    https://localhost:{PORT}")
        print(f"  Mobile: https://{ip}:{PORT}")
        print(f"  (accept security warning on phone)\n")
        httpd.serve_forever()
