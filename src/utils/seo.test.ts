import { describe, it, expect } from 'vitest';
import { generateMetaTags } from './seo';

describe('generateMetaTags', () => {
  it('generates basic tags', () => {
    const tags = generateMetaTags({
      title: 'Test Title',
      description: 'Test Description',
      url: 'https://example.com',
    });

    expect(tags).toContainEqual({ name: 'title', content: 'Test Title' });
    expect(tags).toContainEqual({
      name: 'description',
      content: 'Test Description',
    });
    expect(tags).toContainEqual({ property: 'og:type', content: 'website' });
    expect(tags).toContainEqual({
      property: 'og:url',
      content: 'https://example.com',
    });
  });

  it('includes image tags when provided', () => {
    const tags = generateMetaTags({
      title: 'Test',
      description: 'Test',
      url: 'https://example.com',
      image: 'https://example.com/image.jpg',
    });

    expect(tags).toContainEqual({
      property: 'og:image',
      content: 'https://example.com/image.jpg',
    });
    expect(tags).toContainEqual({
      property: 'twitter:image',
      content: 'https://example.com/image.jpg',
    });
  });

  it('generates article tags', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const tags = generateMetaTags({
      title: 'Article',
      description: 'Desc',
      url: 'https://example.com/article',
      type: 'article',
      author: 'John Doe',
      publishDate: date,
    });

    expect(tags).toContainEqual({ property: 'og:type', content: 'article' });
    expect(tags).toContainEqual({
      property: 'article:author',
      content: 'John Doe',
    });
    expect(tags).toContainEqual({
      property: 'article:published_time',
      content: date.toISOString(),
    });
  });
});
