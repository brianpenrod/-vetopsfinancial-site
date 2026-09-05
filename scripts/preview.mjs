// Dependency-free local preview for this static site. Not a production server.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const port = Number(option('--port', '4173'));
const host = option('--host', '0.0.0.0');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.mp4':'video/mp4', '.ico':'image/x-icon' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/_qa/mobile') {
      const destination = url.searchParams.get('page') === 'product' ? '/margincommand' : '/';
      const width = url.searchParams.get('width') === '320' ? 320 : 390;
      res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' });
      res.end(`<!doctype html><html><head><title>Responsive preview</title><style>body{margin:0;background:#e9edf3}iframe{display:block;width:${width}px;height:844px;border:0}</style></head><body><iframe title="Mobile website preview" src="${destination}"></iframe></body></html>`);
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Not found');
    let target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Not found');
    if (pathname.endsWith('/')) target = path.join(target, 'index.html');
    else if (!path.extname(target)) target += '.html';
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not found');
    const bytes = await readFile(target);
    const headers = { 'Content-Type':mime[path.extname(target)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-store' };
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1);
      if (start > end) { res.writeHead(416, { 'Content-Range':`bytes */${bytes.length}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Length':end-start+1, 'Content-Range':`bytes ${start}-${end}/${bytes.length}` });
      res.end(bytes.subarray(start, end + 1));
    } else {
      res.writeHead(200, { ...headers, 'Content-Length':bytes.length });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    }
  } catch {
    res.writeHead(404, { 'Content-Type':'text/plain' }); res.end('Not found');
  }
}).listen(port, host, () => console.log(`Static site preview listening on port ${port}`));
