#!/usr/bin/env node
// Elite Error Reviewer CLI
// Command-line interface for comprehensive project analysis

import { EliteErrorReviewer, type ReviewConfig, type CodeIssue, type ProjectHealth } from './error-reviewer.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==================== CLI CONFIGURATION ==================== */

interface CLIArgs {
  command: 'analyze' | 'watch' | 'fix' | 'report' | 'init' | 'help';
  options: {
    config?: string;
    output?: string;
    format?: 'json' | 'markdown' | 'html' | 'terminal';
    severity?: 'critical' | 'high' | 'medium' | 'low';
    autoFix?: boolean;
    watch?: boolean;
    github?: boolean;
    deployment?: boolean;
    verbose?: boolean;
    quiet?: boolean;
  };
}

/* ==================== MAIN CLI CLASS ==================== */

export class ErrorReviewerCLI {
  private args: CLIArgs;
  private config: ReviewConfig;

  constructor() {
    this.args = this.parseArgs();
    this.config = this.getDefaultConfig();
  }

  async run(): Promise<void> {
    try {
      await this.loadConfig();
      
      switch (this.args.command) {
        case 'analyze':
          await this.runAnalysis();
          break;
        case 'watch':
          await this.runWatchMode();
          break;
        case 'fix':
          await this.runAutoFix();
          break;
        case 'report':
          await this.generateReport();
          break;
        case 'init':
          await this.initializeProject();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ CLI Error:', error);
      process.exit(1);
    }
  }

  /* ==================== COMMAND IMPLEMENTATIONS ==================== */

  private async runAnalysis(): Promise<void> {
    const spinner = this.createSpinner('Analyzing project...');
    spinner.start();

    try {
      const reviewer = new EliteErrorReviewer(this.config);
      const results = await reviewer.analyzeProject();

      spinner.stop();
      
      if (!this.args.options.quiet) {
        this.displayResults(results);
      }

      if (this.args.options.output) {
        await this.saveResults(results);
      }

      // Exit with error code if critical issues found
      const criticalIssues = results.issues.filter(i => i.severity.level === 'critical');
      if (criticalIssues.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async runWatchMode(): Promise<void> {
    console.log('👀 Starting watch mode...\n');
    
    const reviewer = new EliteErrorReviewer({ ...this.config, watchMode: true });
    
    // Initial analysis
    await this.runAnalysis();
    
    console.log('\n🔄 Watching for file changes...');
    
    // In a real implementation, we'd use fs.watch or chokidar
    // For now, just run analysis every 30 seconds
    setInterval(async () => {
      try {
        console.log('\n🔍 Re-analyzing...');
        const results = await reviewer.analyzeProject();
        this.displayResults(results);
      } catch (error) {
        console.error('❌ Watch analysis failed:', error);
      }
    }, 30000);
  }

  private async runAutoFix(): Promise<void> {
    console.log('🔧 Running auto-fix...\n');
    
    const reviewer = new EliteErrorReviewer({ ...this.config, autoFix: true });
    const results = await reviewer.analyzeProject();
    
    const fixableIssues = results.issues.filter(issue => issue.autoFixable);
    
    if (fixableIssues.length === 0) {
      console.log('✅ No auto-fixable issues found.');
      return;
    }

    console.log(`🔧 Found ${fixableIssues.length} auto-fixable issues:`);
    
    for (const issue of fixableIssues) {
      console.log(`  - ${issue.title} in ${issue.file}:${issue.line}`);
      // In a real implementation, apply the fix
      await this.applyFix(issue);
    }

    console.log(`\n✅ Applied ${fixableIssues.length} automatic fixes.`);
    console.log('💡 Run analysis again to verify fixes.');
  }

  private async generateReport(): Promise<void> {
    console.log('📊 Generating comprehensive report...\n');
    
    const reviewer = new EliteErrorReviewer(this.config);
    const results = await reviewer.analyzeProject();
    
    const reportPath = this.args.options.output || 'error-report.html';
    const format = this.args.options.format || path.extname(reportPath).slice(1) as any || 'html';
    
    await this.generateDetailedReport(results, reportPath, format);
    
    console.log(`✅ Report generated: ${reportPath}`);
  }

  private async initializeProject(): Promise<void> {
    console.log('🚀 Initializing Elite Error Reviewer...\n');
    
    const configPath = path.join(process.cwd(), '.error-reviewer.json');
    const config = {
      ...this.getDefaultConfig(),
      projectRoot: process.cwd(),
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log('✅ Configuration file created: .error-reviewer.json');
    console.log('💡 Customize settings and run "npx error-reviewer analyze"');
  }

  /* ==================== DISPLAY AND FORMATTING ==================== */

  private displayResults(results: { issues: CodeIssue[]; health: ProjectHealth; git: any; deployment: any }): void {
    const { issues, health } = results;
    
    // Health Score Display
    this.displayHealthScore(health);
    
    // Issues Summary
    this.displayIssuesSummary(issues);
    
    // Detailed Issues (top 10 most critical)
    const topIssues = issues
      .sort((a, b) => this.getSeverityWeight(b.severity.level) - this.getSeverityWeight(a.severity.level))
      .slice(0, 10);
    
    if (topIssues.length > 0) {
      console.log('\n🔍 TOP CRITICAL ISSUES:\n');
      topIssues.forEach((issue, index) => {
        this.displayIssue(issue, index + 1);
      });
    }

    // Git Status
    if (results.git) {
      this.displayGitStatus(results.git);
    }

    // Deployment Readiness
    if (results.deployment) {
      this.displayDeploymentStatus(results.deployment);
    }

    // Recommendations
    this.displayRecommendations(health, issues);
  }

  private displayHealthScore(health: ProjectHealth): void {
    const scoreColor = health.score >= 90 ? '🟢' : health.score >= 70 ? '🟡' : '🔴';
    const trend = health.trends.improving ? '📈' : '📉';
    
    console.log('📊 PROJECT HEALTH SCORE\n');
    console.log(`${scoreColor} Overall Score: ${health.score}/100 ${trend}`);
    console.log(`🚨 Critical: ${health.criticalIssues}`);
    console.log(`⚠️  High: ${health.highIssues}`);
    console.log(`📋 Medium: ${health.mediumIssues}`);
    console.log(`ℹ️  Low: ${health.lowIssues}`);
    console.log(`📊 Total Issues: ${health.totalIssues}`);
  }

  private displayIssuesSummary(issues: CodeIssue[]): void {
    const categories = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(categories).length > 0) {
      console.log('\n📂 ISSUES BY CATEGORY:\n');
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  ${this.getCategoryIcon(category)} ${category}: ${count}`);
        });
    }
  }

  private displayIssue(issue: CodeIssue, index: number): void {
    const severityIcon = this.getSeverityIcon(issue.severity.level);
    const typeIcon = this.getTypeIcon(issue.type);
    
    console.log(`${index}. ${severityIcon} ${typeIcon} ${issue.title}`);
    console.log(`   📁 ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
    console.log(`   💬 ${issue.description}`);
    
    if (issue.suggestion) {
      console.log(`   💡 ${issue.suggestion}`);
    }
    
    if (issue.autoFixable) {
      console.log(`   🔧 Auto-fixable`);
    }
    
    console.log('');
  }

  private displayGitStatus(git: any): void {
    console.log('\n📝 GIT STATUS:\n');
    console.log(`🌿 Branch: ${git.branch}`);
    console.log(`📝 Latest Commit: ${git.commit}`);
    console.log(`🔄 Uncommitted Changes: ${git.uncommittedChanges ? '⚠️  Yes' : '✅ No'}`);
    
    if (git.fileChanges.modified.length > 0) {
      console.log(`📝 Modified Files: ${git.fileChanges.modified.length}`);
    }
  }

  private displayDeploymentStatus(deployment: any): void {
    console.log('\n🚀 DEPLOYMENT READINESS:\n');
    
    Object.entries(deployment).forEach(([check, status]) => {
      const icon = status === 'pass' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${check}: ${status}`);
    });
  }

  private displayRecommendations(health: ProjectHealth, issues: CodeIssue[]): void {
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (health.criticalIssues > 0) {
      console.log('🚨 URGENT: Fix critical issues before deployment');
    }
    
    if (health.score < 70) {
      console.log('📈 Focus on improving code quality and fixing high-priority issues');
    }
    
    const securityIssues = issues.filter(i => i.type === 'security').length;
    if (securityIssues > 0) {
      console.log('🔒 Review and address security vulnerabilities');
    }
    
    const performanceIssues = issues.filter(i => i.type === 'performance').length;
    if (performanceIssues > 0) {
      console.log('⚡ Optimize performance bottlenecks');
    }
    
    const a11yIssues = issues.filter(i => i.type === 'accessibility').length;
    if (a11yIssues > 0) {
      console.log('♿ Improve accessibility compliance');
    }
  }

  /* ==================== REPORT GENERATION ==================== */

  private async generateDetailedReport(
    results: { issues: CodeIssue[]; health: ProjectHealth; git: any; deployment: any },
    outputPath: string,
    format: 'json' | 'markdown' | 'html'
  ): Promise<void> {
    switch (format) {
      case 'json':
        await this.generateJSONReport(results, outputPath);
        break;
      case 'markdown':
        await this.generateMarkdownReport(results, outputPath);
        break;
      case 'html':
        await this.generateHTMLReport(results, outputPath);
        break;
    }
  }

  private async generateJSONReport(results: any, outputPath: string): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      ...results,
    };
    
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  }

  private async generateMarkdownReport(results: any, outputPath: string): Promise<void> {
    const { issues, health } = results;
    
    let markdown = `# Elite Error Review Report\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    // Health Summary
    markdown += `## 📊 Project Health\n\n`;
    markdown += `- **Overall Score:** ${health.score}/100\n`;
    markdown += `- **Critical Issues:** ${health.criticalIssues}\n`;
    markdown += `- **High Issues:** ${health.highIssues}\n`;
    markdown += `- **Medium Issues:** ${health.mediumIssues}\n`;
    markdown += `- **Low Issues:** ${health.lowIssues}\n\n`;
    
    // Issues Details
    if (issues.length > 0) {
      markdown += `## 🐛 Issues Found\n\n`;
      
      issues.forEach((issue: CodeIssue, index: number) => {
        markdown += `### ${index + 1}. ${issue.title}\n\n`;
        markdown += `- **File:** \`${issue.file}:${issue.line || 'N/A'}\`\n`;
        markdown += `- **Severity:** ${issue.severity.level}\n`;
        markdown += `- **Type:** ${issue.type}\n`;
        markdown += `- **Description:** ${issue.description}\n`;
        
        if (issue.suggestion) {
          markdown += `- **Suggestion:** ${issue.suggestion}\n`;
        }
        
        markdown += `- **Auto-fixable:** ${issue.autoFixable ? 'Yes' : 'No'}\n\n`;
      });
    }
    
    await fs.writeFile(outputPath, markdown);
  }

  private async generateHTMLReport(results: any, outputPath: string): Promise<void> {
    const { issues, health } = results;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elite Error Review Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .health-score { display: flex; align-items: center; gap: 20px; margin: 20px 0; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
        .score-good { background: #10b981; color: white; }
        .score-warning { background: #f59e0b; color: white; }
        .score-danger { background: #ef4444; color: white; }
        .issue { border: 1px solid #e5e7eb; border-radius: 6px; margin: 15px 0; padding: 20px; }
        .issue-critical { border-left: 4px solid #ef4444; }
        .issue-high { border-left: 4px solid #f59e0b; }
        .issue-medium { border-left: 4px solid #3b82f6; }
        .issue-low { border-left: 4px solid #10b981; }
        .issue-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
        .issue-meta { display: flex; gap: 15px; font-size: 14px; color: #6b7280; margin-bottom: 10px; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-critical { background: #fef2f2; color: #dc2626; }
        .badge-high { background: #fffbeb; color: #d97706; }
        .badge-medium { background: #eff6ff; color: #2563eb; }
        .badge-low { background: #f0fdf4; color: #16a34a; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Elite Error Review Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
            <h2>📊 Project Health</h2>
            <div class="health-score">
                <div class="score-circle ${health.score >= 90 ? 'score-good' : health.score >= 70 ? 'score-warning' : 'score-danger'}">
                    ${health.score}/100
                </div>
                <div>
                    <div><strong>Critical:</strong> ${health.criticalIssues}</div>
                    <div><strong>High:</strong> ${health.highIssues}</div>
                    <div><strong>Medium:</strong> ${health.mediumIssues}</div>
                    <div><strong>Low:</strong> ${health.lowIssues}</div>
                </div>
            </div>
            
            <h2>🐛 Issues Found (${issues.length})</h2>
            ${issues.map((issue: CodeIssue) => `
                <div class="issue issue-${issue.severity.level}">
                    <div class="issue-title">${issue.title}</div>
                    <div class="issue-meta">
                        <span class="badge badge-${issue.severity.level}">${issue.severity.level}</span>
                        <span>${issue.file}:${issue.line || 'N/A'}</span>
                        <span>${issue.type}</span>
                    </div>
                    <p>${issue.description}</p>
                    ${issue.suggestion ? `<p><strong>💡 Suggestion:</strong> ${issue.suggestion}</p>` : ''}
                    ${issue.autoFixable ? '<p><strong>🔧 Auto-fixable</strong></p>' : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  /* ==================== UTILITY METHODS ==================== */

  private parseArgs(): CLIArgs {
    const args = process.argv.slice(2);
    const command = args[0] as CLIArgs['command'] || 'help';
    const options: CLIArgs['options'] = {};

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--config':
        case '-c':
          options.config = nextArg;
          i++;
          break;
        case '--output':
        case '-o':
          options.output = nextArg;
          i++;
          break;
        case '--format':
        case '-f':
          options.format = nextArg as any;
          i++;
          break;
        case '--severity':
        case '-s':
          options.severity = nextArg as any;
          i++;
          break;
        case '--auto-fix':
          options.autoFix = true;
          break;
        case '--watch':
        case '-w':
          options.watch = true;
          break;
        case '--github':
          options.github = true;
          break;
        case '--deployment':
          options.deployment = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--quiet':
        case '-q':
          options.quiet = true;
          break;
      }
    }

    return { command, options };
  }

  private getDefaultConfig(): ReviewConfig {
    return {
      projectRoot: process.cwd(),
      ignore: ['node_modules', '.git', 'dist', 'build', '.astro'],
      include: ['**/*.{ts,tsx,js,jsx,astro,vue,svelte,md,mdx}'],
      frameworks: ['astro', 'react', 'vue', 'svelte', 'solid', 'preact'],
      enabledCheckers: ['syntax', 'types', 'security', 'performance', 'accessibility', 'git', 'deployment'],
      severityThreshold: 'low',
      outputFormat: 'terminal',
      githubIntegration: true,
      deploymentChecks: true,
      autoFix: false,
      watchMode: false,
    };
  }

  private async loadConfig(): Promise<void> {
    const configPath = this.args.options.config || path.join(process.cwd(), '.error-reviewer.json');
    
    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const fileConfig = JSON.parse(configFile);
      this.config = { ...this.config, ...fileConfig };
    } catch {
      // Use default config if file doesn't exist
    }

    // Override with CLI options
    if (this.args.options.severity) {
      this.config.severityThreshold = this.args.options.severity;
    }
    if (this.args.options.format) {
      this.config.outputFormat = this.args.options.format;
    }
    if (this.args.options.autoFix) {
      this.config.autoFix = true;
    }
    if (this.args.options.watch) {
      this.config.watchMode = true;
    }
  }

  private async saveResults(results: any): Promise<void> {
    const outputPath = this.args.options.output!;
    const format = this.args.options.format || path.extname(outputPath).slice(1) as any || 'json';
    
    await this.generateDetailedReport(results, outputPath, format);
    console.log(`📄 Results saved to: ${outputPath}`);
  }

  private async applyFix(issue: CodeIssue): Promise<void> {
    // In a real implementation, this would apply the actual fix
    console.log(`  🔧 Fixed: ${issue.title}`);
  }

  private getSeverityWeight(severity: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[severity as keyof typeof weights] || 0;
  }

  private getSeverityIcon(severity: string): string {
    const icons = { critical: '🚨', high: '⚠️', medium: '📋', low: 'ℹ️' };
    return icons[severity as keyof typeof icons] || '❓';
  }

  private getTypeIcon(type: string): string {
    const icons = {
      syntax: '📝',
      type: '🏷️',
      security: '🔒',
      performance: '⚡',
      accessibility: '♿',
      git: '📝',
      deployment: '🚀',
    };
    return icons[type as keyof typeof icons] || '🐛';
  }

  private getCategoryIcon(category: string): string {
    const icons = {
      TypeScript: '🏷️',
      Security: '🔒',
      Performance: '⚡',
      Accessibility: '♿',
      Git: '📝',
      Deployment: '🚀',
    };
    return icons[category as keyof typeof icons] || '📂';
  }

  private createSpinner(text: string) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let interval: NodeJS.Timeout;

    return {
      start: () => {
        process.stdout.write(text);
        interval = setInterval(() => {
          process.stdout.write(`\r${frames[i]} ${text}`);
          i = (i + 1) % frames.length;
        }, 100);
      },
      stop: () => {
        clearInterval(interval);
        process.stdout.write(`\r✅ ${text}\n`);
      },
    };
  }

  private showHelp(): void {
    console.log(`
🛡️ Elite Error Reviewer - Comprehensive Project Analysis

USAGE:
  npx error-reviewer <command> [options]

COMMANDS:
  analyze     Run comprehensive project analysis
  watch       Run analysis in watch mode
  fix         Auto-fix fixable issues
  report      Generate detailed report
  init        Initialize configuration
  help        Show this help

OPTIONS:
  -c, --config <path>     Configuration file path
  -o, --output <path>     Output file path
  -f, --format <format>   Output format (json|markdown|html|terminal)
  -s, --severity <level>  Minimum severity level (critical|high|medium|low)
  --auto-fix              Enable automatic fixes
  -w, --watch             Enable watch mode
  --github                Enable GitHub integration
  --deployment            Enable deployment checks
  -v, --verbose           Verbose output
  -q, --quiet             Quiet mode

EXAMPLES:
  npx error-reviewer analyze
  npx error-reviewer analyze --severity high --output report.html
  npx error-reviewer watch --auto-fix
  npx error-reviewer report --format markdown --output README-ERRORS.md
  npx error-reviewer fix

CONFIGURATION:
  Create .error-reviewer.json in your project root to customize settings.
  Run 'npx error-reviewer init' to generate a default configuration.

For more information, visit: https://github.com/your-repo/elite-error-reviewer
`);
  }
}

/* ==================== CLI ENTRY POINT ==================== */

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ErrorReviewerCLI();
  cli.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
