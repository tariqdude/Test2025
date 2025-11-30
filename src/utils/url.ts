/**
 * URL and Query String Utilities
 */

import { BASE_PATH } from '../consts';

const EXTERNAL_LINK_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const BASE_SKIP_PREFIXES = ['mailto:', 'tel:', '#', '?'] as const;

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

/**
 * Prepend base path to a URL path
 */
export function withBasePath(path: string): string {
  const trimmedBase = BASE_PATH === '/' ? '' : trimSlashes(BASE_PATH);
  const basePrefix = trimmedBase ? `/${trimmedBase}` : '';

  if (!path) {
    return basePrefix ? `${basePrefix}/` : '/';
  }

  const trimmedPath = path.trim();

  if (
    EXTERNAL_LINK_PATTERN.test(trimmedPath) ||
    BASE_SKIP_PREFIXES.some(prefix => trimmedPath.startsWith(prefix))
  ) {
    return trimmedPath;
  }

  const cleanedPath = trimmedPath.replace(/^\/+/, '');

  if (!cleanedPath) {
    return basePrefix ? `${basePrefix}/` : '/';
  }

  return `${basePrefix}/${cleanedPath}`;
}

/**
 * Resolve href with base path
 */
export function resolveHref(href: string): string {
  return withBasePath(href);
}

/**
 * Build URL with query parameters
 * Supports two signatures:
 * 1. buildUrl(baseUrl, params)
 * 2. buildUrl(baseUrl, path, params)
 */
export function buildUrl(
  baseUrl: string,
  paramsOrPath: string | Record<string, string | number | boolean | undefined>,
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  let url: URL;
  let params: Record<string, string | number | boolean | undefined> = {};
  let isRelative = false;
  const DUMMY_BASE = 'http://dummy-base.com';

  // Check if baseUrl is relative
  try {
    new URL(baseUrl);
  } catch {
    isRelative = true;
  }

  const base = isRelative ? new URL(baseUrl, DUMMY_BASE) : new URL(baseUrl);

  if (typeof paramsOrPath === 'string') {
    // Signature: buildUrl(base, path, params)
    // Construct new URL from path and base
    // Note: new URL('/path', base) will replace the path of base if /path is absolute
    // We want to append if possible, but standard URL behavior is usually what's expected
    url = new URL(paramsOrPath, base);
    if (queryParams) {
      params = queryParams;
    }
  } else {
    // Signature: buildUrl(baseUrl, params)
    url = base;
    if (paramsOrPath) {
      params = paramsOrPath;
    }
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const finalUrl = url.toString();
  return isRelative ? finalUrl.replace(DUMMY_BASE, '') : finalUrl;
}

/**
 * Parse query string into object
 */
export const parseQuery = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};
