/**
 * Error codes for lexer errors (E001-E099 range per DSL spec)
 */
export enum ErrorCode {
  /** E001: Unterminated string literal */
  UNTERMINATED_STRING = 'E001',

  /** E002: Invalid character or unknown token */
  INVALID_TOKEN = 'E002',

  /** E003: Invalid number format */
  INVALID_NUMBER = 'E003',

  /** E004: Invalid placement token format */
  INVALID_PLACEMENT = 'E004',

  /** E005: Invalid property syntax */
  INVALID_PROPERTY = 'E005',

  /** E006: Invalid selector syntax */
  INVALID_SELECTOR = 'E006',

  /** E007: Unexpected end of file */
  UNEXPECTED_EOF = 'E007',

  /** E008: Invalid escape sequence in string */
  INVALID_ESCAPE = 'E008',

  /** E009: Invalid hex color format */
  INVALID_COLOR = 'E009',

  /** E010: Generic syntax error */
  SYNTAX_ERROR = 'E010',
}

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Lexer error with position and metadata for editor integration
 */
export class LexerError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public override readonly message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly severity: ErrorSeverity = ErrorSeverity.ERROR,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'LexerError';

    // Log to console in development for observability
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Lexer Error]', {
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
    };
  }
}
