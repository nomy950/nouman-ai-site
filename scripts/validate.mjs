// Static checks: catalogue entries are complete, files exist, pages only load allowed hosts.
// Usage: node scripts/validate.mjs        (exit code 1 on any error)
import fs from 'node:fs';
import path from 'node:path';
import { SITE, CONFIG, loadProjects, isPlayable } from './lib.mjs';

const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
const CATS = ['game', 'app', 'tool', 'doc', 'design'];
// Hash routes used by the portfolio and Playground views can't be project ids.
const RESERVED = ['settings', 'sidebar', 'customize', 'upgrade', 'downloads', 'playground', 'add', 'about', 'experience', 'skills', 'featured', 'contact', 'home'];
const NEED_PLAYABLE = ['id', 'title', 'cat', 'tagline', 'file', 'thumb', 'best', 'overview', 'how', 'controls', 'features', 'tech'];
const NEED_EXTERNAL = ['id', 'title', 'cat', 'tagline', 'external', 'art', 'extNote', 'overview'];

let projects = [];
try { projects = loadProjects(); } catch (e) { err(`projects.js does not load: ${e.message}`); }

const ids = new Set();
for (const p of projects) {
  const who = p.id || p.title || '(unnamed)';
  const need = isPlayable(p) ? NEED_PLAYABLE : NEED_EXTERNAL;
  for (const k of need) {
    const v = p[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) err(`${who}: missing "${k}"`);
  }
  if (p.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) err(`${who}: id must be lowercase letters, digits and hyphens`);
  if (p.id && (RESERVED.includes(p.id) || p.id.startsWith('comment-'))) err(`${who}: id "${p.id}" is reserved`);
  if (ids.has(p.id)) err(`${who}: duplicate id`); ids.add(p.id);
  if (p.cat && !CATS.includes(p.cat)) err(`${who}: cat must be one of ${CATS.join(', ')}`);
  if (p.tagline && p.tagline.length > 120) warn(`${who}: tagline is long (${p.tagline.length} chars); cards look best under 120`);
  if (p.controls) for (const r of p.controls) if (!Array.isArray(r) || r.length !== 3) err(`${who}: each controls row needs [action, keyboard, touch]`);
  for (const t of p.tables || []) for (const r of t.rows || []) if (r.length !== t.head.length) err(`${who}: table "${t.title}" row has ${r.length} cells, header has ${t.head.length}`);
  if (p.agent !== undefined && (typeof p.agent !== 'string' || !p.agent.trim())) err(`${who}: agent must be a non-empty string such as 'Claude'`);
  if (!p.agent) warn(`${who}: no "agent" set; it will show as built by Claude`);
  if (p.external && !/^https:\/\//.test(p.external)) err(`${who}: external must be an https URL`);

  for (const k of ['file', 'thumb']) {
    if (!p[k]) continue;
    const f = path.join(SITE, p[k]);
    if (!fs.existsSync(f)) { err(`${who}: ${k} "${p[k]}" not found in ${CONFIG.siteDir}/`); continue; }
    const size = fs.statSync(f).size;
    if (size > CONFIG.maxFileBytes) err(`${who}: ${p[k]} is ${(size / 1e6).toFixed(1)} MB (limit ${(CONFIG.maxFileBytes / 1e6).toFixed(1)} MB)`);
  }
  if (p.file && fs.existsSync(path.join(SITE, p.file))) checkHtml(path.join(SITE, p.file), who);
}

// Site-level checks
const index = path.join(SITE, 'index.html');
if (!fs.existsSync(index)) err('site/index.html is missing');
else {
  const html = fs.readFileSync(index, 'utf8');
  if (!html.includes('src="projects.js"')) err('index.html no longer loads projects.js');
  checkHtml(index, 'index.html');
}
// Orphans: files nobody references
const used = new Set(projects.flatMap(p => [p.file, p.thumb]).filter(Boolean));
for (const dir of ['projects', 'thumbs']) {
  const d = path.join(SITE, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (!used.has(`${dir}/${f}`)) warn(`${dir}/${f} is not used by any project`);
}

function checkHtml(f, who) {
  const html = fs.readFileSync(f, 'utf8');
  if (!/^\s*<!DOCTYPE html>/i.test(html)) err(`${who}: ${path.basename(f)} must start with <!DOCTYPE html>`);
  if (!/<title>[^<]+<\/title>/i.test(html)) err(`${who}: ${path.basename(f)} has no <title>`);
  const hosts = new Set([...html.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1].toLowerCase()));
  for (const h of hosts) if (!CONFIG.allowedExternalHosts.includes(h)) err(`${who}: ${path.basename(f)} loads from "${h}", which is not in lab.config.json allowedExternalHosts`);
}

for (const w of warnings) console.log('  warn  ' + w);
for (const e of errors) console.log('  FAIL  ' + e);
console.log(errors.length ? `\n✗ validate: ${errors.length} error(s), ${warnings.length} warning(s)` : `✓ validate: ${projects.length} projects OK${warnings.length ? `, ${warnings.length} warning(s)` : ''}`);
process.exit(errors.length ? 1 : 0);
