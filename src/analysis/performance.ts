import type {
  AnalysisModule,
  CodeIssue,
  AnalyzerConfig,
} from '../types/analysis';
import { executeCommand } from '../utils/command-executor';
import { AnalysisError, CommandExecutionError } from '../errors';
import { logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

export class PerformanceAnalyzer implements AnalysisModule {
  name = 'PerformanceAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('performance');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Checking performance issues...');
    const issues: CodeIssue[] = [];

    try {
      // Skip heavy checks in CI/build contexts
      if (process.env.CI === 'true' || process.env.npm_lifecycle_event === 'build') {
        logger.info('Skipping performance checks in CI/build context');
        return issues;
      }

      await Promise.allSettled([
        this.checkBundleSize(config, issues),
        this.checkImageOptimization(config, issues),
        this.checkLazyLoading(config, issues),
      ]);
    } catch (error: unknown) {
      const analysisError =
        error instanceof AnalysisError
          ? error
          : new AnalysisError(
              this.name,
              error instanceof Error ? error : new Error(String(error))
            );
      logger.warn(`Performance analysis failed: ${analysisError.message}`, {
        error: analysisError,
      });
    }
    return issues;
  }

  /**
   * Check for unoptimized images
   */
  private async checkImageOptimization(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    try {
      // Find all image files
      const imageFiles = await glob('**/*.{png,jpg,jpeg,gif,bmp}', {
        cwd: config.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.astro/**', ...config.ignore],
        absolute: true,
      });

      for (const imagePath of imageFiles) {
        try {
          const stats = await fs.stat(imagePath);
          const sizeInKB = stats.size / 1024;

          // Flag images larger than 200KB
          if (sizeInKB > 200) {
            issues.push({
              id: `perf-image-${Date.now()}-${Math.random()}`,
              type: 'performance',
              severity: {
                level: sizeInKB > 500 ? 'high' : 'medium',
                impact: 'minor',
                urgency: 'medium',
              },
              title: 'Large Image File',
              description: `Image is ${Math.round(sizeInKB)}KB. Consider compressing or converting to WebP/AVIF.`,
              file: path.relative(config.projectRoot, imagePath),
              rule: 'image-optimization',
              category: 'Performance',
              source: 'image-analyzer',
              suggestion:
                'Use WebP/AVIF format, compress with tools like squoosh.app, or use Astro Image component',
              autoFixable: false,
            });
          }
        } catch {
          // Skip files that can't be stat'd
        }
      }
    } catch (error) {
      logger.debug('Image optimization check encountered an error', { error });
    }
  }

  /**
   * Check for missing lazy loading on images
   */
  private async checkLazyLoading(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    try {
      const htmlFiles = await glob('**/*.{astro,html,tsx,jsx}', {
        cwd: config.projectRoot,
        ignore: ['node_modules/**', 'dist/**', '.astro/**', ...config.ignore],
        absolute: true,
      });

      for (const filePath of htmlFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for img tags without loading="lazy" (exclude small icons and above-the-fold images)
            if (
              /<img[^>]+src=/i.test(line) &&
              !/loading=["']lazy["']/i.test(line)
            ) {
              // Skip if it's clearly an icon or small image
              if (/icon|logo|avatar|favicon/i.test(line)) continue;
              // Skip if it already has loading attribute
              if (/loading=["']/i.test(line)) continue;

              issues.push({
                id: `perf-lazy-${Date.now()}-${Math.random()}`,
                type: 'performance',
                severity: { level: 'low', impact: 'minor', urgency: 'low' },
                title: 'Image Missing Lazy Loading',
                description:
                  'Consider adding loading="lazy" to defer off-screen images.',
                file: path.relative(config.projectRoot, filePath),
                line: i + 1,
                rule: 'lazy-loading',
                category: 'Performance',
                source: 'performance-analyzer',
                suggestion:
                  'Add loading="lazy" attribute to images below the fold',
                autoFixable: true,
                context: {
                  current: line,
                },
              });
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch (error) {
      logger.debug('Lazy loading check encountered an error', { error });
    }
  }

  private async checkBundleSize(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    try {
      if (process.env.CI === 'true' || process.env.npm_lifecycle_event === 'test') {
        logger.debug('Skipping bundle size check in CI/test context');
        return;
      }

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
          description:
            'The application bundle size may impact loading performance',
          file: 'build-output',
          rule: 'bundle-size',
          category: 'Performance',
          source: 'bundle-analyzer',
          suggestion:
            'Consider code splitting, tree shaking, or removing unused dependencies',
          autoFixable: false,
          context: {
            current: 'Build analysis suggests large bundle size',
          },
        });
      }
    } catch (error: unknown) {
      const analysisError =
        error instanceof CommandExecutionError
          ? new AnalysisError(
              this.name,
              error,
              `Failed to run bundle size check: ${error.message}`
            )
          : new AnalysisError(
              this.name,
              error instanceof Error ? error : new Error(String(error))
            );
      logger.warn(`Bundle size check failed: ${analysisError.message}`, {
        error: analysisError,
      });
    }
  }
}
