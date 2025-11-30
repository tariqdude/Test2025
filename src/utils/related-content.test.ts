import { describe, it, expect } from 'vitest';
import { getRelatedPosts } from './related-content';
import type { CollectionEntry } from 'astro:content';

// Helper to create mock posts
const createPost = (
  id: string,
  tags: string[],
  date: string
): CollectionEntry<'blog'> => ({
  id,
  body: '',
  collection: 'blog',
  data: {
    title: `Post ${id}`,
    description: 'Desc',
    pubDate: new Date(date),
    tags,
  } as unknown as CollectionEntry<'blog'>['data'],
});

describe('getRelatedPosts', () => {
  const post1 = createPost('1', ['astro', 'react'], '2023-01-01');
  const post2 = createPost('2', ['astro'], '2023-01-02');
  const post3 = createPost('3', ['react'], '2023-01-03');
  const post4 = createPost('4', ['vue'], '2023-01-04');
  const allPosts = [post1, post2, post3, post4];

  it('finds related posts by tags', () => {
    const related = getRelatedPosts(post1, allPosts, 2);
    // Should match post2 (astro) and post3 (react)
    const ids = related.map(p => p.id);
    expect(ids).toContain('2');
    expect(ids).toContain('3');
    expect(ids).not.toContain('4');
  });

  it('sorts by relevance (tag count)', () => {
    const mainPost = createPost('main', ['a', 'b'], '2023-01-01');
    const match2 = createPost('match2', ['a', 'b'], '2023-01-02');
    const match1 = createPost('match1', ['a'], '2023-01-03');

    const related = getRelatedPosts(mainPost, [match1, match2]);
    expect(related[0].id).toBe('match2'); // 2 matches
    expect(related[1].id).toBe('match1'); // 1 match
  });

  it('fills with recent posts if not enough related', () => {
    const related = getRelatedPosts(post4, allPosts, 2);
    // post4 has 'vue', no matches. Should return recent posts (post3, post2)
    expect(related).toHaveLength(2);
    expect(related[0].id).toBe('3'); // Most recent
    expect(related[1].id).toBe('2');
  });
});
