import { z } from 'zod';

export const AnalyzerConfigSchema = z.object({
  projectRoot: z.string().default(process.cwd()),
  ignore: z
    .array(z.string())
    .default(['node_modules', '.git', 'dist', 'build', '.astro', 'src/utils']),
  include: z
    .array(z.string())
    .default(['**/*.{ts,tsx,js,jsx,astro,vue,svelte,md,mdx}']),
  frameworks: z
    .array(z.string())
    .default(['astro', 'react', 'vue', 'svelte', 'solid', 'preact']),
  enabledAnalyzers: z
    .array(z.string())
    .default([
      'syntax',
      'types',
      'security',
      'performance',
      'accessibility',
      'git',
      'deployment',
    ]),
  severityThreshold: z
    .enum(['critical', 'high', 'medium', 'low', 'info'])
    .default('low'),
  outputFormat: z
    .enum(['json', 'markdown', 'html', 'terminal'])
    .default('terminal'),
  githubIntegration: z.boolean().default(true),
  deploymentChecks: z.boolean().default(true),
  autoFix: z.boolean().default(false),
  watchMode: z.boolean().default(false),
});

export type AnalyzerConfig = z.infer<typeof AnalyzerConfigSchema>;
