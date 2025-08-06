import { AnalysisResult, CodeIssue, ProjectHealth, GitAnalysis, DeploymentChecklist } from '../types/analysis';

export class ReportGenerator {
  static generateHTMLReport(analysis: AnalysisResult): string {
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

  static generateMarkdownReport(analysis: AnalysisResult): string {
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

  static generateJsonReport(analysis: AnalysisResult): string {
    return JSON.stringify(analysis, null, 2);
  }
}
