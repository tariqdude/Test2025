import { describe, expect, it } from 'vitest';
import { GET as manifestGET } from '../pages/manifest.webmanifest.ts';
import { GET as robotsGET } from '../pages/robots.txt.ts';
import { GET as securityGET } from '../pages/.well-known/security.txt.ts';

describe('Runtime routes', () => {
  it('emits a base-aware manifest', async () => {
    const res = await manifestGET();
    expect(res.status).toBe(200);

    const manifest = await res.json();
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.icons.every(icon => icon.src.startsWith('/'))).toBe(true);
    expect(
      manifest.shortcuts.some(shortcut => shortcut.url.includes('blog'))
    ).toBeTruthy();
  });

  it('emits robots.txt with sitemap pointing to the canonical site', async () => {
    const res = await robotsGET();
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain('Sitemap: ');
    expect(text.trim().endsWith('sitemap-index.xml')).toBe(true);
  });

  it('emits security.txt with a rolling expiry', async () => {
    const res = await securityGET();
    expect(res.status).toBe(200);

    const text = await res.text();
    const match = text.match(/(?:^|\n)Expires:\s*(.*)/i);
    expect(match).toBeTruthy();

    const expiry = new Date(match?.[1] ?? '');
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
