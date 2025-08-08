import type {
  AnalysisModule,
  CodeIssue,
  AnalyzerConfig,
} from '../types/analysis';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { FileSystemError, AnalysisError } from '../errors';
import { logger } from '../utils/logger';
import { generateChecksum } from '../utils/common';

export class SecurityAnalyzer implements AnalysisModule {
  name = 'SecurityAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('security');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Checking security vulnerabilities...');
    const issues: CodeIssue[] = [];

    try {
      // Check for known vulnerabilities (placeholder for npm audit or similar)
      // await this.checkDependencyVulnerabilities(config, issues);

      // Check for security anti-patterns
      await this.checkSecurityPatterns(config, issues);

      // Check environment variables exposure
      // await this.checkEnvironmentSecurity(config, issues);
    } catch (error: unknown) {
      const analysisError =
        error instanceof AnalysisError
          ? error
          : new AnalysisError(
              this.name,
              error instanceof Error ? error : new Error(String(error))
            );
      logger.warn(`Security analysis failed: ${analysisError.message}`, {
        error: analysisError,
      });
    }
    return issues;
  }

  private async checkSecurityPatterns(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Avoid using eval() as it can execute arbitrary code',
        severity: 'critical' as const,
        suggestion: this.getSecuritySuggestion(/eval\s*\(/g),
      },
      {
        pattern: /innerHTML\s*=/g,
        message:
          'innerHTML can lead to XSS vulnerabilities. Use textContent or sanitize input.',
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
        suggestion: this.getSecuritySuggestion(
          /window\.location\.href\s*=\s*[^"'`\s]+/g
        ),
      },
    ];

    const files = await this.getProjectFiles(config);

    for (const file of files) {
      const issuesInFile = await this._checkFileForPatterns(
        file,
        securityPatterns.map(p => ({
          ...p,
          type: 'security',
          category: 'Security',
          source: 'security-scanner',
          rule: 'security-pattern',
          autoFixable: false,
        })),
        config.projectRoot
      );
      issues.push(...issuesInFile);
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
    }>,
    projectRoot: string
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const {
        pattern,
        message,
        severity,
        type,
        category,
        source,
        rule,
        suggestion,
        autoFixable,
        documentation,
      } of patterns) {
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
              file: path.relative(projectRoot, filePath),
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
                checksum: generateChecksum(line),
                timestamp: new Date(),
              },
            });
          }
        }
      }
    } catch (error: unknown) {
      const fsError =
        error instanceof FileSystemError
          ? error
          : new FileSystemError(
              'read',
              filePath,
              error instanceof Error ? error : new Error(String(error))
            );
      logger.warn(`Could not analyze ${filePath}: ${fsError.message}`, {
        error: fsError,
        filePath,
      });
    }
    return issues;
  }

  private async getProjectFiles(config: AnalyzerConfig): Promise<string[]> {
    const projectRoot = config.projectRoot;

    const files = await glob(config.include, {
      cwd: projectRoot,
      ignore: config.ignore,
      nodir: true,
      absolute: true,
    });

    return files;
  }

  private getSecuritySuggestion(pattern: RegExp): string {
    const suggestions: Record<string, string> = {
      eval: 'Use JSON.parse() for data parsing or Function constructor for safer code execution',
      innerHTML: 'Use textContent, createElement, or sanitize with DOMPurify',
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
}
