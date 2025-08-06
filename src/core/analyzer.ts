import { CodeIssue, ProjectHealth, GitAnalysis, DeploymentChecklist, AnalysisResult } from '../types/analysis';
import { AnalyzerConfig } from '../config/schema';
import { ConfigLoader } from '../config/config-loader';
import { logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { CommandExecutionError, AnalysisError, FileSystemError } from '../errors';
import { generateChecksum } from '../utils/common';

import { SyntaxAnalyzer } from '../analysis/syntax';
import { TypesAnalyzer } from '../analysis/types';
import { SecurityAnalyzer } from '../analysis/security';
import { PerformanceAnalyzer } from '../analysis/performance';
import { AccessibilityAnalyzer } from '../analysis/accessibility';
import { GitAnalyzer } from '../analysis/git';
import { DeploymentAnalyzer } from '../analysis/deployment';

// Define a base interface for all analysis modules
export interface AnalysisModule {
  name: string;
  canAnalyze(config: AnalyzerConfig): boolean;
  analyze(config: AnalyzerConfig): Promise<CodeIssue[]>;
}

export class ProjectAnalyzer {
  private config: AnalyzerConfig;
  private analysisModules: AnalysisModule[] = [];

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

  async analyze(): Promise<AnalysisResult> {
    logger.info('Starting comprehensive project analysis...');
    let issues: CodeIssue[] = [];
    let gitAnalysis: GitAnalysis | null = null;
    let deploymentChecklist: DeploymentChecklist | null = null;

    // Load and validate configuration using ConfigLoader
    this.config = await ConfigLoader.loadConfig(this.config);

    try {
      // Run all enabled analysis modules in parallel
      const analysisPromises = this.analysisModules
        .filter(module => module.canAnalyze(this.config))
        .map(async module => {
          try {
            const moduleIssues = await module.analyze(this.config);
            return moduleIssues;
          } catch (error: unknown) {
            const analysisError = error instanceof AnalysisError ? error : new AnalysisError(module.name, error instanceof Error ? error : new Error(String(error)));
            logger.error(`Analysis module '${module.name}' failed`, analysisError);
            // Return an empty array of issues for this module to allow others to continue
            return [];
          }
        });

      const results = await Promise.allSettled(analysisPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          issues.push(...result.value);
        } else {
          // Log rejected promises, which should ideally be caught by individual modules
          logger.error('An analysis module promise was rejected', result.reason);
        }
      });

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
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('ProjectAnalyzer', error instanceof Error ? error : new Error(String(error)), 'Overall project analysis failed');
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

    const criticalIssues = issues.filter(i => i.severity.level === 'critical').length;
    const highIssues = issues.filter(i => i.severity.level === 'high').length;
    const mediumIssues = issues.filter(i => i.severity.level === 'medium').length;
    const lowIssues = issues.filter(i => i.severity.level === 'low').length;
    const totalIssues = issues.length;

    const deductions = 
      (criticalIssues * criticalWeight) +
      (highIssues * highWeight) +
      (mediumIssues * mediumWeight) +
      (lowIssues * lowWeight);

    score = Math.max(0, score - deductions);

    const categories = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
