import { CodeIssue, ReviewConfig } from '../utils/error-reviewer';

export interface Checker {
  name: string;
  canHandle(config: ReviewConfig): boolean;
  check(config: ReviewConfig): Promise<CodeIssue[]>;
}
