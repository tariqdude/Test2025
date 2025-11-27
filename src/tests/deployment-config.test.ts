import { describe, expect, it } from 'vitest';
import {
  createDeploymentConfig,
  deriveBasePath,
  deriveSiteUrl,
} from '../../config/deployment.js';

describe('deployment config', () => {
  it('honors explicit base path overrides', () => {
    const env = { BASE_PATH: '/docs/' };
    const config = createDeploymentConfig(env);

    expect(config.basePath).toBe('/docs/');
    expect(config.scope).toBe('/docs/');
  });

  it('derives project-page paths from repo slug', () => {
    const env = { GITHUB_REPOSITORY: 'owner/project' };
    const config = createDeploymentConfig(env);

    expect(config.basePath).toBe('/project/');
    expect(config.siteUrl).toBe('https://owner.github.io/project/');
    expect(config.repoSlug).toBe('owner/project');
  });

  it('treats user pages repos as root deployments', () => {
    const env = { GITHUB_REPOSITORY: 'owner/owner.github.io' };
    const config = createDeploymentConfig(env);

    expect(config.basePath).toBe('/');
    expect(config.siteUrl).toBe('https://owner.github.io/');
  });

  it('infers base path from a provided SITE_URL path', () => {
    const env = { SITE_URL: 'https://example.com/docs/' };
    const basePath = deriveBasePath(env);
    const siteUrl = deriveSiteUrl(env, basePath);

    expect(basePath).toBe('/docs/');
    expect(siteUrl).toBe('https://example.com/docs/');
  });
});
