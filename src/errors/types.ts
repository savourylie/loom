/**
 * Error codes for lexer and parser errors per DSL spec
 * E001-E099: Lexer/syntax errors
 * E101-E199: Property validation errors
 * E201-E299: Semantic errors
 * E301-E399: Layout errors
 * W501-W599: Performance warnings
 */
export enum ErrorCode {
  // ===== Lexer Errors (E001-E010) =====
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

  // ===== Parser Syntax Errors (E011-E020) =====
  /** E011: Unexpected token (expected something else) */
  UNEXPECTED_TOKEN = 'E011',

  /** E012: Missing required token */
  MISSING_TOKEN = 'E012',

  /** E013: Missing label for component that requires it */
  MISSING_LABEL = 'E013',

  /** E014: Invalid node structure */
  INVALID_NODE = 'E014',

  /** E015: Mismatched indentation */
  MISMATCHED_INDENT = 'E015',

  // ===== Property Validation Errors (E101-E199) =====
  /** E101: Property not allowed for this component type */
  INVALID_PROPERTY_FOR_COMPONENT = 'E101',

  /** E102: Missing required property */
  MISSING_REQUIRED_PROPERTY = 'E102',

  /** E103: Invalid property value */
  INVALID_PROPERTY_VALUE = 'E103',

  /** E104: Property value out of valid range */
  PROPERTY_VALUE_OUT_OF_RANGE = 'E104',

  // ===== Semantic Errors (E201-E299) =====
  /** E201: Duplicate node ID */
  DUPLICATE_ID = 'E201',

  /** E202: Undefined variable reference */
  UNDEFINED_VARIABLE = 'E202',

  /** E203: Undefined color reference */
  UNDEFINED_COLOR = 'E203',

  /** E204: Invalid component nesting */
  INVALID_NESTING = 'E204',

  /** E205: Breakpoint condition is contradictory */
  BREAKPOINT_CONDITION_CONFLICT = 'E205',

  // ===== Layout Errors (E301-E399) =====
  /** E301: Placement tokens used on non-grid child */
  PLACEMENT_WITHOUT_GRID = 'E301',

  /** E302: Grid placement out of bounds */
  PLACEMENT_OUT_OF_BOUNDS = 'E302',

  /** E303: Invalid placement combination */
  INVALID_PLACEMENT_COMBINATION = 'E303',

  /** E304: Missing grid columns property */
  MISSING_GRID_COLUMNS = 'E304',

  // ===== Performance Warnings (W501-W599) =====
  /** W501: Node count exceeds recommended threshold */
  NODE_COUNT_WARNING = 'W501',

  /** W502: Node count exceeds hard limit */
  NODE_COUNT_LIMIT = 'W502',

  /** W503: Deeply nested structure may impact performance */
  DEEP_NESTING_WARNING = 'W503',

  /** W504: Breakpoint conditions overlap */
  BREAKPOINT_OVERLAP = 'W504',
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
