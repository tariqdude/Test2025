// Elite Error Reviewer API - Auto-fix Endpoint
// Handles automatic fixing of detected issues

import type { APIRoute } from 'astro';
import { EliteErrorReviewer } from '../../../utils/error-reviewer.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectRoot, issueIds, dryRun = false } = body;

    // Initialize error reviewer
    const reviewer = new EliteErrorReviewer({
      projectRoot: projectRoot || process.cwd(),
      autoFix: true,
    });

    // Run analysis first to get current issues
    const analysis = await reviewer.analyzeProject();

    // Filter issues to fix
    let issuesToFix = analysis.issues.filter(issue => issue.autoFixable);
    
    if (issueIds && Array.isArray(issueIds)) {
      issuesToFix = issuesToFix.filter(issue => issueIds.includes(issue.id));
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        fixableIssues: issuesToFix.length,
        issues: issuesToFix.map(issue => ({
          id: issue.id,
          title: issue.title,
          file: issue.file,
          line: issue.line,
          autoFixable: issue.autoFixable,
          suggestion: issue.suggestion,
        })),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Actually fix the issues
    const fixResults = await reviewer.autoFix();

    return new Response(JSON.stringify({
      success: true,
      fixed: fixResults.fixed.length,
      failed: fixResults.failed.length,
      details: {
        fixed: fixResults.fixed.map(issue => ({
          id: issue.id,
          title: issue.title,
          file: issue.file,
        })),
        failed: fixResults.failed.map(issue => ({
          id: issue.id,
          title: issue.title,
          file: issue.file,
          reason: 'Auto-fix failed',
        })),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-fix API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
