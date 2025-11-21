import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';
import type { CodeIssue } from '../types/analysis';

interface CacheEntry {
  fileHash: string;
  issues: CodeIssue[];
  timestamp: number;
  analyzedBy: string[];
}

interface CacheData {
  version: string;
  files: Record<string, CacheEntry>;
}

export class AnalysisCache {
  private cacheDir: string;
  private cacheFile: string;
  private cache: CacheData;
  private readonly CACHE_VERSION = '1.0.0';
  private readonly MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(projectRoot: string) {
    this.cacheDir = path.join(projectRoot, '.cache');
    this.cacheFile = path.join(this.cacheDir, 'analysis-cache.json');
    this.cache = {
      version: this.CACHE_VERSION,
      files: {},
    };
  }

  /**
   * Initialize cache by loading from disk if exists
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });

      try {
        const data = await fs.readFile(this.cacheFile, 'utf-8');
        const cached = JSON.parse(data) as CacheData;

        // Invalidate if version mismatch
        if (cached.version !== this.CACHE_VERSION) {
          logger.warn('Cache version mismatch, clearing cache');
          await this.clear();
        } else {
          this.cache = cached;
          logger.debug(
            `Loaded cache with ${Object.keys(this.cache.files).length} entries`
          );
        }
      } catch {
        // Cache file doesn't exist or is invalid, start fresh
        logger.debug('No existing cache found, starting fresh');
      }
    } catch (error) {
      logger.warn(
        'Failed to initialize cache',
        error as Record<string, unknown>
      );
    }
  }

  /**
   * Calculate hash of file content
   */
  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Failed to hash file ${filePath}: ${error}`);
    }
  }

  /**
   * Get cached issues for a file if cache is valid
   */
  async getCachedIssues(
    filePath: string,
    analyzerModules: string[]
  ): Promise<CodeIssue[] | null> {
    try {
      const entry = this.cache.files[filePath];

      if (!entry) {
        return null;
      }

      // Check if cache is too old
      if (Date.now() - entry.timestamp > this.MAX_CACHE_AGE_MS) {
        logger.debug(`Cache expired for ${filePath}`);
        delete this.cache.files[filePath];
        return null;
      }

      // Check if file has been modified
      const currentHash = await this.getFileHash(filePath);
      if (currentHash !== entry.fileHash) {
        logger.debug(`File modified: ${filePath}`);
        delete this.cache.files[filePath];
        return null;
      }

      // Check if all required analyzers were run
      const hasAllAnalyzers = analyzerModules.every(module =>
        entry.analyzedBy.includes(module)
      );

      if (!hasAllAnalyzers) {
        logger.debug(`Missing analyzer results for ${filePath}`);
        return null;
      }

      logger.debug(`Cache hit for ${filePath}`);
      return entry.issues;
    } catch (error) {
      logger.warn(
        `Error reading cache for ${filePath}`,
        error as Record<string, unknown>
      );
      return null;
    }
  }

  /**
   * Store analysis results for a file
   */
  async setCachedIssues(
    filePath: string,
    issues: CodeIssue[],
    analyzerModules: string[]
  ): Promise<void> {
    try {
      const fileHash = await this.getFileHash(filePath);

      this.cache.files[filePath] = {
        fileHash,
        issues,
        timestamp: Date.now(),
        analyzedBy: analyzerModules,
      };

      logger.debug(`Cached ${issues.length} issues for ${filePath}`);
    } catch (error) {
      logger.warn(
        `Failed to cache results for ${filePath}`,
        error as Record<string, unknown>
      );
    }
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<void> {
    try {
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify(this.cache, null, 2),
        'utf-8'
      );
      logger.debug('Cache saved successfully');
    } catch (error) {
      logger.warn('Failed to save cache', error as Record<string, unknown>);
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache = {
      version: this.CACHE_VERSION,
      files: {},
    };

    try {
      await fs.unlink(this.cacheFile);
      logger.info('Cache cleared');
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Remove specific files from cache
   */
  invalidate(filePaths: string[]): void {
    for (const filePath of filePaths) {
      delete this.cache.files[filePath];
    }
    logger.debug(`Invalidated cache for ${filePaths.length} files`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalFiles: number;
    totalIssues: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const files = Object.values(this.cache.files);
    const totalIssues = files.reduce(
      (sum, entry) => sum + entry.issues.length,
      0
    );
    const timestamps = files.map(entry => entry.timestamp);

    return {
      totalFiles: files.length,
      totalIssues,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}
