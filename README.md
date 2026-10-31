# nouman.ai — Project Lab

Noumann Syed's portfolio of playable projects, served by Cloudflare Workers (static assets).

## How changes ship

```
Ask Claude for a change
   → Claude edits on a branch (update/<name>) and runs the checks
   → pull request → Cloudflare posts a preview link on the PR + GitHub runs the checks
   → you review the preview and say "ship it"
   → Claude merges to main → Cloudflare deploys to https://nouman.ai
```

Nothing reaches `main` (production) without your approval. To undo a release, revert the merge commit (Claude can do this), or roll back to an earlier version in Cloudflare (Workers & Pages → nouman-lab → Deployments).

## Layout

| Path | What it is |
|---|---|
| `site/index.html` | The hub: cards, filters, project pages, Try it, docs |
| `site/projects.js` | The catalogue — one entry per project, including its docs |
| `site/projects/<id>.html` | Each playable project, a self-contained page |
| `site/thumbs/<id>.jpg` | Card screenshots (1280×800) |
| `lab.config.json` | Worker name, URLs, allowed external hosts, file-size limit |
| `wrangler.jsonc` | Cloudflare Worker config: serves `./site`, enables preview URLs |
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

## Cloudflare (Workers) setup

- Worker **nouman-lab**, connected to this repo with Workers Builds.
- Production branch **main** runs `npx wrangler deploy` and serves https://nouman.ai.
- Every other branch runs `npx wrangler preview` and gets a stable preview URL:
  `https://<branch-alias>-nouman-lab.noumannsyed.workers.dev`. For example, `update/neon-rider-boss` becomes `update-neon-rider-boss-nouman-lab.noumannsyed.workers.dev`.
  Cloudflare also posts the URL as a comment on the pull request.
- `wrangler.jsonc` must keep its `"previews": {}` block, because `wrangler preview` refuses to run without it.
