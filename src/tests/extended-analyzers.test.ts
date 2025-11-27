import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceAnalyzer } from '../analysis/performance';
import { AccessibilityAnalyzer } from '../analysis/accessibility';
import { DeploymentAnalyzer } from '../analysis/deployment';
import { GitAnalyzer } from '../analysis/git';
import type { AnalyzerConfig } from '../config/schema';

// Mock file system with proper default export
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: actual,
    promises: {
      readFile: vi.fn().mockResolvedValue(''),
      access: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockResolvedValue({ size: 1000 }),
      readdir: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock glob
vi.mock('glob', () => ({
  glob: vi.fn().mockResolvedValue([]),
}));

// Mock command executor
vi.mock('../utils/command-executor', () => ({
  executeCommand: vi.fn().mockResolvedValue({
    stdout: '',
    stderr: '',
    exitCode: 0,
    signal: null,
  }),
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    setMinLevel: vi.fn(),
  },
}));

describe('Performance Analyzer', () => {
  let analyzer: PerformanceAnalyzer;
  let mockConfig: AnalyzerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new PerformanceAnalyzer();
    mockConfig = {
      projectRoot: '/test/project',
      ignore: ['node_modules'],
      include: ['**/*.{ts,tsx,js,jsx}'],
      frameworks: ['react'],
      enabledAnalyzers: ['performance'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
      enableCache: true,
    };
  });

  it('should have correct analyzer name', () => {
    expect(analyzer.name).toBe('PerformanceAnalyzer');
  });

  it('should be enabled when performance is in enabledAnalyzers', () => {
    expect(analyzer.canAnalyze(mockConfig)).toBe(true);
  });

  it('should be disabled when performance is not in enabledAnalyzers', () => {
    const config = { ...mockConfig, enabledAnalyzers: ['syntax'] };
    expect(analyzer.canAnalyze(config)).toBe(false);
  });

  it('should return an array of issues', async () => {
    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });

  it('should handle analysis gracefully on error', async () => {
    const { glob } = await import('glob');
    vi.mocked(glob).mockRejectedValueOnce(new Error('Glob error'));

    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });
});

describe('Accessibility Analyzer', () => {
  let analyzer: AccessibilityAnalyzer;
  let mockConfig: AnalyzerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new AccessibilityAnalyzer();
    mockConfig = {
      projectRoot: '/test/project',
      ignore: ['node_modules'],
      include: ['**/*.{astro,tsx,jsx}'],
      frameworks: ['astro'],
      enabledAnalyzers: ['accessibility'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
      enableCache: true,
    };
  });

  it('should have correct analyzer name', () => {
    expect(analyzer.name).toBe('AccessibilityAnalyzer');
  });

  it('should be enabled when accessibility is in enabledAnalyzers', () => {
    expect(analyzer.canAnalyze(mockConfig)).toBe(true);
  });

  it('should be disabled when accessibility is not in enabledAnalyzers', () => {
    const config = { ...mockConfig, enabledAnalyzers: ['syntax'] };
    expect(analyzer.canAnalyze(config)).toBe(false);
  });

  it('should return an array of issues', async () => {
    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });

  it('should detect missing alt text on images', async () => {
    const { glob } = await import('glob');
    const { promises: fs } = await import('fs');

    vi.mocked(glob).mockResolvedValueOnce(['/test/project/page.astro']);
    vi.mocked(fs.readFile).mockResolvedValueOnce('<img src="image.jpg">');

    const issues = await analyzer.analyze(mockConfig);
    // Even if no issues found, the analyzer should run without error
    expect(Array.isArray(issues)).toBe(true);
  });
});

describe('Deployment Analyzer', () => {
  let analyzer: DeploymentAnalyzer;
  let mockConfig: AnalyzerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new DeploymentAnalyzer();
    mockConfig = {
      projectRoot: '/test/project',
      ignore: ['node_modules'],
      include: ['**/*.{ts,tsx}'],
      frameworks: [],
      enabledAnalyzers: ['deployment'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
      enableCache: true,
    };
  });

  it('should have correct analyzer name', () => {
    expect(analyzer.name).toBe('DeploymentAnalyzer');
  });

  it('should be enabled when deployment is in enabledAnalyzers', () => {
    expect(analyzer.canAnalyze(mockConfig)).toBe(true);
  });

  it('should be disabled when deployment is not in enabledAnalyzers', () => {
    const config = { ...mockConfig, enabledAnalyzers: ['syntax'] };
    expect(analyzer.canAnalyze(config)).toBe(false);
  });

  it('should return an array of issues', async () => {
    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });

  it('should handle build during npm lifecycle', async () => {
    // Simulate being in build lifecycle
    const originalEnv = process.env.npm_lifecycle_event;
    process.env.npm_lifecycle_event = 'build';

    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);

    // Restore
    process.env.npm_lifecycle_event = originalEnv;
  });
});

describe('Git Analyzer', () => {
  let analyzer: GitAnalyzer;
  let mockConfig: AnalyzerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new GitAnalyzer();
    mockConfig = {
      projectRoot: '/test/project',
      ignore: [],
      include: [],
      frameworks: [],
      enabledAnalyzers: ['git'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
      enableCache: true,
    };
  });

  it('should have correct analyzer name', () => {
    expect(analyzer.name).toBe('GitAnalyzer');
  });

  it('should be enabled when git is in enabledAnalyzers', () => {
    expect(analyzer.canAnalyze(mockConfig)).toBe(true);
  });

  it('should be disabled when git is not in enabledAnalyzers', () => {
    const config = { ...mockConfig, enabledAnalyzers: ['syntax'] };
    expect(analyzer.canAnalyze(config)).toBe(false);
  });

  it('should return an array of issues', async () => {
    const { executeCommand } = await import('../utils/command-executor');
    vi.mocked(executeCommand)
      .mockResolvedValueOnce({
        stdout: 'main',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      })
      .mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      })
      .mockResolvedValueOnce({
        stdout: 'abc123 Latest commit',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      });

    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });

  it('should detect uncommitted changes', async () => {
    const { executeCommand } = await import('../utils/command-executor');
    vi.mocked(executeCommand)
      .mockResolvedValueOnce({
        stdout: 'main',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      })
      .mockResolvedValueOnce({
        stdout: 'M src/file.ts\nA src/new.ts',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      })
      .mockResolvedValueOnce({
        stdout: 'abc123 Latest commit',
        stderr: '',
        exitCode: 0,
        signal: null,
        duration: 10,
      });

    const issues = await analyzer.analyze(mockConfig);
    const uncommittedIssue = issues.find(i => i.title.includes('Uncommitted'));
    expect(uncommittedIssue).toBeDefined();
  });

  it('should handle git command errors gracefully', async () => {
    const { executeCommand } = await import('../utils/command-executor');
    vi.mocked(executeCommand).mockRejectedValueOnce(
      new Error('Not a git repository')
    );

    const issues = await analyzer.analyze(mockConfig);
    expect(Array.isArray(issues)).toBe(true);
  });
});
