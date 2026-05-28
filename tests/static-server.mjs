import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const port = Number(process.argv[2] || 5500);
const rootDir = process.cwd();
const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end();
    return;
  }

  let pathname;
  try {
    const parsed = new URL(req.url, `http://127.0.0.1:${port}`);
    pathname = decodeURIComponent(parsed.pathname);
  } catch (error) {
    process.stderr.write(`Bad request URL: ${req.url} ${error.message}\n`);
    res.writeHead(400).end();
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';

  const relative = pathname.replace(/^\/+/, '').replace(/\//g, path.sep);
  const filePath = path.resolve(rootDir, relative);

  if (filePath !== rootDir && !filePath.startsWith(rootPrefix)) {
    res.writeHead(403).end();
    return;
  }

  serveFile(filePath, res);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static test server listening on http://127.0.0.1:${port}\n`);
});

server.on('clientError', (error, socket) => {
  process.stderr.write(`Client error: ${error.message}\n`);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', (error) => {
  process.stderr.write(`Static test server error: ${error.message}\n`);
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

      const stream = fs.createReadStream(finalPath);
      stream.on('error', (error) => {
        process.stderr.write(`Read error for ${finalPath}: ${error.message}\n`);
        if (!res.headersSent) {
          res.writeHead(500).end();
        } else {
          res.destroy(error);
        }
      });

      res.writeHead(200, { 'Content-Type': mimeType(finalPath) });
      stream.pipe(res);
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
