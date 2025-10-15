import type { AnalyzerConfig } from './schema';
import { AnalyzerConfigSchema } from './schema';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { ConfigurationError } from '../errors';

type ReadFileFn = (path: string, encoding: BufferEncoding) => Promise<string>;

export class ConfigLoader {
  static async loadConfig(
    cliOptions: Partial<AnalyzerConfig>,
    readFile: ReadFileFn = fs.readFile
  ): Promise<AnalyzerConfig> {
    let config: Partial<AnalyzerConfig> = {};

    // 1. Load default configuration (handled by Zod schema defaults)

    // 2. Load from file (.analyzer.json)
    const configFilePath = path.join(
      cliOptions.projectRoot || process.cwd(),
      '.analyzer.json'
    );
    try {
      const fileContent = await readFile(configFilePath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      config = { ...config, ...fileConfig };
      logger.info(`Loaded configuration from ${configFilePath}`);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info(
          `No .analyzer.json found at ${configFilePath}. Using defaults and CLI options.`
        );
      } else {
        logger.warn(
          `Failed to parse .analyzer.json at ${configFilePath}: ${error instanceof Error ? error.message : String(error)}`
        );
        throw new ConfigurationError(
          'file',
          `Failed to parse .analyzer.json: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // 3. Apply CLI options (highest precedence)
    config = { ...config, ...cliOptions };

    // 4. Validate and return
    try {
      return AnalyzerConfigSchema.parse(config);
    } catch (error: unknown) {
      logger.error(
        'Configuration validation failed',
        error instanceof Error ? error : undefined
      );
      throw new ConfigurationError(
        'validation',
        `Invalid configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
