import { Checker } from './checker';
import { CodeIssue, ReviewConfig, ErrorSeverity } from '../utils/error-reviewer';
import { executeCommand } from '../utils/command-executor';
import path from 'path';
import { CommandExecutionError, AnalysisError } from '../errors';

export class TypeChecker implements Checker {
  name = 'TypeChecker';

  canHandle(config: ReviewConfig):
 boolean {
    return config.enabledCheckers.includes('types');
  }

  async check(config: ReviewConfig): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    console.log('🔍 Checking type errors...');

    try {
      const { stdout, stderr } = await executeCommand('npx tsc --noEmit --skipLibCheck', {
        cwd: config.projectRoot,
        ignoreExitCode: true,
      });

      if (stderr || stdout.includes('error TS')) {
        const typeErrors = this.parseTSErrors(stdout + stderr, config.projectRoot);
        issues.push(...typeErrors);
      }
    } catch (error: unknown) {
      const analysisError = error instanceof CommandExecutionError ? 
        new AnalysisError(this.name, error, `Failed to run TypeScript type check: ${error.message}`) :
        new AnalysisError(this.name, error instanceof Error ? error : new Error(String(error)));
      throw analysisError;
    }
    return issues;
  }

  private parseTSErrors(output: string, projectRoot: string): CodeIssue[] {
    const lines = output.split('\n');
    const errors: CodeIssue[] = [];
    
    for (const line of lines) {
      const match = line.match(/^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
      if (match) {
        const [, file, lineNum, colNum, code, message] = match;
        
        errors.push({
          id: `ts-${code}-${Date.now()}`,
          type: 'type',
          severity: this.getTypescriptSeverity(code),
          title: `TypeScript Error TS${code}`,
          description: message,
          file: path.relative(projectRoot, file),
          line: parseInt(lineNum),
          column: parseInt(colNum),
          rule: `TS${code}`,
          category: 'TypeScript',
          source: 'typescript',
          autoFixable: this.isAutoFixableTS(code),
          context: {
            current: line,
          },
          metadata: {
            checksum: this.generateChecksum(line),
            timestamp: new Date(),
          },
        });
      }
    }
    
    return errors;
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
}
