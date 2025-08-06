import type { AnalysisModule, CodeIssue, AnalyzerConfig, GitAnalysis } from '../types/analysis';
import { executeCommand } from '../utils/command-executor';
import { AnalysisError, CommandExecutionError } from '../errors';
import { logger } from '../utils/logger';

export class GitAnalyzer implements AnalysisModule {
  name = 'GitAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('git');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Analyzing Git status...');
    const issues: CodeIssue[] = [];

    try {
      const [branchInfo, statusInfo, logInfo] = await Promise.all([
        this.executeCommand('git branch --show-current', config),
        this.executeCommand('git status --porcelain', config),
        this.executeCommand('git log --oneline -1', config),
      ]);

      const branch = branchInfo.stdout.trim();
      const commit = logInfo.stdout.trim().split(' ')[0];
      const statusLines = statusInfo.stdout.trim().split('\n').filter(Boolean);

      const gitAnalysis: GitAnalysis = {
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
      if (gitAnalysis.uncommittedChanges) {
        issues.push({
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
        });
      }

    } catch (error: unknown) {
      const analysisError = error instanceof CommandExecutionError ? 
        new AnalysisError(this.name, error, `Failed to run Git command: ${error.message}`) :
        new AnalysisError(this.name, error instanceof Error ? error : new Error(String(error)));
      logger.warn(`Git analysis failed: ${analysisError.message}`, { error: analysisError });
    }
    return issues;
  }

  private async executeCommand(command: string, config: AnalyzerConfig): Promise<{ stdout: string; stderr: string; exitCode: number | null; signal: NodeJS.Signals | null }> {
    return executeCommand(command, { cwd: config.projectRoot, ignoreExitCode: true });
  }
}
