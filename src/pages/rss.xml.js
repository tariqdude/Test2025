import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const prerender = true;

export async function GET(context) {
  const posts = await getCollection('blog');
  const baseUrl = import.meta.env.BASE_URL || '/';

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map(post => ({
      ...post.data,
      link: new URL(`${baseUrl}blog/${post.id}/`, context.site).href,
    })),
  });
}
