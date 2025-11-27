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
      // Check for known vulnerabilities via npm audit
      await this.checkDependencyVulnerabilities(config, issues);

      // Check for security anti-patterns
      await this.checkSecurityPatterns(config, issues);

      // Check environment variables exposure
      await this.checkEnvironmentSecurity(config, issues);
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

  /**
   * Check for dependency vulnerabilities using npm audit
   */
  private async checkDependencyVulnerabilities(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      const auditResult = execSync('npm audit --json', {
        cwd: config.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const audit = JSON.parse(auditResult);

      if (audit.metadata?.vulnerabilities) {
        const { critical, high, moderate } = audit.metadata.vulnerabilities;

        if (critical > 0) {
          issues.push({
            id: `security-vuln-critical-${Date.now()}`,
            type: 'security',
            severity: {
              level: 'critical',
              impact: 'blocking',
              urgency: 'immediate',
            },
            title: `${critical} Critical Dependency Vulnerabilities`,
            description: `Found ${critical} critical security vulnerabilities in dependencies. Run \`npm audit fix\` to resolve.`,
            file: 'package.json',
            rule: 'dependency-vulnerability',
            category: 'Security',
            source: 'npm-audit',
            suggestion:
              'Run `npm audit fix --force` or update vulnerable packages manually',
            autoFixable: true,
          });
        }

        if (high > 0) {
          issues.push({
            id: `security-vuln-high-${Date.now()}`,
            type: 'security',
            severity: { level: 'high', impact: 'major', urgency: 'high' },
            title: `${high} High Severity Dependency Vulnerabilities`,
            description: `Found ${high} high severity security vulnerabilities in dependencies.`,
            file: 'package.json',
            rule: 'dependency-vulnerability',
            category: 'Security',
            source: 'npm-audit',
            suggestion:
              'Run `npm audit` to see details and `npm audit fix` to resolve',
            autoFixable: true,
          });
        }

        if (moderate > 0) {
          issues.push({
            id: `security-vuln-moderate-${Date.now()}`,
            type: 'security',
            severity: { level: 'medium', impact: 'minor', urgency: 'medium' },
            title: `${moderate} Moderate Dependency Vulnerabilities`,
            description: `Found ${moderate} moderate security vulnerabilities in dependencies.`,
            file: 'package.json',
            rule: 'dependency-vulnerability',
            category: 'Security',
            source: 'npm-audit',
            suggestion:
              'Review vulnerabilities with `npm audit` and update when possible',
            autoFixable: false,
          });
        }
      }
    } catch {
      // npm audit may fail or return non-zero on vulnerabilities, which is expected
      logger.debug(
        'npm audit check completed (may have found vulnerabilities)'
      );
    }
  }

  /**
   * Check for exposed environment variables or secrets
   */
  private async checkEnvironmentSecurity(
    config: AnalyzerConfig,
    issues: CodeIssue[]
  ): Promise<void> {
    const secretPatterns = [
      {
        pattern:
          /(['"]?)(?:api[_-]?key|apikey)(['"]?)\s*[:=]\s*(['"])[^'"]+\3/gi,
        name: 'API Key',
      },
      {
        pattern:
          /(['"]?)(?:secret|password|passwd|pwd)(['"]?)\s*[:=]\s*(['"])[^'"]+\3/gi,
        name: 'Secret/Password',
      },
      {
        pattern: /(['"]?)(?:private[_-]?key)(['"]?)\s*[:=]\s*(['"])[^'"]+\3/gi,
        name: 'Private Key',
      },
      {
        pattern:
          /(['"]?)(?:auth[_-]?token|access[_-]?token|bearer)(['"]?)\s*[:=]\s*(['"])[^'"]+\3/gi,
        name: 'Auth Token',
      },
      {
        pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
        name: 'Private Key Block',
      },
    ];

    const files = await this.getProjectFiles(config);

    for (const file of files) {
      // Skip common false positive files
      if (
        file.includes('node_modules') ||
        file.includes('.env.example') ||
        file.endsWith('.md')
      ) {
        continue;
      }

      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (const { pattern, name } of secretPatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              issues.push({
                id: `security-secret-${Date.now()}-${Math.random()}`,
                type: 'security',
                severity: {
                  level: 'critical',
                  impact: 'blocking',
                  urgency: 'immediate',
                },
                title: `Potential ${name} Exposure`,
                description: `Possible hardcoded ${name} detected. Never commit secrets to version control.`,
                file: path.relative(config.projectRoot, file),
                line: i + 1,
                rule: 'no-hardcoded-secrets',
                category: 'Security',
                source: 'secret-scanner',
                suggestion:
                  'Move secrets to environment variables and add to .gitignore',
                autoFixable: false,
                context: {
                  before: lines.slice(Math.max(0, i - 1), i),
                  current: lines[i].replace(
                    /(['"])[^'"]{8,}(['"])/g,
                    '$1[REDACTED]$2'
                  ),
                  after: lines.slice(i + 1, i + 2),
                },
              });
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
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
