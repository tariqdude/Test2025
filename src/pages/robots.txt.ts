import type { APIRoute } from 'astro';
import { SITE_URL } from '../consts';

export const prerender = true;

export const GET: APIRoute = () => {
  const sitemapUrl = new URL('sitemap-index.xml', SITE_URL).toString();
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
