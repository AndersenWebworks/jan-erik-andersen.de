import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const port = Number(process.argv[2] || 5500);
const rootDir = process.cwd();

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end();
    return;
  }

  const parsed = new URL(req.url, `http://127.0.0.1:${port}`);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';

  const relative = pathname.replace(/^\/+/, '').replace(/\//g, path.sep);
  const filePath = path.resolve(rootDir, relative);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403).end();
    return;
  }

  serveFile(filePath, res);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static test server listening on http://127.0.0.1:${port}\n`);
});

function serveFile(filePath, res) {
  fs.stat(filePath, (statErr, stat) => {
    if (statErr) {
      res.writeHead(404).end();
      return;
    }

    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.stat(finalPath, (finalErr) => {
      if (finalErr) {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeType(finalPath) });
      fs.createReadStream(finalPath).pipe(res);
    });
  });
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}
