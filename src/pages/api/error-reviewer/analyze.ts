// Elite Error Reviewer API - Analysis Endpoint
// Provides comprehensive project analysis data

import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EliteErrorReviewer } from '../../../utils/error-reviewer.js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    
    // Parse query parameters
    const projectRoot = searchParams.get('projectRoot') || process.cwd();
    const format = searchParams.get('format') || 'json';
    const severity = searchParams.get('severity') || 'low';
    const categories = searchParams.get('categories')?.split(',') || [];
    const enableGit = searchParams.get('git') !== 'false';
    const enableDeployment = searchParams.get('deployment') !== 'false';

    // Initialize error reviewer with configuration
    const reviewer = new EliteErrorReviewer({
      projectRoot,
      outputFormat: format as any,
      severityThreshold: severity as any,
      githubIntegration: enableGit,
      deploymentChecks: enableDeployment,
      enabledCheckers: [
        'syntax',
        'types', 
        'security',
        'performance',
        'accessibility',
        'seo',
        ...(enableGit ? ['git'] : []),
        ...(enableDeployment ? ['deployment'] : []),
      ],
    });

    // Run comprehensive analysis
    const analysis = await reviewer.analyzeProject();

    // Filter by categories if specified
    let filteredIssues = analysis.issues;
    if (categories.length > 0) {
      filteredIssues = analysis.issues.filter(issue => 
        categories.includes(issue.category.toLowerCase())
      );
    }

    // Prepare response data
    const responseData = {
      timestamp: new Date().toISOString(),
      projectRoot,
      configuration: {
        format,
        severity,
        categories,
        gitEnabled: enableGit,
        deploymentEnabled: enableDeployment,
      },
      summary: {
        totalIssues: filteredIssues.length,
        criticalIssues: filteredIssues.filter(i => i.severity.level === 'critical').length,
        highIssues: filteredIssues.filter(i => i.severity.level === 'high').length,
        mediumIssues: filteredIssues.filter(i => i.severity.level === 'medium').length,
        lowIssues: filteredIssues.filter(i => i.severity.level === 'low').length,
        autoFixableIssues: filteredIssues.filter(i => i.autoFixable).length,
        categoriesBreakdown: filteredIssues.reduce((acc, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      health: analysis.health,
      git: analysis.git,
      deployment: analysis.deployment,
      issues: filteredIssues,
      recommendations: generateRecommendations(analysis),
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    
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
      projectRoot,
      configuration = {},
      enabledCheckers = [],
    } = body;

    // Initialize with custom configuration
    const reviewer = new EliteErrorReviewer({
      projectRoot: projectRoot || process.cwd(),
      ...configuration,
      enabledCheckers: enabledCheckers.length > 0 ? enabledCheckers : [
        'syntax', 'types', 'security', 'performance', 'accessibility', 'git', 'deployment'
      ],
    });

    // Run analysis
    const analysis = await reviewer.analyzeProject();

    return new Response(JSON.stringify({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Custom analysis API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Generate smart recommendations based on analysis results
function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  const { issues, health, git, deployment } = analysis;

  // Health-based recommendations
  if (health.score < 50) {
    recommendations.push('🚨 Critical: Project health is below 50%. Address critical and high-priority issues immediately.');
  } else if (health.score < 70) {
    recommendations.push('⚠️ Warning: Project health needs attention. Focus on high-priority issues.');
  } else if (health.score < 90) {
    recommendations.push('📈 Good: Project is healthy but can be improved by addressing remaining issues.');
  }

  // Issue-specific recommendations
  const criticalIssues = issues.filter((i: any) => i.severity.level === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push(`🔴 Fix ${criticalIssues.length} critical issue(s) immediately - they block deployment.`);
  }

  const securityIssues = issues.filter((i: any) => i.type === 'security');
  if (securityIssues.length > 0) {
    recommendations.push(`🔒 Address ${securityIssues.length} security issue(s) to protect your application.`);
  }

  const performanceIssues = issues.filter((i: any) => i.type === 'performance');
  if (performanceIssues.length > 5) {
    recommendations.push(`⚡ Optimize performance - ${performanceIssues.length} issues detected that may impact user experience.`);
  }

  const a11yIssues = issues.filter((i: any) => i.type === 'accessibility');
  if (a11yIssues.length > 0) {
    recommendations.push(`♿ Improve accessibility - ${a11yIssues.length} issues found that affect users with disabilities.`);
  }

  // Auto-fix recommendations
  const autoFixableIssues = issues.filter((i: any) => i.autoFixable);
  if (autoFixableIssues.length > 0) {
    recommendations.push(`🔧 Run auto-fix to automatically resolve ${autoFixableIssues.length} issues.`);
  }

  // Git-specific recommendations
  if (git?.uncommittedChanges) {
    recommendations.push('📝 Commit your changes before deployment to ensure consistency.');
  }

  if (git?.conflicts) {
    recommendations.push('⚠️ Resolve merge conflicts before proceeding with development.');
  }

  // Deployment recommendations
  if (deployment) {
    const failedChecks = Object.entries(deployment).filter(([, status]) => status === 'fail');
    if (failedChecks.length > 0) {
      recommendations.push(`🚀 Fix deployment issues: ${failedChecks.map(([check]) => check).join(', ')} must pass before deployment.`);
    }
  }

  // Category-specific recommendations
  const categories = issues.reduce((acc: any, issue: any) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categories).sort(([,a], [,b]) => (b as number) - (a as number))[0];
  if (topCategory && topCategory[1] > 5) {
    recommendations.push(`📊 Focus on ${topCategory[0]} issues - they represent the largest category with ${topCategory[1]} items.`);
  }

  // Code quality recommendations
  const codeQualityIssues = issues.filter((i: any) => i.category === 'Code Quality');
  if (codeQualityIssues.length > 10) {
    recommendations.push('🏗️ Consider refactoring to improve code maintainability and reduce technical debt.');
  }

  // TypeScript recommendations
  const typeIssues = issues.filter((i: any) => i.type === 'type');
  if (typeIssues.length > 3) {
    recommendations.push('📘 Strengthen TypeScript types to catch more errors at compile time.');
  }

  return recommendations.slice(0, 8); // Limit to most important recommendations
}
