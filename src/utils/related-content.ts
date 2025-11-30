import type { CollectionEntry } from 'astro:content';

/**
 * Get related posts based on shared tags
 * @param currentPost The current blog post
 * @param allPosts All available blog posts
 * @param limit Maximum number of related posts to return (default: 3)
 * @returns Array of related posts sorted by relevance (tag overlap) and then date
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<'blog'>,
  allPosts: CollectionEntry<'blog'>[],
  limit: number = 3
): CollectionEntry<'blog'>[] {
  const currentTags = new Set(currentPost.data.tags || []);

  if (currentTags.size === 0) {
    // If current post has no tags, return recent posts excluding current
    return allPosts
      .filter(post => post.id !== currentPost.id)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .slice(0, limit);
  }

  const scoredPosts = allPosts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const postTags = post.data.tags || [];
      const sharedTags = postTags.filter(tag => currentTags.has(tag));
      return {
        post,
        score: sharedTags.length,
      };
    })
    .filter(item => item.score > 0) // Only include posts with at least one shared tag
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Then by date descending
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    });

  // If we don't have enough related posts, fill with recent posts
  const relatedPosts = scoredPosts.map(item => item.post);

  if (relatedPosts.length < limit) {
    const existingIds = new Set([
      currentPost.id,
      ...relatedPosts.map(p => p.id),
    ]);
    const remainingNeeded = limit - relatedPosts.length;

    const recentPosts = allPosts
      .filter(p => !existingIds.has(p.id))
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .slice(0, remainingNeeded);

    return [...relatedPosts, ...recentPosts];
  }

  return relatedPosts.slice(0, limit);
}
