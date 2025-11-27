export interface DeploymentConfig {
  basePath: string;
  siteUrl: string;
  repo: {
    owner: string;
    repo: string;
  };
  repoSlug: string;
  repoUrl: string;
  assetsBase: string;
  scope: string;
}

export function deriveBasePath(env?: Record<string, string>): string;
export function deriveSiteUrl(
  env?: Record<string, string>,
  basePath?: string
): string;
export function createDeploymentConfig(
  env?: Record<string, string>
): DeploymentConfig;

export const deploymentConfig: DeploymentConfig;
