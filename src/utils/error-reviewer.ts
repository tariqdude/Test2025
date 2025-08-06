// Elite Advanced Code Error Reviewer System
// Comprehensive project-wide analysis with GitHub integration and deployment checks

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { executeCommand } from './command-executor';
import { Checker } from '../checkers/checker';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { executeCommand } from './command-executor';
import { Checker } from '../checkers/checker';
import { SyntaxChecker } from '../checkers/syntax-checker';
import { TypeChecker } from '../checkers/type-checker';
import { AppError, AnalysisError, FileSystemError, CommandExecutionError } from '../errors';
import { TypeChecker } from '../checkers/type-checker';

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // In a production environment, you might want to log this to a file or an error tracking service
  // and then gracefully shut down or exit the process.
  // For now, we'll just log it.
});

/* ==================== TYPES ==================== */

export interface ErrorSeverity {
  level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  impact: 'blocking' | 'major' | 'minor' | 'cosmetic';
  urgency: 'immediate' | 'high' | 'medium' | 'low';
}

export interface CodeIssue {
  id: string;
  type: 'syntax' | 'type' | 'runtime' | 'security' | 'performance' | 'accessibility' | 'seo' | 'deployment' | 'git' | 'dependency';
  severity: ErrorSeverity;
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  rule: string;
  category: string;
  source: string;
  suggestion?: string;
  autoFixable: boolean;
  documentation?: string;
  context: {
    before?: string[];
    current: string;
    after?: string[];
  };
  metadata: {
    component?: string;
    framework?: string;
    dependencies?: string[];
    relatedFiles?: string[];
    checksum: string;
    timestamp: Date;
  };
}

export interface ProjectHealth {
  score: number; // 0-100
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  totalIssues: number;
  categories: Record<string, number>;
  trends: {
    improving: boolean;
    velocity: number;
    lastCheck: Date;
  };
}

export interface GitAnalysis {
  branch: string;
  commit: string;
  uncommittedChanges: boolean;
  branchStatus: 'ahead' | 'behind' | 'diverged' | 'up-to-date';
  conflicts: boolean;
  fileChanges: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

export interface DeploymentChecklist {
  buildStatus: 'pass' | 'fail' | 'warning';
  typeChecking: 'pass' | 'fail';
  linting: 'pass' | 'fail';
  testing: 'pass' | 'fail';
  dependencies: 'pass' | 'fail' | 'warning';
  security: 'pass' | 'fail' | 'warning';
  performance: 'pass' | 'fail' | 'warning';
  accessibility: 'pass' | 'fail' | 'warning';
  seo: 'pass' | 'fail' | 'warning';
  assets: 'pass' | 'fail' | 'warning';
}

export interface ReviewConfig {
  projectRoot: string;
  ignore: string[];
  include: string[];
  frameworks: string[];
  enabledCheckers: string[];
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
  outputFormat: 'json' | 'markdown' | 'html' | 'terminal';
  githubIntegration: boolean;
  deploymentChecks: boolean;
  autoFix: boolean;
  watchMode: boolean;
}

/* ==================== CORE ERROR REVIEWER CLASS ==================== */

export class EliteErrorReviewer {
  private config: ReviewConfig;
  private issues: CodeIssue[] = [];
  private projectHealth: ProjectHealth;
  private gitAnalysis: GitAnalysis | null = null;
  private deploymentStatus: DeploymentChecklist | null = null;
  private checkers: Checker[];

