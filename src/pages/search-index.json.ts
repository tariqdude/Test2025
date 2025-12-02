import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');
  const authors = await getCollection('authors');

  const blogItems = posts.map(post => ({
    id: `blog-${post.slug}`,
    title: post.data.title,
    description: post.data.description,
    category: 'Blog',
    url: `/blog/${post.slug}`,
    date: post.data.pubDate,
    tags: post.data.tags,
  }));

  const authorItems = authors.map(author => ({
    id: `author-${author.id}`,
    title: author.data.name,
    description: `${author.data.role} - ${author.data.bio}`,
    category: 'Authors',
    url: `/authors/${author.id}`,
    date: new Date().toISOString(), // Authors don't have a date, use current
    tags: ['author', author.data.role],
  }));

  const staticPages = [
    {
      id: 'page-home',
      title: 'Home',
      description: 'Welcome to the Ops Center',
      category: 'Page',
      url: '/',
      tags: ['home', 'landing'],
    },
    {
      id: 'page-about',
      title: 'About Us',
      description: 'Learn more about our team and mission',
      category: 'Page',
      url: '/about',
      tags: ['about', 'team'],
    },
    {
      id: 'page-contact',
      title: 'Contact',
      description: 'Get in touch with us',
      category: 'Page',
      url: '/contact',
      tags: ['contact', 'support'],
    },
    {
      id: 'page-components',
      title: 'Components',
      description: 'Explore our UI component library',
      category: 'Page',
      url: '/components',
      tags: ['components', 'ui', 'design'],
    },
    {
      id: 'page-showcase',
      title: 'Showcase',
      description: 'See what we have built',
      category: 'Page',
      url: '/showcase',
      tags: ['showcase', 'portfolio'],
    },
  ].map(page => ({
    ...page,
    date: new Date().toISOString(),
  }));

  const searchItems = [...blogItems, ...authorItems, ...staticPages];

  return new Response(JSON.stringify(searchItems), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
