/**
 * Blog utilities
 */

import type { BlogPost, SearchFilters } from '../types/index';
import { truncate } from './string';

/**
 * Extract excerpt from blog post content
 */
export const extractExcerpt = (
  content: string,
  maxLength = 160,
  suffix = '...'
): string => {
  // Remove markdown and HTML
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/\[.*?\]\(.*?\)/g, '') // Links
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, '$1') // Bold/italic
    .replace(/<[^>]*>/g, '') // HTML tags
    .replace(/\n+/g, ' ') // Line breaks
    .trim();

  return truncate(plainText, maxLength, suffix);
};

/**
 * Filter and sort blog posts
 */
export const filterPosts = (
  posts: BlogPost[],
  filters: SearchFilters
): BlogPost[] => {
  let filtered = [...posts];

  // Filter by query
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(
      post =>
        post.frontmatter.title.toLowerCase().includes(query) ||
        post.frontmatter.description.toLowerCase().includes(query) ||
        post.frontmatter.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter(
      post => post.frontmatter.category === filters.category
    );
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(post =>
      filters.tags?.some(tag => post.frontmatter.tags?.includes(tag))
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    const dateFrom = filters.dateFrom;
    filtered = filtered.filter(post => post.frontmatter.pubDate >= dateFrom);
  }

  if (filters.dateTo) {
    const dateTo = filters.dateTo;
    filtered = filtered.filter(post => post.frontmatter.pubDate <= dateTo);
  }

  // Filter by author
  if (filters.author) {
    filtered = filtered.filter(
      post => post.frontmatter.author === filters.author
    );
  }

  // Sort posts
  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison =
          a.frontmatter.pubDate.getTime() - b.frontmatter.pubDate.getTime();
        break;
      case 'title':
        comparison = a.frontmatter.title.localeCompare(b.frontmatter.title);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return filtered;
};
