import { AnalysisModule, CodeIssue, AnalyzerConfig, DeploymentChecklist } from '../types/analysis';
import { executeCommand } from '../utils/command-executor';
import { AnalysisError, CommandExecutionError } from '../errors';
import { logger } from '../utils/logger';

export class DeploymentAnalyzer implements AnalysisModule {
  name = 'DeploymentAnalyzer';

  canAnalyze(config: AnalyzerConfig): boolean {
    return config.enabledAnalyzers.includes('deployment');
  }

  async analyze(config: AnalyzerConfig): Promise<CodeIssue[]> {
    logger.info('Checking deployment readiness...');
    const issues: CodeIssue[] = [];

    try {
      const checks: DeploymentChecklist = {
        buildStatus: await this.checkBuildStatus(config),
        typeChecking: await this.checkTypes(config),
        linting: 'pass', // Placeholder
        testing: 'pass', // Placeholder
        dependencies: 'pass', // Placeholder
        security: 'pass', // Placeholder
        performance: 'pass', // Placeholder
        accessibility: 'pass', // Placeholder
        seo: 'pass', // Placeholder
        assets: 'pass', // Placeholder
      };

      // Add issues for failed checks
      Object.entries(checks).forEach(([check, status]) => {
        if (status === 'fail') {
          issues.push({
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
            source: 'deployment-analyzer',
            suggestion: this.getDeploymentSuggestion(check),
            autoFixable: false,
            context: {
              current: `${check} status: ${status}`,
            },
          });
        }
      });

    } catch (error: unknown) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError(this.name, error instanceof Error ? error : new Error(String(error)));
      logger.warn(`Deployment analysis failed: ${analysisError.message}`, { error: analysisError });
    }
    return issues;
  }

  private async checkBuildStatus(config: AnalyzerConfig): Promise<'pass' | 'fail' | 'warning'> {
    try {
      const { exitCode } = await executeCommand('npm run build', { cwd: config.projectRoot });
      return exitCode === 0 ? 'pass' : 'fail';
    } catch (error: unknown) {
      const cmdError = error instanceof CommandExecutionError ? error : new CommandExecutionError('npm run build', null, null, '', '', String(error));
      logger.error(`Build check failed: ${cmdError.message}`, cmdError);
      return 'fail';
    }
  }

  private async checkTypes(config: AnalyzerConfig): Promise<'pass' | 'fail'> {
    try {
      const { exitCode } = await executeCommand('npx tsc --noEmit', { cwd: config.projectRoot });
      return exitCode === 0 ? 'pass' : 'fail';
    } catch (error: unknown) {
      const cmdError = error instanceof CommandExecutionError ? error : new CommandExecutionError('npx tsc --noEmit', null, null, '', '', String(error));
      logger.error(`Type check failed: ${cmdError.message}`, cmdError);
      return 'fail';
    }
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
}
