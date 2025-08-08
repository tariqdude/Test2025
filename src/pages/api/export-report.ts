// Elite Error Reviewer API - Export Report Endpoint
// Generates and exports comprehensive error analysis reports

import type { APIRoute } from 'astro';
import { AppError, ConfigurationError, NetworkError } from '../../errors';
import { logger } from '../../utils/logger';
import { ProjectAnalyzer } from '../../core/analyzer';
import { ReportGenerator } from '../../utils/report-generator';

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
    const validFormats = ['json', 'markdown', 'html'];
    if (!validFormats.includes(format)) {
      const error = new ConfigurationError(
        'outputFormat',
        `Invalid format. Must be one of: ${validFormats.join(', ')}`
      );
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize analyzer
    const analyzer = new ProjectAnalyzer({
      projectRoot,
      severityThreshold: severity as 'critical' | 'high' | 'medium' | 'low',
      enabledAnalyzers: [
        'syntax',
        'types',
        'security',
        'performance',
        'accessibility',
        ...(includeGit ? ['git'] : []),
        ...(includeDeployment ? ['deployment'] : []),
      ],
    });

    // Run analysis
    const analysisResult = await analyzer.analyze();

    let report: string;
    switch (format) {
      case 'json':
        report = ReportGenerator.generateJsonReport(analysisResult);
        break;
      case 'markdown':
        report = ReportGenerator.generateMarkdownReport(analysisResult);
        break;
      case 'html':
        report = ReportGenerator.generateHTMLReport(analysisResult);
        break;
      default:
        report = ReportGenerator.generateJsonReport(analysisResult);
    }

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
    }

    return new Response(report, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const err =
      error instanceof AppError
        ? error
        : new AppError(String(error), 'UNKNOWN_API_ERROR');
    logger.error('Export report API error', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
        timestamp: new Date().toISOString(),
      }),
      {
        status: error instanceof NetworkError ? error.status : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { format = 'markdown', projectRoot, enabledAnalyzers = [] } = body;

    // Initialize analyzer with custom configuration
    const analyzer = new ProjectAnalyzer({
      projectRoot: projectRoot || process.cwd(),
      enabledAnalyzers:
        enabledAnalyzers.length > 0
          ? enabledAnalyzers
          : [
              'syntax',
              'types',
              'security',
              'performance',
              'accessibility',
              'git',
              'deployment',
            ],
    });

    // Run analysis
    const analysisResult = await analyzer.analyze();

    let report: string;
    switch (format) {
      case 'json':
        report = ReportGenerator.generateJsonReport(analysisResult);
        break;
      case 'markdown':
        report = ReportGenerator.generateMarkdownReport(analysisResult);
        break;
      case 'html':
        report = ReportGenerator.generateHTMLReport(analysisResult);
        break;
      default:
        report = ReportGenerator.generateJsonReport(analysisResult);
    }

    // Prepare response data
    const responseData: {
      success: boolean;
      format: string;
      timestamp: string;
      report: string;
    } = {
      success: true,
      format,
      timestamp: new Date().toISOString(),
      report,
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err =
      error instanceof AppError
        ? error
        : new AppError(String(error), 'UNKNOWN_API_ERROR');
    logger.error('Export report POST API error', err);

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
