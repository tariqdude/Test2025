export interface MetaTagsConfig {
  title: string;
  description: string;
  image?: string;
  url: URL | string;
  type?: 'website' | 'article';
  author?: string;
  publishDate?: Date;
}

/**
 * Generate standard SEO meta tags
 */
export const generateMetaTags = (config: MetaTagsConfig) => {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    author,
    publishDate,
  } = config;

  const metaTags = [
    // Primary Meta Tags
    { name: 'title', content: title },
    { name: 'description', content: description },

    // Open Graph / Facebook
    { property: 'og:type', content: type },
    { property: 'og:url', content: url.toString() },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];

  if (image) {
    metaTags.push({ property: 'og:image', content: image });
    metaTags.push({ property: 'twitter:image', content: image });
  }

  // Twitter
  metaTags.push(
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:url', content: url.toString() },
    { property: 'twitter:title', content: title },
    { property: 'twitter:description', content: description }
  );

  // Article specific
  if (type === 'article') {
    if (author) {
      metaTags.push({ property: 'article:author', content: author });
    }
    if (publishDate) {
      metaTags.push({
        property: 'article:published_time',
        content: publishDate.toISOString(),
      });
    }
  }

  return metaTags;
};
