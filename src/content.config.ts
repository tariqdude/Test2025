import { defineCollection, z, reference } from 'astro:content';
import type { ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
    bio: z.string(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
});

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }: { image: ImageFunction }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      author: reference('authors').optional(),
      tags: z.array(z.string()).default([]),
      canonicalURL: z.string().url().optional(),
    }),
});

export const collections = { blog, authors };