  constructor(config: Partial<ReviewConfig> = {}) {
    this.config = {
      projectRoot: process.cwd(),
      ignore: ['node_modules', '.git', 'dist', 'build', '.astro', 'src/utils'],
      include: ['**/*.{ts,tsx,js,jsx,astro,vue,svelte,md,mdx}'],
      frameworks: ['astro', 'react', 'vue', 'svelte', 'solid', 'preact'],
      enabledCheckers: ['syntax', 'types', 'security', 'performance', 'accessibility', 'git', 'deployment'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
      ...config,
    };

    this.projectHealth = {
      score: 100,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      totalIssues: 0,
      categories: {},
      trends: {
        improving: true,
        velocity: 0,
        lastCheck: new Date(),
      },
    };

    // Initialize checkers
    this.checkers = [
      new SyntaxChecker(),
      new TypeChecker(),
      // Other checkers will be added here
    ];
  }

  /* ==================== MAIN ANALYSIS METHODS ==================== */

  async analyzeProject(): Promise<{
    issues: CodeIssue[];
    health: ProjectHealth;
    git: GitAnalysis | null;
    deployment: DeploymentChecklist | null;
  }> {
    console.log('🔍 Starting Elite Error Analysis...\n');
    
    try {
      // Initialize analysis
      this.issues = [];
      await this.detectProjectStructure();

      // Run all enabled checkers in parallel for performance
      const checkerPromises = this.checkers
        .filter(checker => checker.canHandle(this.config))
        .map(async checker => {
          try {
            const issues = await checker.check(this.config);
            this.issues.push(...issues);
          } catch (error: unknown) {
            const analysisError = error instanceof AnalysisError ? error : new AnalysisError(checker.name, error instanceof Error ? error : new Error(String(error)));
            this.issues.push({
              id: `checker-unhandled-error-${checker.name}-${Date.now()}`,
              type: 'runtime',
              severity: { level: 'critical', impact: 'blocking', urgency: 'immediate' },
              title: `Unhandled Error in ${checker.name}`,
              description: `An unhandled error occurred during ${checker.name} execution: ${analysisError.message}`,
              file: 'internal',
              rule: 'checker-unhandled-exception',
              category: 'Internal',
              source: 'error-reviewer',
              autoFixable: false,
              context: { current: '' },
              metadata: { checksum: '', timestamp: new Date() },
            });
          }
        });

      await Promise.allSettled(checkerPromises);

      // Additional advanced checks (these will also be refactored into checkers later)
      await Promise.allSettled([
        this.checkDependencyVulnerabilities(),
        this.checkBundleSize(),
        this.checkSEOCompliance(),
        this.checkFrameworkSpecificIssues(),
        this.checkCodeQuality(),
        this.checkEnvironmentConfiguration(),
        this.analyzeGitStatus(), // Git analysis is now a checker candidate
        this.checkDeploymentReadiness(), // Deployment checks are also checker candidates
      ]);

      // Calculate final health score
      this.calculateProjectHealth();

      console.log('✅ Analysis complete!\n');
      
      return {
        issues: this.issues,
        health: this.projectHealth,
        git: this.gitAnalysis,
        deployment: this.deploymentStatus,
      };

    } catch (error: unknown) {
      throw new AnalysisError('EliteErrorReviewer', error instanceof Error ? error : new Error(String(error)), 'Overall project analysis failed');
    }
  }

  

  /* ==================== SECURITY ANALYSIS ==================== */

  private async checkSecurityIssues(): Promise<void> {
    console.log('🔍 Checking security vulnerabilities...');
    
    try {
      // Check for known vulnerabilities
      await this.checkDependencyVulnerabilities();
      
      // Check for security anti-patterns
      await this.checkSecurityPatterns();
      
      // Check environment variables exposure
      await this.checkEnvironmentSecurity();
      
    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('SecurityChecker', error instanceof Error ? error : new Error(String(error)));
      console.warn(`⚠️  Security check failed: ${analysisError.message}`);
    }
  }

  private async checkSecurityPatterns(): Promise<void> {
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Avoid using eval() as it can execute arbitrary code',
        severity: 'critical' as const,
        suggestion: this.getSecuritySuggestion(/eval\s*\(/g),
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'innerHTML can lead to XSS vulnerabilities. Use textContent or sanitize input.',
        severity: 'high' as const,
        suggestion: this.getSecuritySuggestion(/innerHTML\s*=/g),
      },
      {
        pattern: /document\.write\s*\(/g,
        message: 'document.write can be dangerous and is deprecated',
        severity: 'medium' as const,
        suggestion: this.getSecuritySuggestion(/document\.write\s*\(/g),
      },
      {
        pattern: /window\.location\.href\s*=\s*[^"'`\s]+/g,
        message: 'Direct location assignment can be vulnerable to injection',
        severity: 'high' as const,
        suggestion: this.getSecuritySuggestion(/window\.location\.href\s*=\s*[^"'`\s]+/g),
      },
    ];

    const files = await this.getProjectFiles();
    
    for (const file of files) {
      const issuesInFile = await this._checkFileForPatterns(
        file,
        securityPatterns.map(p => ({ ...p, type: 'security', category: 'Security', source: 'security-scanner', rule: 'security-pattern', autoFixable: false }))
      );
      this.issues.push(...issuesInFile);
    }
  }

  private async _checkFileForPatterns(
    filePath: string,
    patterns: Array<{ 
      pattern: RegExp;
      message: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      type: CodeIssue['type'];
      category: string;
      source: string;
      rule: string;
      suggestion?: string;
      autoFixable: boolean;
      documentation?: string;
    }> 
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const { pattern, message, severity, type, category, source, rule, suggestion, autoFixable, documentation } of patterns) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(pattern);

          if (matches) {
            issues.push({
              id: `${type}-${Date.now()}-${Math.random()}`,
              type,
              severity: {
                level: severity,
                impact: severity === 'critical' ? 'blocking' : 'major',
                urgency: severity === 'critical' ? 'immediate' : 'high',
              },
              title: `${category} Issue Detected`,
              description: message,
              file: path.relative(this.config.projectRoot, filePath),
              line: i + 1,
              rule,
              category,
              source,
              suggestion,
              autoFixable,
              documentation,
              context: {
                before: lines.slice(Math.max(0, i - 2), i),
                current: line,
                after: lines.slice(i + 1, i + 3),
              },
              metadata: {
                checksum: this.generateChecksum(line),
                timestamp: new Date(),
              },
            });
          }
        }
      }
    } catch (error: unknown) {
      const fsError = error instanceof FileSystemError ? error : new FileSystemError('read', filePath, error instanceof Error ? error : new Error(String(error)));
      console.warn(`⚠️  Could not analyze ${filePath}: ${fsError.message}`);
    }
    return issues;
  }

  /* ==================== PERFORMANCE ANALYSIS ==================== */

  private async checkPerformanceIssues(): Promise<void> {
    console.log('🔍 Checking performance issues...');
    
    try {
      await Promise.allSettled([
        this.checkBundleSize(),
        this.checkImageOptimization(),
        this.checkLoadingPerformance(),
        this.checkFrameworkPerformance(),
      ]);
    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('PerformanceChecker', error instanceof Error ? error : new Error(String(error)));
      console.warn(`⚠️  Performance check failed: ${analysisError.message}`);
    }
  }

  private async checkBundleSize(): Promise<void> {
    try {
      // Analyze bundle size and suggest optimizations
      const { stdout } = await executeCommand('npx astro build --dry-run', {
        cwd: this.config.projectRoot,
        ignoreExitCode: true, // astro build --dry-run might exit with non-zero even if it provides useful output
      });

      // Parse build output for large bundles
      if (stdout.includes('Large bundle detected') || stdout.length > 10000) {
        this.issues.push({
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
          metadata: {
            checksum: this.generateChecksum(stdout),
            timestamp: new Date(),
          },
        });
      }
    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('BundleSizeChecker', error instanceof Error ? error : new Error(String(error)));
      console.warn(`⚠️  Bundle size check failed: ${analysisError.message}`);
      // Non-critical error, continue analysis
    }
  }

  /* ==================== ACCESSIBILITY ANALYSIS ==================== */

  private async checkAccessibilityIssues(): Promise<void> {
    console.log('🔍 Checking accessibility compliance...');
    
    const a11yPatterns = [
      {
        pattern: /<img(?![^>]*alt=)/g,
        message: 'Images should have alt attributes for accessibility',
        severity: 'high' as const,
        suggestion: this.getA11ySuggestion(/<img(?![^>]*alt=)/g),
        autoFixable: true,
      },
      {
        pattern: /<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*id="[^"]*")(?![^>]*type="submit")(?![^>]*type="button")/g,
        message: 'Form inputs should have accessible labels',
        severity: 'high' as const,
        suggestion: this.getA11ySuggestion(/<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*id="[^"]*")(?![^>]*type="submit")(?![^>]*type="button")/g),
        autoFixable: true,
      },
      {
        pattern: /<button(?![^>]*aria-label)(?![^>]*aria-labelledby)>\s*<\/button>/g,
        message: 'Empty buttons should have accessible labels',
        severity: 'medium' as const,
        suggestion: this.getA11ySuggestion(/<button(?![^>]*aria-label)(?![^>]*aria-labelledby)>\s*<\/button>/g),
        autoFixable: true,
      },
    ];

    const files = await this.getProjectFiles(['**/*.{astro,tsx,jsx,vue,svelte}']);
    
    for (const file of files) {
      const issuesInFile = await this._checkFileForPatterns(
        file,
        a11yPatterns.map(p => ({ ...p, type: 'accessibility', category: 'Accessibility', source: 'a11y-scanner', rule: 'accessibility-pattern' }))
      );
      this.issues.push(...issuesInFile);
    }
  }

