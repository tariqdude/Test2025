import type { AnalysisModule, CodeIssue, AnalyzerConfig } from '../types/analysis';
import { executeCommand } from '../utils/command-executor';
import { AnalysisError, CommandExecutionError } from '../errors';
import { logger } from '../utils/logger';

export class PerformanceAnalyzer implements AnalysisModule {
  name = 'PerformanceAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('performance');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Checking performance issues...');
    const issues: CodeIssue[] = [];

    try {
      await Promise.allSettled([
        this.checkBundleSize(config, issues),
        // this.checkImageOptimization(config, issues),
        // this.checkLoadingPerformance(config, issues),
        // this.checkFrameworkPerformance(config, issues),
      ]);
    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError(this.name, error instanceof Error ? error : new Error(String(error)));
      logger.warn(`Performance analysis failed: ${analysisError.message}`, { error: analysisError });
    }
    return issues;
  }

  private async checkBundleSize(config: AnalyzerConfig, issues: CodeIssue[]): Promise<void> {
    try {
      const { stdout } = await executeCommand('npx astro build --dry-run', {
        cwd: config.projectRoot,
        ignoreExitCode: true,
      });

      if (stdout.includes('Large bundle detected') || stdout.length > 10000) {
        issues.push({
          id: `bundle-size-${Date.now()}`,
          type: 'performance',
          severity: {
            level: 'medium',
            impact: 'minor',
            urgency: 'medium',
          },
          title: 'Large Bundle Size Detected',
          description: 'The application bundle size may impact loading performance',
          file: 'build-output',
          rule: 'bundle-size',
          category: 'Performance',
          source: 'bundle-analyzer',
          suggestion: 'Consider code splitting, tree shaking, or removing unused dependencies',
          autoFixable: false,
          context: {
            current: 'Build analysis suggests large bundle size',
          },
        });
      }
    } catch (error: unknown) {
      const analysisError = error instanceof CommandExecutionError ? 
        new AnalysisError(this.name, error, `Failed to run bundle size check: ${error.message}`) :
        new AnalysisError(this.name, error instanceof Error ? error : new Error(String(error)));
      logger.warn(`Bundle size check failed: ${analysisError.message}`, { error: analysisError });
    }
  }
}
