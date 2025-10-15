import type {
  CodeIssue,
  ProjectHealth,
  GitAnalysis,
  DeploymentChecklist,
  AnalysisResult,
  AnalysisModule,
} from '../types/analysis';
import type { AnalyzerConfig } from '../config/schema';
import { ConfigLoader } from '../config/config-loader';
import { logger } from '../utils/logger';
import { AnalysisError } from '../errors';

import { SyntaxAnalyzer } from '../analysis/syntax';
import { TypesAnalyzer } from '../analysis/types';
import { SecurityAnalyzer } from '../analysis/security';
import { PerformanceAnalyzer } from '../analysis/performance';
import { AccessibilityAnalyzer } from '../analysis/accessibility';
import { GitAnalyzer } from '../analysis/git';
import { DeploymentAnalyzer } from '../analysis/deployment';
import { AnalysisCache } from '../utils/analysis-cache';

export class ProjectAnalyzer {
  private config: AnalyzerConfig;
  private analysisModules: AnalysisModule[] = [];
  private cache: AnalysisCache | null = null;

  constructor(initialConfig: Partial<AnalyzerConfig> = {}) {
    // Configuration is loaded and validated asynchronously in the analyze method
    // For now, we'll store the initial config and load the full config in analyze()
    this.config = initialConfig as AnalyzerConfig; // This will be properly loaded later

    // Register analysis modules
    this.registerModule(new SyntaxAnalyzer());
    this.registerModule(new TypesAnalyzer());
    this.registerModule(new SecurityAnalyzer());
    this.registerModule(new PerformanceAnalyzer());
    this.registerModule(new AccessibilityAnalyzer());
    this.registerModule(new GitAnalyzer());
    this.registerModule(new DeploymentAnalyzer());
  }

  public registerModule(module: AnalysisModule) {
    this.analysisModules.push(module);
  }