  /* ==================== GIT ANALYSIS ==================== */

  private async analyzeGitStatus(): Promise<void> {
    console.log('🔍 Analyzing Git status...');
    
    try {
      const [branchInfo, statusInfo, logInfo] = await Promise.all([
        executeCommand('git branch --show-current', { cwd: this.config.projectRoot }),
        executeCommand('git status --porcelain', { cwd: this.config.projectRoot }),
        executeCommand('git log --oneline -1', { cwd: this.config.projectRoot }),
      ]);

      const branch = branchInfo.stdout.trim();
      const commit = logInfo.stdout.trim().split(' ')[0];
      const statusLines = statusInfo.stdout.trim().split('\n').filter(Boolean);

      this.gitAnalysis = {
        branch,
        commit,
        uncommittedChanges: statusLines.length > 0,
        branchStatus: 'up-to-date', // Simplified for now
        conflicts: false,
        fileChanges: {
          added: statusLines.filter(line => line.startsWith('A ')).map(line => line.substring(3)),
          modified: statusLines.filter(line => line.startsWith('M ')).map(line => line.substring(3)),
          deleted: statusLines.filter(line => line.startsWith('D ')).map(line => line.substring(3)),
        },
      };

      // Check for common Git issues
      if (this.gitAnalysis.uncommittedChanges) {
        this.issues.push({
          id: `git-uncommitted-${Date.now()}`,
          type: 'git',
          severity: {
            level: 'low',
            impact: 'minor',
            urgency: 'low',
          },
          title: 'Uncommitted Changes',
          description: 'There are uncommitted changes in the repository',
          file: '.git',
          rule: 'git-status',
          category: 'Git',
          source: 'git-analyzer',
          suggestion: 'Commit or stash changes before deployment',
          autoFixable: false,
          context: {
            current: `${statusLines.length} uncommitted changes`,
          },
          metadata: {
            checksum: this.generateChecksum(statusInfo.stdout),
            timestamp: new Date(),
          },
        });
      }

    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('GitAnalyzer', error instanceof Error ? error : new Error(String(error)));
      console.warn(`⚠️  Git analysis failed: ${analysisError.message}`);
    }
  }

