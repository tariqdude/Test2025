# Github Pages Project v1

Static Astro + Tailwind starter tuned for GitHub Pages. Builds to a fully static `dist/` bundle with sitemap, RSS, and SEO helpers baked in.

- Live site: https://tariqdude.github.io/Github-Pages-Project-v1/
- Default repo: https://github.com/tariqdude/Github-Pages-Project-v1
- Production base path: `/Github-Pages-Project-v1/` (set in `astro.config.mjs`)

## Getting Started

1) Install Node 22+ (`.nvmrc` is present).  
2) Install dependencies: `npm install`  
3) Run the dev server: `npm run dev` (defaults to http://localhost:4321)  
4) Type-check, lint, and test as needed:

```
npm run typecheck
npm run lint
npm run test          # unit
npm run test:e2e      # Playwright
```

## Build & Preview

- Production build: `npm run build`
- Preview the built site: `npm run preview`
- Pre-deploy quality gate: `npm run pre-deploy` (critical error review + typecheck + lint + tests + build)

## Deployment Notes

- `astro.config.mjs` sets `base` to `/Github-Pages-Project-v1/` when `import.meta.env.PROD` is true so assets resolve correctly on GitHub Pages.
- `site` defaults to `https://tariqdude.github.io/Github-Pages-Project-v1/`; set `SITE_URL` if you deploy elsewhere.
- `public/manifest.json` and `public/robots.txt` use the same base path for start URLs, icons, and the sitemap.
- GitHub Actions workflow `.github/workflows/deploy.yml` runs `npm run build` and publishes `dist/` to Pages.

## Project Structure

Key folders:

- `src/` — pages, layouts, components, utilities, and content.
- `public/` — static assets (favicons, manifest, robots, service worker).
- `dist/` — generated at build time.

## Troubleshooting

- If links appear broken on production, confirm the base path matches your repository name and rebuild.
- When forking, update GitHub links in UI copy and `src/consts.ts` to point to your repo.
