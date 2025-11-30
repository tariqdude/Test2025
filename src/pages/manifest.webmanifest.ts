import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { withBasePath } from '../utils/helpers';

export const prerender = true;

export const GET: APIRoute = () => {
  const manifest = {
    name: SITE_TITLE,
    short_name: 'GPP',
    description: SITE_DESCRIPTION,
    start_url: withBasePath(''),
    scope: withBasePath(''),
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity', 'portfolio'],
    icons: [
      {
        src: withBasePath('favicon-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: withBasePath('favicon-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Blog',
        short_name: 'Blog',
        description: 'View blog posts',
        url: withBasePath('blog/'),
        icons: [{ src: withBasePath('favicon-192.png'), sizes: '192x192' }],
      },
      {
        name: 'Demo Center',
        short_name: 'Demos',
        description: 'Explore interactive demos',
        url: withBasePath('demo/'),
        icons: [{ src: withBasePath('favicon-192.png'), sizes: '192x192' }],
      },
      {
        name: 'Contact',
        short_name: 'Contact',
        description: 'Get in touch',
        url: withBasePath('contact/'),
        icons: [{ src: withBasePath('favicon-192.png'), sizes: '192x192' }],
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
};