  /* ==================== DEPLOYMENT READINESS ==================== */

  private async checkDeploymentReadiness(): Promise<void> {
    console.log('🔍 Checking deployment readiness...');
    
    const checks = {
      buildStatus: await this.checkBuildStatus(),
      typeChecking: await this.checkTypes(),
      linting: await this.checkLinting(),
      testing: await this.checkTesting(),
      dependencies: await this.checkDependencies(),
      security: await this.checkSecurityReadiness(),
      performance: await this.checkPerformanceReadiness(),
      accessibility: await this.checkA11yReadiness(),
      seo: await this.checkSEOReadiness(),
      assets: await this.checkAssets(),
    };

    this.deploymentStatus = checks;

    // Add issues for failed checks
    Object.entries(checks).forEach(([check, status]) => {
      if (status === 'fail') {
        this.issues.push({
          id: `deployment-${check}-${Date.now()}`,
          type: 'deployment',
          severity: {
            level: 'high',
            impact: 'blocking',
            urgency: 'high',
          },
          title: `Deployment Check Failed: ${check}`,
          description: `The ${check} check failed and must be resolved before deployment`,
          file: 'deployment',
          rule: `deployment-${check}`,
          category: 'Deployment',
          source: 'deployment-checker',
          suggestion: this.getDeploymentSuggestion(check),
          autoFixable: false,
          context: {
            current: `${check} status: ${status}`,
          },
          metadata: {
            checksum: this.generateChecksum(`${check}-${status}`),
            timestamp: new Date(),
          },
        });
      }
    });
  }

