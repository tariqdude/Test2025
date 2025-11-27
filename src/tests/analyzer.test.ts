import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectAnalyzer } from '../core/analyzer';
import { SyntaxAnalyzer } from '../analysis/syntax';
import { AnalysisError, ConfigurationError } from '../errors';
import { logger } from '../utils/logger';
import type { AnalyzerConfig } from '../config/schema';
import { ConfigLoader } from '../config/config-loader';
import { ReportGenerator } from '../utils/report-generator';

// Mock external dependencies
vi.mock('../utils/command-executor', () => ({
  executeCommand: vi.fn(async (command: string) => {
    if (command.includes('tsc')) {
      return { stdout: '', stderr: '', exitCode: 0, signal: null };
    }
    if (command.includes('git')) {
      return {
        stdout: 'branch\ncommit',
        stderr: '',
        exitCode: 0,
        signal: null,
      };
    }
    if (command.includes('astro build')) {
      return { stdout: '', stderr: '', exitCode: 0, signal: null };
    }
    return { stdout: '', stderr: '', exitCode: 0, signal: null };
  }),
}));

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

vi.mock('../config/config-loader', () => ({
  ConfigLoader: {
    loadConfig: vi.fn(async (config: Partial<AnalyzerConfig>) => {
      if (config.projectRoot === 'fatal-error') {
        throw new ConfigurationError(
          'ConfigLoader',
          'Simulated fatal config error'
        );
      }
      return {
        // Mock a valid config
        projectRoot: '/mock/project',
        ignore: [],
        include: [],
        frameworks: [],
        enabledAnalyzers: [
          'syntax',
          'types',
          'security',
          'performance',
          'accessibility',
          'git',
          'deployment',
        ],
        severityThreshold: 'low',
        outputFormat: 'terminal',
        githubIntegration: true,
        deploymentChecks: true,
        autoFix: false,
        watchMode: false,
        enableCache: true,
        ...config,
      };
    }),
  },
}));

describe('ProjectAnalyzer', () => {
  let analyzer: ProjectAnalyzer;
  let mockConfig: AnalyzerConfig;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfig = await ConfigLoader.loadConfig({});
    analyzer = new ProjectAnalyzer(mockConfig);
  });

  it('should initialize with default configuration', () => {
    expect(analyzer).toBeDefined();
    // Check if analyzer is properly initialized
    expect(analyzer).toBeInstanceOf(ProjectAnalyzer);
  });

  it('should run all enabled analyzers and collect issues', async () => {
    const result = await analyzer.analyze();
    expect(result).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
    expect(result.health).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith(
      'Starting comprehensive project analysis...'
    );
    expect(logger.info).toHaveBeenCalledWith('Project analysis complete.');
  });

  it('should handle errors from individual analysis modules gracefully', async () => {
    // Mock one analyzer to throw an error
    vi.spyOn(SyntaxAnalyzer.prototype, 'analyze').mockImplementationOnce(() => {
      throw new Error('Simulated SyntaxAnalyzer error');
    });

    const result = await analyzer.analyze();
    expect(result).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
    // Expect an issue to be logged for the failed module
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`Analysis module 'SyntaxAnalyzer' failed`),
      expect.objectContaining({
        name: 'AnalysisError',
        message: expect.stringContaining('Simulated SyntaxAnalyzer error'),
      })
    );
  });

  it('should calculate project health correctly', async () => {
    // Simulate some issues
    vi.spyOn(SyntaxAnalyzer.prototype, 'analyze').mockResolvedValueOnce([
      {
        id: '1',
        type: 'syntax',
        severity: {
          level: 'critical',
          impact: 'blocking',
          urgency: 'immediate',
        },
        title: 'Crit',
        description: '',
        file: '',
        rule: '',
        category: 'Syntax',
        source: '',
        autoFixable: false,
      },
      {
        id: '2',
        type: 'syntax',
        severity: { level: 'high', impact: 'major', urgency: 'high' },
        title: 'High',
        description: '',
        file: '',
        rule: '',
        category: 'Syntax',
        source: '',
        autoFixable: false,
      },
    ]);

    const result = await analyzer.analyze();
    expect(result.health.criticalIssues).toBe(1);
    expect(result.health.highIssues).toBe(1);
    expect(result.health.totalIssues).toBe(3);
    // Score calculation depends on weights, so just check it's less than 100
    expect(result.health.score).toBeLessThan(100);
  });

  it('should throw AnalysisError for fatal analysis failures', async () => {
    // Create a new analyzer instance with a config that will trigger the fatal error in ConfigLoader
    const fatalConfig = { projectRoot: 'fatal-error' };
    const analyzerWithFatalConfig = new ProjectAnalyzer(fatalConfig);

    await expect(analyzerWithFatalConfig.analyze()).rejects.toThrow(
      AnalysisError
    );
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.stringContaining('Overall project analysis failed'),
      expect.objectContaining({
        name: 'AnalysisError',
        message: expect.stringContaining('Simulated fatal config error'),
        details: expect.objectContaining({
          originalError: expect.objectContaining({
            name: 'ConfigurationError',
            message: expect.stringContaining('Simulated fatal config error'),
          }),
        }),
      })
    );
  });

  // Test report generation (simulated)
  it('should generate reports in different formats', async () => {
    const analysisResult = await analyzer.analyze();

    // Deep copy and convert Date to string for comparison
    const comparableResult = JSON.parse(JSON.stringify(analysisResult));
    comparableResult.health.trends.lastCheck =
      analysisResult.health.trends.lastCheck.toISOString();

    const jsonReport = ReportGenerator.generateJsonReport(analysisResult);
    expect(jsonReport).toBeTypeOf('string');
    expect(JSON.parse(jsonReport)).toEqual(comparableResult);

    const markdownReport =
      ReportGenerator.generateMarkdownReport(analysisResult);
    expect(markdownReport).toBeTypeOf('string');
    expect(markdownReport).toContain('Project Health Report');

    const htmlReport = ReportGenerator.generateHTMLReport(analysisResult);
    expect(htmlReport).toBeTypeOf('string');
    expect(htmlReport).toContain('<html');
    expect(htmlReport).toContain('Project Health Report');
  });
});
