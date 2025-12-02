import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import path from 'path';
import { slugify } from '../src/utils/string';

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');

const ensureDir = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

interface PostArgs {
  title: string;
  author?: string;
  description?: string;
  tags?: string;
}

interface ComponentArgs {
  name: string;
  type: 'astro' | 'react' | 'solid';
}

const createPost = async (argv: unknown) => {
  const { title, author, description, tags } = argv as PostArgs;
  const slug = slugify(title);
  const date = new Date().toISOString();
  const fileName = `${slug}.md`;
  const filePath = path.join(BLOG_DIR, fileName);

  const content = `---
title: "${title}"
description: "${description || 'Enter description here'}"
pubDate: ${date}
author: "${author || 'default'}"
tags: ${JSON.stringify(tags ? tags.split(',') : [])}
---

# ${title}

Write your content here...
`;

  await ensureDir(BLOG_DIR);
  await fs.writeFile(filePath, content);
  console.log(`✅ Created new post: ${filePath}`);
};

const createComponent = async (argv: unknown) => {
  const { name, type } = argv as ComponentArgs;
  const fileName = `${name}.${type === 'react' ? 'tsx' : type === 'solid' ? 'tsx' : 'astro'}`;

  let dir = COMPONENTS_DIR;
  if (type === 'solid') {
    dir = path.join(COMPONENTS_DIR, 'solid');
  } else if (type === 'react') {
    // React components often go in components/ directly or a subfolder, let's put them in components/ for now or check if there is a react folder.
    // The file structure showed `src/components/CommandPalette.tsx` directly in components.
  }

  const filePath = path.join(dir, fileName);

  let content = '';
  if (type === 'astro') {
    content = `---
interface Props {
  title?: string;
}

const { title } = Astro.props;
---

<div class="${name.toLowerCase()}">
  <h2>{title}</h2>
  <slot />
</div>

<style>
  .${name.toLowerCase()} {
    /* styles */
  }
</style>
`;
  } else if (type === 'react') {
    content = `import React from 'react';

interface ${name}Props {
  children?: React.ReactNode;
}

export const ${name}: React.FC<${name}Props> = ({ children }) => {
  return (
    <div className="${name.toLowerCase()}">
      {children}
    </div>
  );
};
`;
  } else if (type === 'solid') {
    content = `import { Component, JSX } from 'solid-js';

interface ${name}Props {
  children?: JSX.Element;
}

const ${name}: Component<${name}Props> = (props) => {
  return (
    <div class="${name.toLowerCase()}">
      {props.children}
    </div>
  );
};

export default ${name};
`;
  }

  await ensureDir(dir);
  await fs.writeFile(filePath, content);
  console.log(`✅ Created new component: ${filePath}`);
};

yargs(hideBin(process.argv))
  .command(
    'post <title>',
    'Create a new blog post',
    yargs => {
      return yargs
        .positional('title', {
          describe: 'Post title',
          type: 'string',
        })
        .option('author', {
          alias: 'a',
          type: 'string',
          description: 'Author ID',
        })
        .option('description', {
          alias: 'd',
          type: 'string',
          description: 'Post description',
        })
        .option('tags', {
          alias: 't',
          type: 'string',
          description: 'Comma-separated tags',
        });
    },
    createPost
  )
  .command(
    'component <name>',
    'Create a new component',
    yargs => {
      return yargs
        .positional('name', {
          describe: 'Component name',
          type: 'string',
        })
        .option('type', {
          alias: 't',
          type: 'string',
          choices: ['astro', 'react', 'solid'],
          default: 'astro',
          description: 'Component type',
        });
    },
    createComponent
  )
  .demandCommand(1)
  .parse();