  /* ==================== UTILITY METHODS ==================== */

  private async getProjectFiles(patterns: string[] = this.config.include): Promise<string[]> {
    const projectRoot = this.config.projectRoot;

    // Use glob for powerful file matching, respecting ignores
    const files = await glob(patterns, {
      cwd: projectRoot,
      ignore: this.config.ignore,
      nodir: true, // we only want files
      absolute: true, // return absolute paths
    });

    return files;
  }

  private generateChecksum(content: string): string {
    // Simple checksum for change detection
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private getTypescriptSeverity(code: string): ErrorSeverity {
    const criticalCodes = ['2304', '2322', '2339', '2345']; // Cannot find name, type issues
    const highCodes = ['2531', '2532', '2533']; // Object possibly null/undefined
    
    if (criticalCodes.includes(code)) {
      return { level: 'critical', impact: 'blocking', urgency: 'immediate' };
    } else if (highCodes.includes(code)) {
      return { level: 'high', impact: 'major', urgency: 'high' };
    } else {
      return { level: 'medium', impact: 'minor', urgency: 'medium' };
    }
  }

  private isAutoFixableTS(code: string): boolean {
    const autoFixableCodes = ['2531', '2532']; // Missing optional chaining
    return autoFixableCodes.includes(code);
  }

  private getSecuritySuggestion(pattern: RegExp): string {
    const suggestions: Record<string, string> = {
      'eval': 'Use JSON.parse() for data parsing or Function constructor for safer code execution',
      'innerHTML': 'Use textContent, createElement, or sanitize with DOMPurify',
      'document.write': 'Use modern DOM manipulation methods',
      'window.location': 'Validate and sanitize URLs before navigation',
    };
    
    const patternStr = pattern.toString();
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (patternStr.includes(key)) {
        return suggestion;
      }
    }
    return 'Review security implications of this code pattern';
  }

  private getA11ySuggestion(pattern: RegExp): string {
    const suggestions: Record<string, string> = {
      'img': 'Add alt="description" or alt="" for decorative images',
      'input': 'Add aria-label, aria-labelledby, or associate with a label element',
      'button': 'Add descriptive text content or aria-label attribute',
    };
    
    const patternStr = pattern.toString();
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (patternStr.includes(key)) {
        return suggestion;
      }
    }
    return 'Ensure element is accessible to screen readers';
  }

