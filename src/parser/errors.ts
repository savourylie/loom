/**
 * Parser-specific error handling
 */

import { ErrorCode, ErrorSeverity } from '../errors/index.js';

/**
 * Parser error with position and metadata
 * Extends the base error framework with parser-specific information
 */
export class ParserError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public override readonly message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly severity: ErrorSeverity = ErrorSeverity.ERROR,
    public readonly hint?: string,
    public readonly range?: { start: number; end: number },
  ) {
    super(message);
    this.name = 'ParserError';

    // Log to console in development for observability
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Parser Error]', {
        code: this.code,
        message: this.message,
        line: this.line,
        column: this.column,
        severity: this.severity,
        hint: this.hint,
      });
    }
  }

  /**
   * Format error for display in editor gutter or console
   */
  format(): string {
    const location = `${this.line}:${this.column}`;
    const hint = this.hint ? `\n  Hint: ${this.hint}` : '';
    return `[${this.code}] ${this.message} at ${location}${hint}`;
  }

  /**
   * Convert to structured format for editor integration
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      line: this.line,
      column: this.column,
      severity: this.severity,
      hint: this.hint,
      range: this.range,
    };
  }
}
