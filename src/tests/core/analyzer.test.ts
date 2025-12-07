import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectAnalyzer } from '../../core/analyzer';
import { ConfigLoader } from '../../config/config-loader';

// Hoist mocks
const { mockAnalyze, MockAnalyzer } = vi.hoisted(() => {
  const mockAnalyze = vi.fn().mockResolvedValue([]);
  const MockAnalyzer = vi.fn().mockImplementation(function () {
    return {
      canAnalyze: vi.fn().mockReturnValue(true),
      analyze: mockAnalyze,
    };
  });
  return { mockAnalyze, MockAnalyzer };
});

// Mock dependencies
vi.mock('../../config/config-loader', () => ({
  ConfigLoader: {
    loadConfig: vi.fn().mockImplementation(async config => ({
      ...config,
      projectRoot: '/test/root',
      enableCache: false,
    })),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/analysis-cache');

// Mock analyzers
vi.mock('../../analysis/syntax', () => ({ SyntaxAnalyzer: MockAnalyzer }));
vi.mock('../../analysis/types', () => ({ TypesAnalyzer: MockAnalyzer }));
vi.mock('../../analysis/security', () => ({ SecurityAnalyzer: MockAnalyzer }));
vi.mock('../../analysis/performance', () => ({
  PerformanceAnalyzer: MockAnalyzer,
}));
vi.mock('../../analysis/accessibility', () => ({
  AccessibilityAnalyzer: MockAnalyzer,
}));
vi.mock('../../analysis/git', () => ({ GitAnalyzer: MockAnalyzer }));
vi.mock('../../analysis/deployment', () => ({
  DeploymentAnalyzer: MockAnalyzer,
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('ProjectAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyze.mockResolvedValue([]);
  });

  it('should initialize with default modules', () => {
    new ProjectAnalyzer();
    expect(MockAnalyzer).toHaveBeenCalledTimes(7); // 7 modules
  });

  it('should run analysis', async () => {
    const analyzer = new ProjectAnalyzer();
    mockAnalyze.mockResolvedValueOnce([
      {
        id: 'issue1',
        severity: { level: 'high' },
        category: 'style',
      },
    ]);

    const result = await analyzer.analyze();

    expect(ConfigLoader.loadConfig).toHaveBeenCalled();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].id).toBe('issue1');
  });

  it('should auto-fix issues', async () => {
    const analyzer = new ProjectAnalyzer();

    // Mock analyze to return fixable issue
    mockAnalyze.mockResolvedValueOnce([
      {
        id: 'fixable1',
        file: 'test.ts',
        line: 1,
        autoFixable: true,
        suggestion: 'Fix me',
        category: 'style',
        severity: { level: 'medium' },
      },
    ]);

    const result = await analyzer.autoFix();

    expect(result.fixed).toHaveLength(1);
    expect(result.fixed[0].id).toBe('fixable1');

    // Check if file was written
    const fs = await import('fs/promises');
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