  private getDeploymentSuggestion(check: string): string {
    const suggestions: Record<string, string> = {
      buildStatus: 'Fix build errors before deployment',
      typeChecking: 'Resolve TypeScript errors',
      linting: 'Fix linting issues',
      testing: 'Ensure all tests pass',
      dependencies: 'Update vulnerable dependencies',
      security: 'Address security vulnerabilities',
      performance: 'Optimize performance issues',
      accessibility: 'Fix accessibility issues',
      seo: 'Improve SEO compliance',
      assets: 'Optimize and compress assets',
    };
    
    return suggestions[check] || `Review and fix ${check} issues`;
  }

  private calculateProjectHealth(): void {
    let score = 100;
    const criticalWeight = 20;
    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 1;

    this.projectHealth.criticalIssues = this.issues.filter(i => i.severity.level === 'critical').length;
    this.projectHealth.highIssues = this.issues.filter(i => i.severity.level === 'high').length;
    this.projectHealth.mediumIssues = this.issues.filter(i => i.severity.level === 'medium').length;
    this.projectHealth.lowIssues = this.issues.filter(i => i.severity.level === 'low').length;
    this.projectHealth.totalIssues = this.issues.length;

    // Calculate deductions
    const deductions = 
      (this.projectHealth.criticalIssues * criticalWeight) +
      (this.projectHealth.highIssues * highWeight) +
      (this.projectHealth.mediumIssues * mediumWeight) +
      (this.projectHealth.lowIssues * lowWeight);

    score = Math.max(0, score - deductions);
    this.projectHealth.score = Math.round(score);

    // Update categories
    this.projectHealth.categories = this.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /* ==================== PLACEHOLDER METHODS FOR ADDITIONAL CHECKS ==================== */

  private async detectProjectStructure(): Promise<void> {
    // Detect project type, frameworks, and structure
  }

  private async checkAstroSyntax(): Promise<void> {
    // Astro-specific syntax checking
  }

  private async checkFrameworkSyntax(): Promise<void> {
    // Framework-specific syntax checking
  }

  private async checkDependencyVulnerabilities(): Promise<void> {
    // npm audit or similar security scanning
  }

  private async checkEnvironmentSecurity(): Promise<void> {
    // Check for exposed secrets in env files
  }

  private async checkImageOptimization(): Promise<void> {
    // Check image sizes and optimization
  }

  private async checkLoadingPerformance(): Promise<void> {
    // Check lazy loading and performance patterns
  }

  private async checkFrameworkPerformance(): Promise<void> {
    // Framework-specific performance checks
  }

  private async checkSEOCompliance(): Promise<void> {
    // SEO best practices checking
  }

  private async checkFrameworkSpecificIssues(): Promise<void> {
    // Framework-specific issue detection
  }

  private async checkCodeQuality(): Promise<void> {
    // Code quality metrics and patterns
  }

  private async checkEnvironmentConfiguration(): Promise<void> {
    // Environment and configuration validation
  }

  private async checkBuildStatus(): Promise<'pass' | 'fail' | 'warning'> {
    try {
      const { exitCode } = await executeCommand('npm run build', { cwd: this.config.projectRoot });
      return exitCode === 0 ? 'pass' : 'fail';
    } catch (error: unknown) {
      const cmdError = error instanceof CommandExecutionError ? error : new CommandExecutionError('npm run build', null, null, '', '', String(error));
      console.error(`Build check failed: ${cmdError.message}`);
      return 'fail';
    }
  }

  private async checkTypes(): Promise<'pass' | 'fail'> {
    try {
      const { exitCode } = await executeCommand('npx tsc --noEmit', { cwd: this.config.projectRoot });
      return exitCode === 0 ? 'pass' : 'fail';
    } catch (error: unknown) {
      const cmdError = error instanceof CommandExecutionError ? error : new CommandExecutionError('npx tsc --noEmit', null, null, '', '', String(error));
      console.error(`Type check failed: ${cmdError.message}`);
      return 'fail';
    }
  }

  private async checkLinting(): Promise<'pass' | 'fail'> {
    // Linting check implementation
    return 'pass';
  }

  private async checkTesting(): Promise<'pass' | 'fail'> {
    // Testing check implementation
    return 'pass';
  }

  private async checkDependencies(): Promise<'pass' | 'fail' | 'warning'> {
    // Dependency security check
    return 'pass';
  }

  private async checkSecurityReadiness(): Promise<'pass' | 'fail' | 'warning'> {
    // Security readiness check
    return 'pass';
  }

  private async checkPerformanceReadiness(): Promise<'pass' | 'fail' | 'warning'> {
    // Performance readiness check
    return 'pass';
  }

  private async checkA11yReadiness(): Promise<'pass' | 'fail' | 'warning'> {
    // Accessibility readiness check
    return 'pass';
  }

  private async checkSEOReadiness(): Promise<'pass' | 'fail' | 'warning'> {
    // SEO readiness check
    return 'pass';
  }

  private async checkAssets(): Promise<'pass' | 'fail' | 'warning'> {
    // Asset optimization check
    return 'pass';
  }

  /* ==================== ADDITIONAL PUBLIC METHODS ==================== */

  async autoFix(issueIds?: string[]): Promise<{
    fixed: CodeIssue[];
    failed: CodeIssue[];
    summary: string;
  }> {
    const autoFixableIssues = this.issues.filter(issue => issue.autoFixable);
    const toFix = issueIds 
      ? autoFixableIssues.filter(issue => issueIds.includes(issue.id))
      : autoFixableIssues;

    const fixed: CodeIssue[] = [];
    const failed: CodeIssue[] = [];

    for (const issue of toFix) {
      try {
        // Simulate auto-fixing - in real implementation, this would apply actual fixes
        await this.applyFix(issue);
        fixed.push(issue);
      } catch (error) {
        failed.push(issue);
      }
    }

    return {
      fixed,
      failed,
      summary: `Fixed ${fixed.length} issues, failed to fix ${failed.length} issues`
    };
  }

  async generateReport(format: 'json' | 'html' | 'markdown' | 'pdf' = 'json'): Promise<string> {
    const analysis = await this.analyzeProject();
    
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'html':
        return this.generateHTMLReport(analysis);
      case 'markdown':
        return this.generateMarkdownReport(analysis);
      case 'pdf':
        return 'PDF generation not implemented yet';
      default:
        return JSON.stringify(analysis, null, 2);
    }
  }

