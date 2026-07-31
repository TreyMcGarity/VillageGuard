const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'out');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const requestUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  const relativePath = requestUrl === '/' ? '/index.html' : requestUrl;
  const filePath = path.join(root, relativePath);

  fs.stat(filePath, (error, stats) => {
    if (error) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.readFile(indexPath, (readError, data) => {
        if (readError) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }

        res.setHeader('Content-Type', mimeTypes['.html']);
        res.end(data);
      });
      return;
    }

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }

      res.setHeader('Content-Type', mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      res.end(data);
    });
  });
});

const port = 3002;
server.listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});