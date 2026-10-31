// Shared helpers for the Project Lab pipeline scripts.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'lab.config.json'), 'utf8'));
export const SITE = path.join(ROOT, CONFIG.siteDir);
const require = createRequire(import.meta.url);

/** Load window.PROJECTS from site/projects.js without a browser. */
export function loadProjects() {
  const code = fs.readFileSync(path.join(SITE, 'projects.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: 'projects.js' });
  if (!Array.isArray(sandbox.window.PROJECTS)) throw new Error('projects.js must assign an array to window.PROJECTS');
  return sandbox.window.PROJECTS;
}

/** Playwright: prefer the repo's install, fall back to a global one (NODE_PATH). */
export function loadPlaywright() {
  try { return require('playwright'); }
  catch (e) { throw new Error('Playwright not found. Run: npm install && npx playwright install chromium'); }
}

/** Minimal static server for the site folder. Resolves to { url, close }. */
export function serve(dir = SITE, port = 0) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(port, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

/**
 * If CDNs are unreachable (e.g. a sandboxed build box), serve three.js from node_modules
 * and drop other remote requests so pages still load. In CI with internet this is a no-op
 * unless OFFLINE=1 is set.
 */
export async function maybeRouteOffline(page) {
  if (process.env.OFFLINE !== '1') return;
  let threeDir = null;
  try { // 'three' blocks ./package.json in its exports, so walk up from the main entry
    let d = path.dirname(require.resolve('three'));
    while (!fs.existsSync(path.join(d, 'package.json'))) d = path.dirname(d);
    threeDir = d;
  } catch (e) { }
  await page.route('**/*', route => {
    const u = route.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)$/);
    if (m && threeDir) return route.fulfill({ path: path.join(threeDir, m[1]), contentType: 'application/javascript' });
    if (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
}

export const isPlayable = p => !!p.file;