  private async applyFix(issue: CodeIssue): Promise<void> {
    // Simulate applying a fix - in real implementation, this would modify files
    console.log(`Applying fix for issue: ${issue.id}`);
  }

  private generateHTMLReport(analysis: { issues: CodeIssue[]; health: ProjectHealth; git: GitAnalysis | null; deployment: DeploymentChecklist | null }): string {
    return `
      <html>
        <head><title>Error Analysis Report</title></head>
        <body>
          <h1>Project Health Report</h1>
          <p>Score: ${analysis.health.score}/100</p>
          <p>Total Issues: ${analysis.health.totalIssues}</p>
          <h2>Issues</h2>
          <ul>
            ${analysis.issues.map((issue: CodeIssue) => `
              <li>
                <strong>${issue.title}</strong> (${issue.severity.level})
                <br>${issue.description}
              </li>
            `).join('')}
          </ul>
        </body>
      </html>
    `;
  }

  private generateMarkdownReport(analysis: { issues: CodeIssue[]; health: ProjectHealth; git: GitAnalysis | null; deployment: DeploymentChecklist | null }): string {
    return `
# Project Health Report

**Score:** ${analysis.health.score}/100
**Total Issues:** ${analysis.health.totalIssues}

## Issues

${analysis.issues.map((issue: CodeIssue) => `
### ${issue.title} (${issue.severity.level})

${issue.description}

**File:** ${issue.file}
**Line:** ${issue.line || 'N/A'}

`).join('')}
    `;
  }
}
