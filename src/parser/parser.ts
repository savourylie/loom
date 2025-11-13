/**
 * Loom DSL Parser
 * Recursive-descent parser that consumes lexer tokens and produces AST
 */

import { Tokenizer } from '../lexer/tokenizer.js';
import { Token, TokenType } from '../lexer/tokens.js';
import { Node, Document, PlacementTokens, createDocument, createNode } from '../ast/types.js';
import { ErrorCode, ErrorSeverity } from '../errors/index.js';
import { DiagnosticCollector, Diagnostic } from './diagnostics.js';

/**
 * Parser options
 */
export interface ParseOptions {
  /** Maximum number of nodes before hard error (default: 1000) */
  maxNodes?: number;
  /** Warning threshold for node count (default: 300) */
  warnThreshold?: number;
  /** Optional range for incremental parsing (not yet implemented) */
  incrementalRange?: { start: number; end: number };
}

/**
 * Parse result with document, diagnostics, and metrics
 */
export interface ParseResult {
  /** Parsed document (best-effort, may be partial if errors) */
  document: Document;
  /** All diagnostics (errors + warnings) */
  diagnostics: Diagnostic[];
  /** Parse metrics for performance monitoring */
  metrics: ParseMetrics;
}

/**
 * Parse metrics for observability
 */
export interface ParseMetrics {
  /** Total parse time in milliseconds */
  parseTimeMs: number;
  /** Total nodes parsed */
  nodeCount: number;
  /** Total diagnostics */
  diagnosticCount: number;
  /** Error-level diagnostics */
  errorCount: number;
  /** Warning-level diagnostics */
  warningCount: number;
}

/**
 * Component types that require labels
 */
const REQUIRES_LABEL = new Set(['text', 'input', 'button', 'image', 'icon', 'list', 'tabs']);

/**
 * Component types that are containers (can have children)
 */
const CONTAINER_TYPES = new Set(['grid', 'hstack', 'vstack', 'zstack', 'section', 'card']);

/**
 * Main Parser class
 */
export class Parser {
  private tokenizer: Tokenizer;
  private diagnostics: DiagnosticCollector;
  private nodeCount: number = 0;
  private readonly options: Omit<Required<ParseOptions>, 'incrementalRange'> & { incrementalRange?: { start: number; end: number } };
  private seenIds: Set<string> = new Set();

  constructor(input: string, options: ParseOptions = {}) {
    this.tokenizer = new Tokenizer(input);
    this.diagnostics = new DiagnosticCollector(10); // Max 10 diagnostics per spec
    this.options = {
      maxNodes: options.maxNodes ?? 1000,
      warnThreshold: options.warnThreshold ?? 300,
      incrementalRange: options.incrementalRange,
    };
  }

