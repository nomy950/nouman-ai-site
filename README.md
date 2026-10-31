# nouman.ai — Project Lab

Noumann Syed's portfolio of playable projects, served from Cloudflare Pages.

## How changes ship

```
Ask Claude for a change
   → Claude edits on a branch (update/<name>) and runs the checks
   → pull request → Cloudflare builds a preview link + GitHub runs the checks
   → you review the preview and say "ship it"
   → Claude merges to main → Cloudflare deploys to https://nouman.ai
```

Nothing reaches `main` (production) without your approval. To undo a release, revert the merge commit (Claude can do this), or use **Rollback** on an earlier deployment in the Cloudflare dashboard.

## Layout

| Path | What it is |
|---|---|
| `site/index.html` | The hub: cards, filters, project pages, Try it, docs |
| `site/projects.js` | The catalogue — one entry per project, including its docs |
| `site/projects/<id>.html` | Each playable project, a self-contained page |
| `site/thumbs/<id>.jpg` | Card screenshots (1280×800) |
| `lab.config.json` | Pages project name, URLs, allowed external hosts, file-size limit |
| `scripts/` | `validate`, `smoke`, `screenshot` and `serve` |
| `.github/workflows/checks.yml` | Runs validate + smoke on every pull request |

## Commands

```bash
npm install && npx playwright install chromium   # once
npm run validate          # catalogue + files + allowed hosts
npm run smoke             # real browser: hub, every project page, every game
npm run smoke -- --url https://nouman.ai          # test the live site
npm run shot -- <id> --click "#play"              # retake a thumbnail
npm run serve             # local preview at http://127.0.0.1:8080
```

## Cloudflare Pages settings

- Framework preset: **None**
- Build command: *(leave empty)*
- Build output directory: **site**
- Production branch: **main** (every other branch gets a preview URL)
