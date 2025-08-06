export interface CodeIssue {
  id: string;
  type: string;
  severity: {
    level: 'critical' | 'high' | 'medium' | 'low' | 'info';
    impact: 'blocking' | 'major' | 'minor' | 'cosmetic';
    urgency: 'immediate' | 'high' | 'medium' | 'low';
  };
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  rule: string;
  category: string;
  source: string;
  suggestion?: string;
  autoFixable: boolean;
  documentation?: string;
  context?: {
    before?: string[];
    current: string;
    after?: string[];
  };
  metadata?: {
    component?: string;
    framework?: string;
    dependencies?: string[];
    relatedFiles?: string[];
    checksum?: string;
    timestamp?: Date;
  };
}

export interface ProjectHealth {
  score: number; // 0-100
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  totalIssues: number;
  categories: Record<string, number>;
  trends: {
    improving: boolean;
    velocity: number;
    lastCheck: Date;
  };
}

export interface GitAnalysis {
  branch: string;
  commit: string;
  uncommittedChanges: boolean;
  branchStatus: 'ahead' | 'behind' | 'diverged' | 'up-to-date';
  conflicts: boolean;
  fileChanges: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

export interface DeploymentChecklist {
  buildStatus: 'pass' | 'fail' | 'warning';
  typeChecking: 'pass' | 'fail';
  linting: 'pass' | 'fail';
  testing: 'pass' | 'fail';
  dependencies: 'pass' | 'fail' | 'warning';
  security: 'pass' | 'fail' | 'warning';
  performance: 'pass' | 'fail' | 'warning';
  accessibility: 'pass' | 'fail' | 'warning';
  seo: 'pass' | 'fail' | 'warning';
  assets: 'pass' | 'fail' | 'warning';
}

export interface AnalysisResult {
  issues: CodeIssue[];
  health: ProjectHealth;
  git: GitAnalysis | null;
  deployment: DeploymentChecklist | null;
}

export interface AnalysisModule {
  name: string;
  canAnalyze(config: AnalyzerConfig): boolean;
  analyze(config: AnalyzerConfig): Promise<CodeIssue[]>;
}

export interface AnalyzerConfig {
  projectRoot: string;
  ignore: string[];
  include: string[];
  frameworks: string[];
  enabledAnalyzers: string[];
  severityThreshold: 'critical' | 'high' | 'medium' | 'low' | 'info';
  outputFormat: 'json' | 'markdown' | 'html' | 'terminal';
  githubIntegration: boolean;
  deploymentChecks: boolean;
  autoFix: boolean;
  watchMode: boolean;
}
