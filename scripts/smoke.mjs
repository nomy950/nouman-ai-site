// Browser checks: the portfolio home renders, the Playground lists every project, each detail/docs page opens,
// and every playable project loads without JavaScript errors.
// Usage: node scripts/smoke.mjs [--only <id>] [--url <base url>]
//   --url tests a deployed site (preview or production) instead of the local folder.
//   Screenshots land in .check-output/ for review.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, loadProjects, loadPlaywright, maybeRouteOffline, isPlayable } from './lib.mjs';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = opt('--only'), remote = opt('--url');
const OUT = path.join(ROOT, '.check-output'); fs.mkdirSync(OUT, { recursive: true });

const projects = loadProjects();
const { chromium } = loadPlaywright();
const srv = remote ? { url: remote.replace(/\/$/, ''), close() { } } : await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const failures = [];
const fail = m => { failures.push(m); console.log('  FAIL  ' + m); };
const ok = m => console.log('  ok    ' + m);

async function newPage(vp = { width: 1280, height: 800 }) {
  const page = await browser.newPage({ viewport: vp });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  // A script that fails to load (e.g. a CDN module) breaks the page silently; treat it as an error.
  page.on('requestfailed', r => { if (r.resourceType() === 'script') errs.push('script failed to load: ' + r.url()); });
  page.on('response', r => { if (r.request().resourceType() === 'script' && r.status() >= 400) errs.push(`script ${r.status()}: ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  if (!remote) await maybeRouteOffline(page);
  return { page, errs };
}

try {
  // 1. Portfolio home
  for (const vp of [{ width: 1280, height: 900, n: 'desktop' }, { width: 390, height: 844, n: 'mobile' }]) {
    const { page, errs } = await newPage(vp);
    await page.goto(srv.url + '/', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const jobs = await page.locator('#home .job').count();
    const homeVisible = await page.locator('#home').isVisible();
    homeVisible && jobs > 0 ? ok(`home (${vp.n}) shows the portfolio (${jobs} roles)`) : fail(`home (${vp.n}) portfolio not visible`);
    const feat = await page.locator('#featGrid a.feat').count();
    feat > 0 ? ok(`home (${vp.n}) features ${feat} Playground projects`) : fail(`home (${vp.n}) has no featured projects`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2) fail(`home (${vp.n}) scrolls sideways by ${overflow}px`);
    await page.screenshot({ path: path.join(OUT, `home-${vp.n}.png`), fullPage: true });
    errs.length ? fail(`home (${vp.n}) errors: ${errs.join(' | ')}`) : null;
    await page.close();
  }

  // 2. Playground hub
  for (const vp of [{ width: 1280, height: 900, n: 'desktop' }, { width: 390, height: 844, n: 'mobile' }]) {
    const { page, errs } = await newPage(vp);
    await page.goto(srv.url + '/#playground', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const cards = await page.locator('a.card').count();
    cards === projects.length ? ok(`playground (${vp.n}) shows ${cards} cards`) : fail(`playground (${vp.n}) shows ${cards} cards, expected ${projects.length}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2) fail(`playground (${vp.n}) scrolls sideways by ${overflow}px`);
    await page.screenshot({ path: path.join(OUT, `playground-${vp.n}.png`), fullPage: true });
    errs.length ? fail(`playground (${vp.n}) errors: ${errs.join(' | ')}`) : null;
    await page.close();
  }

  // 3. Each project: detail page, docs tab, and the game itself
  for (const p of projects) {
    if (only && p.id !== only) continue;
    const { page, errs } = await newPage({ width: 390, height: 844 });
    await page.goto(`${srv.url}/#${p.id}`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const title = await page.locator('#detail h1').textContent().catch(() => null);
    title === p.title ? ok(`${p.id}: detail page`) : fail(`${p.id}: detail page title is "${title}"`);
    if (isPlayable(p)) {
      // The Try it player must be visible and Launch must put the game on screen.
      const launch = page.locator('#detail #launch');
      if (!(await launch.isVisible())) fail(`${p.id}: Launch button is not visible`);
      else {
        await launch.click(); await page.waitForTimeout(300);
        const box = await page.locator('#detail .stage iframe').boundingBox().catch(() => null);
        box && box.width > 100 && box.height > 100 ? ok(`${p.id}: Launch shows the game (${Math.round(box.width)}×${Math.round(box.height)})`) : fail(`${p.id}: Launch did not show the game on screen`);
        await page.locator('#detail .stage').evaluate(el => { el.innerHTML = ''; }); // stop the game before the docs check
      }
    }
    await page.locator('.tab[data-tab="docs"]').click();
    await page.waitForTimeout(200);
    const sections = await page.locator('.doc h2').count();
    sections >= 2 ? ok(`${p.id}: docs (${sections} sections)`) : fail(`${p.id}: docs has ${sections} sections`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2) fail(`${p.id}: docs page scrolls sideways on mobile by ${overflow}px`);
    await page.screenshot({ path: path.join(OUT, `${p.id}-docs-mobile.png`) });
    if (errs.length) fail(`${p.id}: detail errors: ${errs.join(' | ')}`);
    await page.close();

    if (!isPlayable(p)) continue;
    const g = await newPage();
    await g.page.goto(`${srv.url}/${p.file}`, { waitUntil: 'load' });
    await g.page.waitForTimeout(Number(process.env.GAME_WAIT || 4000));
    const hasCanvas = await g.page.locator('canvas').count();
    hasCanvas ? ok(`${p.id}: game renders`) : fail(`${p.id}: no <canvas> found after load`);
    if (g.errs.length) fail(`${p.id}: game errors: ${g.errs.slice(0, 3).join(' | ')}`);
    await g.page.screenshot({ path: path.join(OUT, `${p.id}-game.png`) });
    await g.page.close();
  }
} finally {
  await browser.close(); srv.close();
}
console.log(failures.length ? `\n✗ smoke: ${failures.length} failure(s). Screenshots in .check-output/` : `✓ smoke: all checks passed against ${remote || 'local site'}. Screenshots in .check-output/`);
process.exit(failures.length ? 1 : 0);
