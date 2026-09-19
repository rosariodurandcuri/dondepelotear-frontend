#!/usr/bin/env python3
"""
Servidor local para ChapaTuCancha (no requiere instalar nada).
Uso:   python3 serve.py          → abre http://localhost:5173
       python3 serve.py 8080     → usa otro puerto
       PORT=8080 python3 serve.py → también acepta la variable de entorno PORT
"""
import os
import sys
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    # Evita que el navegador guarde versiones antiguas de los archivos mientras desarrollas
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print(f"ChapaTuCancha corriendo en http://localhost:{PORT}  (Ctrl+C para detener)")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
