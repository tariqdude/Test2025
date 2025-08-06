import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import { CommandExecutionError } from '../errors';

const execPromise = promisify(exec);

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
}

interface CommandOptions {
  cwd?: string;
  timeout?: number; // in milliseconds
  maxBuffer?: number; // in bytes, default 1024 * 1024 (1MB)
  ignoreExitCode?: boolean; // if true, won't throw error on non-zero exit code
}

export async function executeCommand(
  command: string,
  options: CommandOptions = {}
): Promise<CommandResult> {
  const { cwd, timeout = 60000, maxBuffer = 10 * 1024 * 1024, ignoreExitCode = false } = options; // Default timeout 60s, maxBuffer 10MB

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd,
      timeout,
      maxBuffer,
      killSignal: 'SIGTERM', // Use SIGTERM for graceful shutdown
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
      signal: null,
    };
  } catch (error: unknown) {
    const err = error as ExecException & { stdout: string; stderr: string; code: number | null; signal: NodeJS.Signals | null };

    if (!ignoreExitCode) {
      throw new CommandExecutionError(
        command,
        err.code,
        err.signal,
        err.stdout,
        err.stderr,
        `Command execution failed: ${command}`
      );
    }

    return {
      stdout: err.stdout,
      stderr: err.stderr,
      exitCode: err.code,
      signal: err.signal,
    };
  }
}

