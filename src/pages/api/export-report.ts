// Elite Error Reviewer API - Export Report Endpoint
// Generates and exports comprehensive error analysis reports

import type { APIRoute } from 'astro';
import { EliteErrorReviewer } from '../../utils/error-reviewer.js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    
    // Parse query parameters
    const format = searchParams.get('format') || 'markdown';
    const projectRoot = searchParams.get('projectRoot') || process.cwd();
    const severity = searchParams.get('severity') || 'low';
    const includeGit = searchParams.get('git') !== 'false';
    const includeDeployment = searchParams.get('deployment') !== 'false';

    // Validate format
    const validFormats = ['json', 'markdown', 'html', 'terminal'];
    if (!validFormats.includes(format)) {
      return new Response(JSON.stringify({
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize error reviewer
    const reviewer = new EliteErrorReviewer({
      projectRoot,
      outputFormat: format as any,
      severityThreshold: severity as any,
      githubIntegration: includeGit,
      deploymentChecks: includeDeployment,
    });

    // Run analysis
    const analysis = await reviewer.analyzeProject();
    
    // Generate report
    const report = await reviewer.generateReport(format as any);

    // Determine content type and filename
    let contentType = 'text/plain';
    let filename = `error-report.${format}`;
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        break;
      case 'markdown':
        contentType = 'text/markdown';
        filename = 'error-report.md';
        break;
      case 'html':
        contentType = 'text/html';
        filename = 'error-report.html';
        break;
      case 'terminal':
        contentType = 'text/plain';
        filename = 'error-report.txt';
        break;
    }

    return new Response(report, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Export report API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      format = 'markdown',
      projectRoot,
      configuration = {},
      includeRawData = false,
    } = body;

    // Initialize with custom configuration
    const reviewer = new EliteErrorReviewer({
      projectRoot: projectRoot || process.cwd(),
      outputFormat: format,
      ...configuration,
    });

    // Run analysis
    const analysis = await reviewer.analyzeProject();
    
    // Generate report
    const report = await reviewer.generateReport(format);

    // Prepare response data
    const responseData: any = {
      success: true,
      format,
      timestamp: new Date().toISOString(),
      report,
      summary: {
        totalIssues: analysis.issues.length,
        healthScore: analysis.health.score,
        criticalIssues: analysis.health.criticalIssues,
        highIssues: analysis.health.highIssues,
        mediumIssues: analysis.health.mediumIssues,
        lowIssues: analysis.health.lowIssues,
      },
    };

    if (includeRawData) {
      responseData.rawData = analysis;
    }

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Export report POST API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};