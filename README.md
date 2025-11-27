# Github Pages Project v1

Astro + Tailwind static site built for GitHub Pages with sitemap, RSS, structured data, a PWA manifest, and a quality gate script to keep deploys clean.

- Live: https://tariqdude.github.io/Github-Pages-Project-v1/
- Repo: https://github.com/tariqdude/Github-Pages-Project-v1
- Base path (production): `/Github-Pages-Project-v1/` (configurable in `astro.config.mjs`)

## Tech Stack

- Astro 5, TypeScript, TailwindCSS
- Content: Markdown/MDX, RSS, sitemap
- Testing: Vitest (unit), Playwright (e2e)
- Tooling: ESLint, Prettier, Husky + lint-staged

## Prerequisites

- Node 22+ (`.nvmrc` present)
- npm (lockfile v3)

## Setup

```sh
npm install
npm run dev          # http://localhost:4321
```

Recommended checks while developing:

```sh
npm run typecheck
npm run lint
npm run test         # unit
npm run test:e2e     # Playwright
```

## Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview the built site
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright e2e
- `npm run pre-deploy` — Critical error review + typecheck + lint + tests + build

## Environment Variables

Copy `.env.example` to `.env` as needed.

- `SITE_URL` — Canonical site URL (defaults to `https://tariqdude.github.io/Github-Pages-Project-v1/`).
- `BASE_PATH` — Optional override for the repo base path (defaults to Astro’s `BASE_URL`).

## Deployment (GitHub Pages)

- `astro.config.mjs` sets `base` to `/Github-Pages-Project-v1/` in production so assets resolve under the repo path.
- `site` defaults to `https://tariqdude.github.io/Github-Pages-Project-v1/`; override with `SITE_URL` if deploying elsewhere.
- Workflow: `.github/workflows/deploy.yml` builds and publishes `dist/` to Pages.
- PWA files (`public/manifest.json`, `public/sw.js`, `public/robots.txt`) use the same base path for icons, sitemap, and start URLs.
- Base-path sanity check: run `npm run build && npm run preview`, then load `http://localhost:4321/Github-Pages-Project-v1/` to ensure links and assets work under the repo path.

If you fork/rename:

1) Update `BASE_PATH`/`base` and `site` in `astro.config.mjs` to the new repo name.  
2) Update `SITE_URL` (and optionally `BASE_PATH`) in `.env.example` and your `.env`.  
3) Refresh URLs in `public/manifest.json`, `public/robots.txt`, and any CTA links in `src/consts.ts` or UI copy.

## Project Structure

- `src/` — Pages, components, layouts, content, utilities.
- `public/` — Static assets (favicons, manifest, robots.txt, service worker).
- `dist/` — Build output (generated).
- `e2e/` — Playwright tests.
- `test-results/` and `playwright-report/` — Test artifacts (generated).

## Quality Checklist

- `npm run pre-deploy` passes (critical error review, typecheck, lint, tests, build).
- Links and assets work under `/Github-Pages-Project-v1/` (verify with `npm run preview`).
- Manifest and service worker resolve icons under the repo base path.
- Sitemap points to the correct Pages URL.
- Playwright e2e can run headed with `npm run test:e2e:headed` when debugging interactions.

## Troubleshooting

- Missing icons: ensure `public/favicon-192.png` and `public/favicon-512.png` exist (generated from `public/favicon.svg`).
- Broken links on Pages: confirm `BASE_PATH`/`base` matches the repo path and rerun `npm run build && npm run preview`.
- Caching issues: the service worker cache name is `github-pages-project-v1`; bump it when changing asset paths to force refresh. 
