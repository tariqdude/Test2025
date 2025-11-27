import type { APIRoute } from 'astro';
import { DEPLOYMENT_CONFIG, SITE_URL } from '../../consts';

export const prerender = true;

export const GET: APIRoute = () => {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const repoAdvisoryUrl = DEPLOYMENT_CONFIG.repoSlug
    ? `https://github.com/${DEPLOYMENT_CONFIG.repoSlug}/security/advisories/new`
    : 'https://github.com/security/advisories';

  const canonicalUrl = new URL('.well-known/security.txt', SITE_URL).toString();

  const body = `Contact: ${repoAdvisoryUrl}
Expires: ${expires}
Preferred-Languages: en
Canonical: ${canonicalUrl}

# Security Policy
# If you discover a security vulnerability, please report it through GitHub Security Advisories.
# We appreciate responsible disclosure and will work with you to address the issue.
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
