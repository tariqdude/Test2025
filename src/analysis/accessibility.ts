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

export class AccessibilityAnalyzer implements AnalysisModule {
  name = 'AccessibilityAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('accessibility');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Checking accessibility compliance...');
    const issues: CodeIssue[] = [];

    const a11yPatterns = [
      {
        pattern: /<img(?![^>]*alt=)/g,
        message: 'Images should have alt attributes for accessibility',
        severity: 'high' as const,
        suggestion: this.getA11ySuggestion(/<img(?![^>]*alt=)/g),
        autoFixable: true,
      },
      {
        pattern:
          /<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*id="[^"]*")(?![^>]*type="submit")(?![^>]*type="button")/g,
        message: 'Form inputs should have accessible labels',
        severity: 'high' as const,
        suggestion: this.getA11ySuggestion(
          /<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*id="[^"]*")(?![^>]*type="submit")(?![^>]*type="button")/g
        ),
        autoFixable: true,
      },
      {
        pattern:
          /<button(?![^>]*aria-label)(?![^>]*aria-labelledby)>\s*<\/button>/g,
        message: 'Empty buttons should have accessible labels',
        severity: 'medium' as const,
        suggestion: this.getA11ySuggestion(
          /<button(?![^>]*aria-label)(?![^>]*aria-labelledby)>\s*<\/button>/g
        ),
        autoFixable: true,
      },
    ];

    try {
      const files = await this.getProjectFiles(config, [
        '**/*.{astro,tsx,jsx,vue,svelte}',
      ]);

      for (const file of files) {
        const issuesInFile = await this._checkFileForPatterns(
          file,
          a11yPatterns.map(p => ({
            ...p,
            type: 'accessibility',
            category: 'Accessibility',
            source: 'a11y-scanner',
            rule: 'accessibility-pattern',
          })),
          config.projectRoot
        );
        issues.push(...issuesInFile);
      }
    } catch (error: unknown) {
      const analysisError =
        error instanceof AnalysisError
          ? error
          : new AnalysisError(
              this.name,
              error instanceof Error ? error : new Error(String(error))
            );
      logger.warn(`Accessibility analysis failed: ${analysisError.message}`, {
        error: analysisError,
      });
    }
    return issues;
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
              id: `${type}-` + Date.now() + '-' + Math.random(),
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

  private async getProjectFiles(
    config: AnalyzerConfig,
    patterns: string[]
  ): Promise<string[]> {
    const projectRoot = config.projectRoot;

    const files = await glob(patterns, {
      cwd: projectRoot,
      ignore: config.ignore,
      nodir: true,
      absolute: true,
    });

    return files;
  }

  private getA11ySuggestion(pattern: RegExp): string {
    const suggestions: Record<string, string> = {
      img: 'Add alt="description" or alt="" for decorative images',
      input:
        'Add aria-label, aria-labelledby, or associate with a label element',
      button: 'Add descriptive text content or aria-label attribute',
    };

    const patternStr = pattern.toString();
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (patternStr.includes(key)) {
        return suggestion;
      }
    }
    return 'Ensure element is accessible to screen readers';
  }
}
