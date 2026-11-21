"""Local development server with Vercel-style SPA route fallback. Run: python3 dev_server.py"""
import http.server
import os
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith('/api/'):
            self.send_error(501, 'API routes run on Vercel; test submissions on your deployment.')
            return
        local = ROOT / path.lstrip('/')
        if path != '/' and not local.is_file() and not local.is_dir():
            self.path = '/index.html'
        super().do_GET()

if __name__ == '__main__':
    print('Open http://localhost:8000 — Ctrl+C to stop')
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
