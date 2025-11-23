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
  enableCache: z.boolean().default(true),
});

export type AnalyzerConfig = z.infer<typeof AnalyzerConfigSchema>;

export const MetricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const PillarSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const HighlightItemSchema = z.object({
  label: z.string(),
  title: z.string(),
  description: z.string(),
});

export const SecurityPrincipleSchema = z.object({
  indicator: z.string(),
  title: z.string(),
  description: z.string(),
});

export const SecuritySummarySchema = z.object({
  intro: z.string(),
  principles: z.array(SecurityPrincipleSchema),
});

export const PlaybookStepSchema = z.object({
  step: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const TestimonialSchema = z.object({
  quote: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string().optional(),
  content: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.number().optional(),
});

export const EngagementTrackSchema = z.object({
  name: z.string(),
  timeline: z.string(),
  summary: z.string(),
  deliverables: z.array(z.string()),
});

export const ControlStackItemSchema = z.object({
  name: z.string(),
  metric: z.string(),
  metricLabel: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
});

export const InsightReportSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  linkLabel: z.string(),
  href: z.string(),
});