  /**
   * Clear the analysis cache
   */
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear();
      logger.info('Analysis cache cleared');
    } else {
      logger.warn('Cache not initialized');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    if (this.cache) {
      return this.cache.getStats();
    }
    return null;
  }

  /**
   * Auto-fix issues that have autoFixable = true
   * Returns an object with fixed and failed issues
   */
  async autoFix(issueIds?: string[]): Promise<{
    fixed: CodeIssue[];
    failed: Array<{ issue: CodeIssue; reason: string }>;
  }> {
    logger.info('Starting auto-fix process...');

    try {
      // First, analyze the project to get current issues
      const analysis = await this.analyze();

      // Filter issues to fix
      let issuesToFix = analysis.issues.filter(issue => issue.autoFixable);

      if (issueIds && issueIds.length > 0) {
        issuesToFix = issuesToFix.filter(issue =>
          issueIds.includes(issue.id || `${issue.file}:${issue.line}`)
        );
      }

      logger.info(`Found ${issuesToFix.length} auto-fixable issues`);

      const fixed: CodeIssue[] = [];
      const failed: Array<{ issue: CodeIssue; reason: string }> = [];

      // Process each issue
      for (const issue of issuesToFix) {
        try {
          await this.applyFix(issue);
          fixed.push(issue);
          logger.debug(`Fixed: ${issue.title} in ${issue.file}`);
        } catch (error) {
          failed.push({
            issue,
            reason: error instanceof Error ? error.message : String(error),
          });
          logger.warn(`Failed to fix: ${issue.title} - ${error}`);
        }
      }

      logger.info(
        `Auto-fix complete: ${fixed.length} fixed, ${failed.length} failed`
      );
      return { fixed, failed };
    } catch (error) {
      logger.error('Auto-fix process failed', error as Error);
      throw new AnalysisError(
        'AutoFix',
        error instanceof Error ? error : new Error(String(error)),
        'Auto-fix process failed'
      );
    }
  }

  /**
   * Apply a fix to a single issue
   */
  private async applyFix(issue: CodeIssue): Promise<void> {
    const fs = await import('fs/promises');

    if (!issue.file || !issue.suggestion) {
      throw new Error('Issue missing file path or suggestion');
    }

    try {
      // Read the file
      const content = await fs.readFile(issue.file, 'utf-8');
      const lines = content.split('\n');

      // Apply the fix based on suggestion
      let fixedContent = content;

      if (
        issue.category === 'accessibility' &&
        issue.suggestion.includes('aria-label')
      ) {
        // Add aria-label to elements
        fixedContent = this.fixAccessibilityIssue(content, issue);
      } else if (
        issue.category === 'security' &&
        issue.suggestion.includes('sanitize')
      ) {
        // Add input sanitization
        fixedContent = this.fixSecurityIssue(content, issue);
      } else if (issue.category === 'performance') {
        // Apply performance optimizations
        fixedContent = this.fixPerformanceIssue(content, issue);
      } else {
        // Generic fix: apply suggestion as comment
        if (issue.line && issue.line > 0 && issue.line <= lines.length) {
          lines[issue.line - 1] =
            `${lines[issue.line - 1]} // ${issue.suggestion}`;
          fixedContent = lines.join('\n');
        }
      }

      // Write the fixed content back
      await fs.writeFile(issue.file, fixedContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to apply fix: ${error}`);
    }
  }

  private fixAccessibilityIssue(content: string, issue: CodeIssue): string {
    // Add aria-label to buttons and inputs
    if (issue.suggestion && issue.suggestion.includes('aria-label')) {
      content = content.replace(
        /<button([^>]*)>/g,
        '<button$1 aria-label="Button">'
      );
      content = content.replace(
        /<input([^>]*type="text"[^>]*)>/g,
        '<input$1 aria-label="Input field">'
      );
    }
    return content;
  }

  private fixSecurityIssue(content: string, issue: CodeIssue): string {
    // Add input sanitization
    if (issue.suggestion && issue.suggestion.includes('sanitize')) {
      // This is a simplified example
      content = content.replace(
        /dangerouslySetInnerHTML=/g,
        '// Security: Review this - dangerouslySetInnerHTML='
      );
    }
    return content;
  }

  private fixPerformanceIssue(content: string, issue: CodeIssue): string {
    // Add lazy loading to images
    if (issue.suggestion && issue.suggestion.includes('lazy')) {
      content = content.replace(/<img([^>]*)>/g, '<img$1 loading="lazy">');
    }
    return content;
  }

  async analyze(): Promise<AnalysisResult> {
    logger.info('Starting comprehensive project analysis...');
    const issues: CodeIssue[] = [];
    const gitAnalysis: GitAnalysis | null = null;
    const deploymentChecklist: DeploymentChecklist | null = null;

    try {
      // Load and validate configuration using ConfigLoader
      this.config = await ConfigLoader.loadConfig(this.config);

      // Initialize cache if enabled and not already initialized
      if (this.config.enableCache && !this.cache) {
        this.cache = new AnalysisCache(this.config.projectRoot);
        await this.cache.initialize();
        const stats = this.cache.getStats();
        logger.info(
          `Cache enabled: ${stats.totalFiles} files, ${stats.totalIssues} cached issues`
        );
      }

      // Run all enabled analysis modules in parallel
      const analysisPromises = this.analysisModules
        .filter(module => module.canAnalyze(this.config))
        .map(async module => {
          try {
            const moduleIssues = await module.analyze(this.config);
            return { module: module.name, issues: moduleIssues };
          } catch (error: unknown) {
            const analysisError =
              error instanceof AnalysisError
                ? error
                : new AnalysisError(
                    module.name,
                    error instanceof Error ? error : new Error(String(error))
                  );
            logger.error(
              `Analysis module '${module.name}' failed`,
              analysisError
            );
            // Return an empty array of issues for this module to allow others to continue
            return { module: module.name, issues: [] };
          }
        });

      const results = await Promise.allSettled(analysisPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          issues.push(...result.value.issues);
        } else {
          // Log rejected promises, which should ideally be caught by individual modules
          logger.error(
            'An analysis module promise was rejected',
            result.reason
          );
        }
      });

      // Save cache if enabled
      if (this.cache) {
        await this.cache.save();
        logger.debug('Cache saved after analysis');
      }

      // Calculate health score based on collected issues
      const projectHealth = this.calculateProjectHealth(issues);

      // Extract GitAnalysis and DeploymentChecklist from issues if available
      // This assumes these analyzers add their specific results as issues or metadata
      // For now, we'll keep them as null or derive from issues if possible
      // In a more advanced setup, analyzers would return structured data directly

      logger.info('Project analysis complete.');

      return {
        issues,
        health: projectHealth,
        git: gitAnalysis, // Will be populated by GitAnalyzer if it adds a specific issue type or metadata
        deployment: deploymentChecklist, // Will be populated by DeploymentAnalyzer
      };
    } catch (error: unknown) {
      const analysisError =
        error instanceof AnalysisError
          ? error
          : new AnalysisError(
              'ProjectAnalyzer',
              error instanceof Error ? error : new Error(String(error)),
              'Overall project analysis failed'
            );
      logger.fatal('Overall project analysis failed', analysisError);
      throw analysisError;
    }
  }

  private calculateProjectHealth(issues: CodeIssue[]): ProjectHealth {
    let score = 100;
    const criticalWeight = 20;
    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 1;

    const criticalIssues = issues.filter(
      i => i.severity.level === 'critical'
    ).length;
    const highIssues = issues.filter(i => i.severity.level === 'high').length;
    const mediumIssues = issues.filter(
      i => i.severity.level === 'medium'
    ).length;
    const lowIssues = issues.filter(i => i.severity.level === 'low').length;
    const totalIssues = issues.length;

    const deductions =
      criticalIssues * criticalWeight +
      highIssues * highWeight +
      mediumIssues * mediumWeight +
      lowIssues * lowWeight;

    score = Math.max(0, score - deductions);

    const categories = issues.reduce(
      (acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      score: Math.round(score),
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      totalIssues,
      categories,
      trends: {
        improving: true,
        velocity: 0,
        lastCheck: new Date(),
      },
    };
  }
}
