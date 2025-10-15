// Elite Error Reviewer API - Auto-fix Endpoint
// Handles automatic fixing of detected issues

import type { APIRoute } from 'astro';
import type { CodeIssue } from '../../../types/analysis';
import { AppError } from '../../../errors';
import { logger } from '../../../utils/logger';
import { ProjectAnalyzer } from '../../../core/analyzer';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (import.meta.env.SSR && import.meta.env.PROD) {
      return new Response(
        JSON.stringify(
          {
            success: false,
            message:
              'Auto-fix API is disabled in static builds. Run the CLI locally.',
          },
          null,
          2
        ),
        {
          status: 501,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    const body = await request.json();
    const { projectRoot, issueIds, dryRun = false } = body;

    const analyzer = new ProjectAnalyzer({
      projectRoot: projectRoot || process.cwd(),
      autoFix: true, // Indicate that auto-fix is enabled
    });

    // If dry run, analyze and return fixable issues without applying fixes
    if (dryRun) {
      const analysis = await analyzer.analyze();
      const fixableIssues = analysis.issues.filter(issue => issue.autoFixable);

      const filteredIssues =
        issueIds && issueIds.length > 0
          ? fixableIssues.filter(issue =>
              issueIds.includes(issue.id || `${issue.file}:${issue.line}`)
            )
          : fixableIssues;

      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          fixableIssues: filteredIssues.length,
          issues: filteredIssues.map((issue: CodeIssue) => ({
            id: issue.id || `${issue.file}:${issue.line}`,
            title: issue.title,
            file: issue.file,
            line: issue.line,
            category: issue.category,
            autoFixable: true,
            suggestion: issue.suggestion,
          })),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform actual auto-fix
    const fixResults = await analyzer.autoFix(issueIds);

    return new Response(
      JSON.stringify({
        success: true,
        fixed: fixResults.fixed.length,
        failed: fixResults.failed.length,
        details: {
          fixed: fixResults.fixed.map((issue: CodeIssue) => ({
            id: issue.id || `${issue.file}:${issue.line}`,
            title: issue.title,
            file: issue.file,
            line: issue.line,
            category: issue.category,
          })),
          failed: fixResults.failed.map(({ issue, reason }) => ({
            id: issue.id || `${issue.file}:${issue.line}`,
            title: issue.title,
            file: issue.file,
            line: issue.line,
            category: issue.category,
            reason,
          })),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const err =
      error instanceof AppError
        ? error
        : new AppError(String(error), 'UNKNOWN_API_ERROR');
    logger.error('Auto-fix API error', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
