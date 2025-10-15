import { ProjectAnalyzer } from '../core/analyzer';
import { ReportGenerator } from '../utils/report-generator';
import { logger, LogLevel } from '../utils/logger';
import { AppError } from '../errors';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { promises as fs } from 'fs';
import { ConfigLoader } from '../config/config-loader';
import type { AnalyzerConfig } from '../config/schema';
import chokidar from 'chokidar';

class Cli {
  private args: Partial<AnalyzerConfig> & {
    output?: string;
    format?: 'json' | 'markdown' | 'html';
    verbose?: boolean;
    clearCache?: boolean;
  };

  constructor() {
    this.args = yargs(hideBin(process.argv))
      .option('projectRoot', {
        type: 'string',
        description: 'Root directory of the project to analyze',
      })
      .option('severityThreshold', {
        type: 'string',
        choices: ['critical', 'high', 'medium', 'low', 'info'],
        description: 'Minimum severity level of issues to report',
      })
      .option('output', {
        type: 'string',
        alias: 'o',
        description: 'Output file path for the report',
      })
      .option('outputFormat', {
        type: 'string',
        choices: ['json', 'markdown', 'html', 'terminal'],
        description: 'Output format for the report',
      })
      .option('githubIntegration', {
        type: 'boolean',
        description: 'Enable GitHub integration',
      })
      .option('deploymentChecks', {
        type: 'boolean',
        description: 'Enable deployment readiness checks',
      })
      .option('autoFix', {
        type: 'boolean',
        description: 'Attempt to automatically fix issues',
      })
      .option('watchMode', {
        type: 'boolean',
        description: 'Run in watch mode, re-analyzing on file changes',
      })
      .option('enableCache', {
        type: 'boolean',
        description: 'Enable caching of analysis results',
      })
      .option('clearCache', {
        type: 'boolean',
        description: 'Clear the analysis cache before running',
      })
      .option('verbose', {
        type: 'boolean',
        description: 'Enable verbose logging',
      })
      .help()
      .alias('h', 'help')
      .parse() as typeof this.args;

    if (this.args.verbose) {
      logger.setMinLevel(LogLevel.DEBUG);
    }
  }

  private async performAnalysisAndReport(config: AnalyzerConfig) {
    const analyzer = new ProjectAnalyzer(config);
    const analysisResult = await analyzer.analyze();

    let reportContent: string;
    switch (config.outputFormat) {
      case 'json':
        reportContent = ReportGenerator.generateJsonReport(analysisResult);
        break;
      case 'markdown':
        reportContent = ReportGenerator.generateMarkdownReport(analysisResult);
        break;
      case 'html':
        reportContent = ReportGenerator.generateHTMLReport(analysisResult);
        break;
      case 'terminal':
        reportContent = ReportGenerator.generateJsonReport(analysisResult); // For terminal, we'll just output JSON for now
        break;
      default:
        reportContent = ReportGenerator.generateJsonReport(analysisResult); // Fallback
    }

    if (this.args.output) {
      const outputPath = path.resolve(config.projectRoot, this.args.output);
      await fs.writeFile(outputPath, reportContent);
      logger.info(`Report successfully written to ${outputPath}`);
    } else {
      console.log(reportContent);
    }
  }

  async run() {
    try {
      logger.info('Initializing Project Analyzer CLI...');

      const loadedConfig = await ConfigLoader.loadConfig({
        projectRoot: this.args.projectRoot,
        severityThreshold: this.args.severityThreshold,
        outputFormat: this.args.outputFormat,
        githubIntegration: this.args.githubIntegration,
        deploymentChecks: this.args.deploymentChecks,
        autoFix: this.args.autoFix,
        watchMode: this.args.watchMode,
        enableCache: this.args.enableCache,
      });

      // Clear cache if requested
      if (this.args.clearCache) {
        const analyzer = new ProjectAnalyzer(loadedConfig);
        await analyzer.clearCache();
      }

      // Initial analysis
      await this.performAnalysisAndReport(loadedConfig);

      if (loadedConfig.watchMode) {
        logger.info(`Watching for changes in ${loadedConfig.projectRoot}...`);
        logger.info('Press Ctrl+C to stop watching');
        
        const watcher = chokidar.watch(loadedConfig.projectRoot, {
          ignored: loadedConfig.ignore, // Use configured ignore patterns
          persistent: true,
          ignoreInitial: true, // Don't trigger on initial scan
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
          },
        });

        let debounceTimer: NodeJS.Timeout | null = null;
        const changedFiles: Set<string> = new Set();

        watcher.on('all', async (event, changedPath) => {
          changedFiles.add(changedPath);
          
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(async () => {
            logger.info(
              `${changedFiles.size} file(s) changed, re-analyzing...`
            );
            logger.debug(`Changed files: ${Array.from(changedFiles).join(', ')}`);
            changedFiles.clear();
            
            try {
              await this.performAnalysisAndReport(loadedConfig);
              logger.info('Analysis complete. Watching for more changes...');
            } catch (error) {
              logger.error('Analysis failed during watch', error instanceof Error ? error : undefined);
            }
          }, 1000); // Wait 1 second after last change before re-analyzing
        });

        watcher.on('error', (error) => {
          logger.error('File watcher error', error instanceof Error ? error : undefined);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
          logger.info('Stopping file watcher...');
          watcher.close();
          process.exit(0);
        });

        // Keep the process alive
        process.stdin.resume();
      } else {
        logger.info('CLI execution finished.');
      }
    } catch (error: unknown) {
      const err =
        error instanceof AppError
          ? error
          : new AppError(String(error), 'CLI_ERROR');
      logger.fatal('CLI encountered a fatal error', err);
      process.exit(1);
    }
  }
}

new Cli().run();