  /**
   * Parse entry point - returns complete ParseResult
   */
  parse(): ParseResult {
    const startTime = performance.now();

    // Parse document
    const document = this.parseDocument();

    // Add lexer errors to diagnostics
    const lexerErrors = this.tokenizer.getErrors();
    for (const error of lexerErrors) {
      this.diagnostics.add(
        error.code,
        error.message,
        error.line,
        error.column,
        error.severity,
        error.hint,
      );
    }

    // Calculate metrics
    const endTime = performance.now();
    const parseTimeMs = endTime - startTime;
    const counts = this.diagnostics.getCounts();

    const metrics: ParseMetrics = {
      parseTimeMs,
      nodeCount: this.nodeCount,
      diagnosticCount: this.diagnostics.getAll().length,
      errorCount: counts.error,
      warningCount: counts.warning,
    };

    // Log if diagnostic count exceeds threshold (per ticket requirement: >5)
    if (metrics.diagnosticCount > 5 && process.env.NODE_ENV !== 'test') {
      console.warn(`[Parser] High diagnostic count: ${metrics.diagnosticCount}`);
    }

    // Log timing metrics for T-018 instrumentation
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Parser] Parse time: ${metrics.parseTimeMs.toFixed(2)}ms, nodes: ${metrics.nodeCount}`);
    }

    return {
      document,
      diagnostics: this.diagnostics.getAll(),
      metrics,
    };
  }

  /**
   * Parse complete document
   */
  private parseDocument(): Document {
    const document = createDocument();

    // Parse root-level nodes
    while (!this.isAtEnd()) {
      const token = this.peek();

      // Skip newlines at document level
      if (token.type === TokenType.NEWLINE) {
        this.advance();
        continue;
      }

      // Style blocks (stubbed for now per plan)
      if (token.type === TokenType.STYLE) {
        this.parseStyleBlock();
        continue;
      }

      // Let statements (stubbed for now per plan)
      if (token.type === TokenType.LET) {
        this.parseLetStatement();
        continue;
      }

      // When blocks (stubbed for now per plan)
      if (token.type === TokenType.WHEN) {
        this.parseWhenBlock();
        continue;
      }

      // Parse component node
      if (this.isComponentToken(token.type)) {
        const node = this.parseNode();
        if (node) {
          document.nodes.push(node);
          this.nodeCount++;

          // Check node count thresholds
          this.checkNodeCountLimits();
        }
        continue;
      }

      // Unexpected token at document level
      this.addError(
        ErrorCode.UNEXPECTED_TOKEN,
        `Unexpected token '${token.raw}' at document level`,
        token.line,
        token.column,
        `Expected component, style, let, or when keyword`,
      );
      this.synchronize();
    }

    return document;
  }

  /**
   * Parse a single node (component with attributes and children)
   */
  private parseNode(): Node | null {
    const token = this.peek();

    // Must start with component keyword
    if (!this.isComponentToken(token.type)) {
      this.addError(
        ErrorCode.UNEXPECTED_TOKEN,
        `Expected component keyword, got '${token.raw}'`,
        token.line,
        token.column,
      );
      this.synchronize();
      return null;
    }

    const componentType = token.value as string;
    this.advance(); // Consume component keyword

    // Create node
    const node = createNode(componentType);

    // Parse optional label "Label"
    if (this.check(TokenType.STRING)) {
      node.label = this.advance().value as string;
    } else if (REQUIRES_LABEL.has(componentType)) {
      // Components that require labels
      this.addError(
        ErrorCode.MISSING_LABEL,
        `Component '${componentType}' requires a label`,
        token.line,
        token.column,
        `Add a string label after '${componentType}'`,
      );
    }

    // Parse ID and classes (#id .class .class2)
    this.parseIdAndClasses(node);

    // Parse placement tokens (@c5 s4 r2 rs3)
    this.parsePlacement(node);

    // Parse properties (key:value prop prop2)
    this.parseProperties(node);

    // Expect newline after node declaration
    if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      this.addError(
        ErrorCode.UNEXPECTED_TOKEN,
        `Expected newline after node declaration`,
        this.peek().line,
        this.peek().column,
      );
    } else {
      this.advance(); // Consume newline
    }

    // Parse children if this is a container
    if (CONTAINER_TYPES.has(componentType)) {
      this.parseChildren(node);
    }

    return node;
  }

  /**
   * Parse ID and classes (#id .class1 .class2)
   */
  private parseIdAndClasses(node: Node): void {
    // Parse #id
    if (this.check(TokenType.HASH)) {
      this.advance(); // Consume #

      if (!this.check(TokenType.IDENTIFIER)) {
        this.addError(
          ErrorCode.UNEXPECTED_TOKEN,
          'Expected identifier after #',
          this.peek().line,
          this.peek().column,
        );
      } else {
        const idToken = this.advance();
        const id = idToken.value as string;

        // Check for duplicate IDs
        if (this.seenIds.has(id)) {
          this.addError(
            ErrorCode.DUPLICATE_ID,
            `Duplicate ID '${id}'`,
            idToken.line,
            idToken.column,
            'IDs must be unique across the document',
          );
        } else {
          this.seenIds.add(id);
          node.id = id;
        }
      }
    }

    // Parse .class1 .class2 ...
    while (this.check(TokenType.DOT)) {
      this.advance(); // Consume .

      if (!this.check(TokenType.IDENTIFIER)) {
        this.addError(
          ErrorCode.UNEXPECTED_TOKEN,
          'Expected identifier after .',
          this.peek().line,
          this.peek().column,
        );
        break;
      }

      const className = this.advance().value as string;
      if (!node.classes) {
        node.classes = [];
      }
      node.classes.push(className);
    }
  }

  /**
   * Parse placement tokens (@c5 s4 r2 rs3)
   */
  private parsePlacement(node: Node): void {
    const place: PlacementTokens = {};
    let hasPlacement = false;

    // @c5 - column start
    if (this.check(TokenType.AT_COLUMN)) {
      place.c = this.advance().value as number;
      hasPlacement = true;
    }

    // s4 - span
    if (this.check(TokenType.SPAN)) {
      place.s = this.advance().value as number;
      hasPlacement = true;
    }

    // r2 - row start
    if (this.check(TokenType.ROW)) {
      place.r = this.advance().value as number;
      hasPlacement = true;
    }

    // rs3 - row span
    if (this.check(TokenType.ROW_SPAN)) {
      place.rs = this.advance().value as number;
      hasPlacement = true;
    }

    if (hasPlacement) {
      node.place = place;
    }
  }

  /**
   * Parse properties (key:value boolean-prop)
   */
  private parseProperties(node: Node): void {
    const props: Record<string, unknown> = {};

    while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      const token = this.peek();

      // Boolean properties (grow, shrink)
      if (token.type === TokenType.PROP_GROW) {
        props.grow = true;
        this.advance();
        continue;
      }
      if (token.type === TokenType.PROP_SHRINK) {
        props.shrink = true;
        this.advance();
        continue;
      }

      // Key:value properties
      if (this.isPropertyToken(token.type)) {
        const propKey = token.value as string;
        this.advance(); // Consume property keyword

        // Expect colon
        if (!this.check(TokenType.COLON)) {
          this.addError(
            ErrorCode.UNEXPECTED_TOKEN,
            `Expected ':' after property '${propKey}'`,
            this.peek().line,
            this.peek().column,
          );
          break;
        }
        this.advance(); // Consume colon

        // Parse value
        const valueToken = this.peek();
        if (this.check(TokenType.NUMBER)) {
          props[propKey] = this.advance().value as number;
        } else if (this.check(TokenType.STRING)) {
          props[propKey] = this.advance().value as string;
        } else if (this.check(TokenType.IDENTIFIER)) {
          props[propKey] = this.advance().value as string;
        } else if (this.check(TokenType.HEX_COLOR)) {
          props[propKey] = this.advance().value as string;
        } else if (this.check(TokenType.COLOR_REF)) {
          props[propKey] = this.advance().value as string;
        } else {
          this.addError(
            ErrorCode.INVALID_PROPERTY_VALUE,
            `Invalid property value for '${propKey}'`,
            valueToken.line,
            valueToken.column,
          );
          this.advance(); // Skip invalid token
        }
        continue;
      }

      // Not a property - stop parsing properties
      break;
    }

    if (Object.keys(props).length > 0) {
      node.props = props;
    }
  }

  /**
   * Parse children with INDENT/DEDENT nesting
   */
  private parseChildren(node: Node): void {
    // Expect INDENT after container declaration
    if (!this.check(TokenType.INDENT)) {
      // No children (empty container is valid)
      return;
    }

    this.advance(); // Consume INDENT

    node.children = [];

    // Parse child nodes until DEDENT
    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
      // Skip newlines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // Parse child node
      if (this.isComponentToken(this.peek().type)) {
        const child = this.parseNode();
        if (child) {
          node.children.push(child);
          this.nodeCount++;

          // Check node count limits
          this.checkNodeCountLimits();
        }
        continue;
      }

      // Unexpected token in children
      this.addError(
        ErrorCode.UNEXPECTED_TOKEN,
        `Unexpected token '${this.peek().raw}' in children block`,
        this.peek().line,
        this.peek().column,
      );
      this.synchronize();
    }

    // Consume DEDENT
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
  }

  /**
   * Stub: Parse style block (TODO: implement in T-006/T-007)
   */
  private parseStyleBlock(): void {
    this.advance(); // Consume 'style'

    // Skip tokens until closing brace or newline
    while (!this.check(TokenType.RBRACE) && !this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      this.advance();
    }

    if (this.check(TokenType.RBRACE)) {
      this.advance();
    }

    // TODO: Implement full style block parsing in T-006/T-007
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Parser] TODO: Style block parsing not yet implemented');
    }
  }

  /**
   * Stub: Parse let statement (TODO: implement in T-006/T-007)
   */
  private parseLetStatement(): void {
    this.advance(); // Consume 'let'

    // Skip tokens until newline
    while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      this.advance();
    }

    // TODO: Implement full let statement parsing in T-006/T-007
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Parser] TODO: Let statement parsing not yet implemented');
    }
  }

  /**
   * Stub: Parse when block (TODO: implement in T-006/T-007)
   */
  private parseWhenBlock(): void {
    this.advance(); // Consume 'when'

    // Skip tokens until closing brace or newline
    while (!this.check(TokenType.RBRACE) && !this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      this.advance();
    }

    if (this.check(TokenType.RBRACE)) {
      this.advance();
    }

    // TODO: Implement full when block parsing in T-006/T-007
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Parser] TODO: When block parsing not yet implemented');
    }
  }

  /**
   * Check node count against limits and emit warnings/errors
   */
  private checkNodeCountLimits(): void {
    // Warning at threshold (default 300)
    if (this.nodeCount === this.options.warnThreshold) {
      this.diagnostics.add(
        ErrorCode.NODE_COUNT_WARNING,
        `Node count (${this.nodeCount}) exceeds recommended threshold of ${this.options.warnThreshold}`,
        0,
        0,
        ErrorSeverity.WARNING,
        'Consider simplifying your layout to improve performance',
      );
    }

    // Hard limit (default 1000)
    if (this.nodeCount >= this.options.maxNodes) {
      this.diagnostics.add(
        ErrorCode.NODE_COUNT_LIMIT,
        `Node count (${this.nodeCount}) exceeds hard limit of ${this.options.maxNodes}`,
        0,
        0,
        ErrorSeverity.ERROR,
        'Reduce the number of components in your layout',
      );
    }
  }

  /**
   * Error recovery: skip tokens until next synchronization point (NEWLINE)
   */
  private synchronize(): void {
    while (!this.isAtEnd()) {
      const token = this.peek();

      // Stop at newline (line-based recovery)
      if (token.type === TokenType.NEWLINE) {
        this.advance();
        return;
      }

      // Also stop at EOF
      if (token.type === TokenType.EOF) {
        return;
      }

      this.advance();
    }
  }

  /**
   * Add error to diagnostics
   */
  private addError(
    code: ErrorCode,
    message: string,
    line: number,
    column: number,
    hint?: string,
  ): void {
    this.diagnostics.add(code, message, line, column, ErrorSeverity.ERROR, hint);
  }

  // ===== Token helpers =====

  private peek(offset: number = 0): Token {
    return this.tokenizer.peek(offset);
  }

  private advance(): Token {
    return this.tokenizer.advance();
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private isComponentToken(type: TokenType): boolean {
    return (
      type === TokenType.GRID ||
      type === TokenType.HSTACK ||
      type === TokenType.VSTACK ||
      type === TokenType.ZSTACK ||
      type === TokenType.SECTION ||
      type === TokenType.CARD ||
      type === TokenType.TEXT ||
      type === TokenType.INPUT ||
      type === TokenType.BUTTON ||
      type === TokenType.IMAGE ||
      type === TokenType.ICON ||
      type === TokenType.SPACER ||
      type === TokenType.LIST ||
      type === TokenType.TABS
    );
  }

  private isPropertyToken(type: TokenType): boolean {
    return (
      type === TokenType.PROP_COLS ||
      type === TokenType.PROP_GAP ||
      type === TokenType.PROP_PAD ||
      type === TokenType.PROP_W ||
      type === TokenType.PROP_H ||
      type === TokenType.PROP_RADIUS ||
      type === TokenType.PROP_TONE ||
      type === TokenType.PROP_TYPE ||
      type === TokenType.PROP_AT
    );
  }
}

/**
 * Convenience function to parse DSL input
 */
export function parseDocument(input: string, options?: ParseOptions): ParseResult {
  const parser = new Parser(input, options);
  return parser.parse();
}
