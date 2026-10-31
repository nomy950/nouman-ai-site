// Capture a card thumbnail for a project: site/thumbs/<id>.jpg (1280x800).
// Usage: node scripts/screenshot.mjs <id> [--click "<selector>"] [--wait <ms>] [--after <ms>]
//   --click   button to press first (e.g. the game's Start button) so the shot shows gameplay
//   --wait    ms to wait after load before clicking (default 3000)
//   --after   ms to wait after clicking before the shot (default 3000)
import path from 'node:path';
import { SITE, serve, loadProjects, loadPlaywright, maybeRouteOffline } from './lib.mjs';

const [id, ...rest] = process.argv.slice(2);
const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const p = loadProjects().find(x => x.id === id);
if (!p || !p.file) { console.error(`No playable project with id "${id}" in projects.js`); process.exit(1); }

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.log('page error:', e.message));
await maybeRouteOffline(page);
await page.goto(`${srv.url}/${p.file}`, { waitUntil: 'load' });
await page.waitForTimeout(Number(opt('--wait') || 3000));
if (opt('--click')) { await page.click(opt('--click')); await page.waitForTimeout(Number(opt('--after') || 3000)); }
const out = path.join(SITE, p.thumb || `thumbs/${id}.jpg`);
await page.screenshot({ path: out, type: 'jpeg', quality: 78 });
console.log('saved', path.relative(process.cwd(), out));
await browser.close(); srv.close();
