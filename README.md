# GitHub Pages Project v1

Astro + Tailwind static site built for GitHub Pages with sitemap, RSS, structured data, a PWA manifest, and a quality gate script to keep deploys clean.

- Live: https://tariqdude.github.io/Github-Pages-Project-v1/
- Repo: https://github.com/tariqdude/Github-Pages-Project-v1
- Deployment config: `config/deployment.js` auto-derives `site` + `base` for GitHub Pages or any host (override with env).

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

- `SITE_URL` - Optional canonical URL; otherwise derived automatically from the repo slug/host (GitHub Pages-friendly).
- `BASE_PATH` - Optional subpath override; otherwise derived from `SITE_URL` or the repo name.
- `PUBLIC_ENABLE_ANALYTICS` - Set to `true` to opt into analytics scripts; defaults off for privacy-friendly forks.

Examples:

- User pages (`username.github.io`): set `SITE_URL=https://username.github.io`; leave `BASE_PATH` empty (base will be `/`).
- Project pages (`username.github.io/repo`): set `SITE_URL=https://username.github.io/repo`; base becomes `/repo/`.
- Custom domain with subpath: set `SITE_URL=https://example.com/docs`; optional `BASE_PATH=/docs/` if you want to force it.

## Deployment (GitHub Pages)

- `config/deployment.js` derives `base` + `site` from the repo slug/env so forks and renames deploy without edits (user-pages repos resolve to `/` automatically).
- Workflow: `.github/workflows/deploy.yml` builds and publishes `dist/` to Pages.
- PWA files are generated at build time (`src/pages/manifest.webmanifest.ts`, `src/pages/robots.txt.ts`), and the service worker resolves its scope from the registered path so assets stay on the right base.
- Base-path sanity check: run `npm run build && npm run preview`, then open the preview URL using the derived base path (default `/` or `/<repo>/` for project pages).

If you fork/rename:

1. Optionally set `SITE_URL` in `.env` if you use a custom domain; otherwise the repo slug + owner are used.
2. Set `BASE_PATH` only if you intentionally deploy under a different subpath than the repo name.

## Deploy Anywhere Checklist

- [ ] `npm run build && npm run preview` renders correctly at the derived base URL.
- [ ] `manifest.webmanifest` and `robots.txt` load and point to the right base/canonical site.
- [ ] Service worker registers at `sw.js?v=<version>` and caches assets under the expected scope.
- [ ] `SITE_URL`/`BASE_PATH` are set (if needed) for your host (GitHub Pages, custom domain, or another static host).

## Project Structure

- `src/` — Pages, components, layouts, content, utilities.
- `public/` — Static assets (favicons, service worker, fonts).
- `dist/` — Build output (generated).
- `e2e/` — Playwright tests.
- `test-results/` and `playwright-report/` — Test artifacts (generated).

## Quality Checklist

- `npm run pre-deploy` passes (critical error review, typecheck, lint, tests, build).
- Links and assets work under the derived base path (verify with `npm run preview`; default is `/` or `/<repo>/` for project pages).
- Manifest, robots, and the service worker resolve icons/routes under the same base path.
- Sitemap points to the correct canonical URL.
- Playwright e2e can run headed with `npm run test:e2e:headed` when debugging interactions.

## Troubleshooting

- Missing icons: ensure `public/favicon-192.png` and `public/favicon-512.png` exist (generated from `public/favicon.svg`).
- Broken links on Pages: confirm the derived `BASE_PATH` from `config/deployment.js` matches the host (or set `BASE_PATH` explicitly) and rerun `npm run build && npm run preview`.
- Caching issues: the service worker cache name suffixes the base path (e.g., `github-pages-project-v1-root`); bump it when changing asset paths or scope to force refresh.
