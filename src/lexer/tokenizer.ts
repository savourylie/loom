/**
 * Loom DSL Tokenizer (Lexer)
 * Converts raw DSL text into a stream of tokens for parsing
 */

import {
  Token,
  TokenType,
  COMPONENT_KEYWORDS,
  STYLE_KEYWORDS,
  PROPERTY_KEYWORDS,
  BOOLEAN_PROPERTY_KEYWORDS,
  STYLE_PROPERTY_KEYWORDS,
} from './tokens.js';
import { ErrorCode, LexerError } from '../errors/index.js';

/**
 * Tokenizer class with streaming API (peek + advance) for parser lookahead
 */
export class Tokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 0;
  private tokenCache: Token[] = [];
  private errors: LexerError[] = [];
  private indentationStack: number[] = [0]; // Track indentation levels
  private pendingTokens: Token[] = []; // Queue for INDENT/DEDENT tokens
  private atLineStart: boolean = true; // Track if we're at the start of a line

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Get all errors encountered during tokenization
   */
  getErrors(): LexerError[] {
    return this.errors;
  }

  /**
   * Peek at the next token without consuming it (lookahead)
   * @param offset - Number of tokens to look ahead (0 = next token)
   */
  peek(offset: number = 0): Token {
    // Fill cache if needed
    while (this.tokenCache.length <= offset) {
      const token = this.nextToken();
      this.tokenCache.push(token);
      if (token.type === TokenType.EOF) {
        break;
      }
    }
    return this.tokenCache[offset] ?? this.tokenCache[this.tokenCache.length - 1]!;
  }

  /**
   * Consume and return the next token
   */
  advance(): Token {
    if (this.tokenCache.length > 0) {
      return this.tokenCache.shift()!;
    }
    return this.nextToken();
  }

  /**
   * Get all tokens as an array (for testing/debugging)
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.advance();
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.advance();
    }
    tokens.push(token); // Include EOF
    return tokens;
  }

  /**
   * Main tokenization logic - get next token from input
   */
  private nextToken(): Token {
    // Return pending tokens first (INDENT/DEDENT)
    if (this.pendingTokens.length > 0) {
      return this.pendingTokens.shift()!;
    }

    // Handle indentation at line start
    if (this.atLineStart) {
      this.atLineStart = false;
      const indentToken = this.handleIndentation();
      if (indentToken) {
        return indentToken;
      }
    }

    this.skipWhitespaceExceptNewlines();

    // Check for EOF
    if (this.isAtEnd()) {
      // Emit DEDENTs to unwind indentation stack
      while (this.indentationStack.length > 1) {
        this.indentationStack.pop();
        this.pendingTokens.push(this.createToken(TokenType.DEDENT, '', ''));
      }
      if (this.pendingTokens.length > 0) {
        return this.pendingTokens.shift()!;
      }
      return this.createToken(TokenType.EOF, '', '');
    }

    const char = this.currentChar();
    const startLine = this.line;
    const startColumn = this.column;

    // Comments: // to end of line
    if (char === '/' && this.peekChar() === '/') {
      this.skipComment();
      return this.nextToken(); // Skip comment and get next token
    }

    // Newlines (significant for structure)
    if (char === '\n') {
      this.advanceChar();
      this.line++;
      this.column = 0;
      this.atLineStart = true; // Next token will handle indentation
      return this.createToken(TokenType.NEWLINE, '\n', '\n', startLine, startColumn);
    }

    // Strings: "text"
    if (char === '"') {
      return this.readString(startLine, startColumn);
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber(startLine, startColumn);
    }

    // Hex colors: #6D28D9 (must be valid 3 or 6 digit hex)
    if (char === '#' && this.looksLikeHexColor()) {
      return this.readHexColor(startLine, startColumn);
    }

    // Variable references: $variableName
    if (char === '$') {
      return this.readVariableRef(startLine, startColumn);
    }

    // Placement tokens: @c5, s4, r2, rs3
    const placementToken = this.tryReadPlacementToken(startLine, startColumn);
    if (placementToken !== null) {
      return placementToken;
    }

    // Identifiers and keywords
    if (this.isIdentifierStart(char)) {
      return this.readIdentifierOrKeyword(startLine, startColumn);
    }

    // Punctuation and operators
    return this.readPunctuationOrOperator(startLine, startColumn);
  }

  /**
   * Skip whitespace (spaces, tabs) but NOT newlines (they're significant)
   */
  private skipWhitespaceExceptNewlines(): void {
    while (!this.isAtEnd()) {
      const char = this.currentChar();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advanceChar();
      } else {
        break;
      }
    }
  }

  /**
   * Skip comments: // to end of line
   */
  private skipComment(): void {
    // Skip //
    this.advanceChar();
    this.advanceChar();

    // Skip until newline or EOF
    while (!this.isAtEnd() && this.currentChar() !== '\n') {
      this.advanceChar();
    }
  }

  /**
   * Read a string literal: "text with \"escapes\""
   */
  private readString(startLine: number, startColumn: number): Token {
    const start = this.position;
    this.advanceChar(); // Skip opening "

    let value = '';
    while (!this.isAtEnd() && this.currentChar() !== '"') {
      if (this.currentChar() === '\\') {
        this.advanceChar();
        if (this.isAtEnd()) {
          const error = new LexerError(
            ErrorCode.UNTERMINATED_STRING,
            'Unterminated string literal (EOF after escape)',
            startLine,
            startColumn,
          );
          this.errors.push(error);
          return this.createToken(TokenType.ERROR, value, this.input.slice(start), startLine, startColumn);
        }
        // Handle escape sequences
        const escapeChar = this.currentChar();
        switch (escapeChar) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case '"':
            value += '"';
            break;
          case '\\':
            value += '\\';
            break;
          default:
            value += escapeChar; // Unknown escape, keep as-is
        }
        this.advanceChar();
      } else {
        if (this.currentChar() === '\n') {
          this.line++;
          this.column = 0;
        }
        value += this.currentChar();
        this.advanceChar();
      }
    }

    if (this.isAtEnd()) {
      const error = new LexerError(
        ErrorCode.UNTERMINATED_STRING,
        'Unterminated string literal (missing closing quote)',
        startLine,
        startColumn,
        undefined,
        'Add a closing " to end the string',
      );
      this.errors.push(error);
      return this.createToken(TokenType.ERROR, value, this.input.slice(start), startLine, startColumn);
    }

    this.advanceChar(); // Skip closing "
    const raw = this.input.slice(start, this.position);
    return this.createToken(TokenType.STRING, value, raw, startLine, startColumn);
  }

  /**
   * Read a number: 123
   */
  private readNumber(startLine: number, startColumn: number): Token {
    const start = this.position;
    while (!this.isAtEnd() && this.isDigit(this.currentChar())) {
      this.advanceChar();
    }
    const raw = this.input.slice(start, this.position);
    const value = parseInt(raw, 10);
    return this.createToken(TokenType.NUMBER, value, raw, startLine, startColumn);
  }

  /**
   * Read a hex color: #6D28D9
   */
  private readHexColor(startLine: number, startColumn: number): Token {
    const start = this.position;
    this.advanceChar(); // Skip #

    while (!this.isAtEnd() && this.isHexDigit(this.currentChar())) {
      this.advanceChar();
    }

    const raw = this.input.slice(start, this.position);
    const hexValue = raw.slice(1); // Remove #

    // Validate hex color length (3 or 6 digits)
    if (hexValue.length !== 3 && hexValue.length !== 6) {
      const error = new LexerError(
        ErrorCode.INVALID_COLOR,
        `Invalid hex color: ${raw} (must be 3 or 6 digits)`,
        startLine,
        startColumn,
        undefined,
        'Use format #RGB or #RRGGBB',
      );
      this.errors.push(error);
      return this.createToken(TokenType.ERROR, raw, raw, startLine, startColumn);
    }

    return this.createToken(TokenType.HEX_COLOR, raw, raw, startLine, startColumn);
  }

  /**
   * Read a variable reference: $variableName
   */
  private readVariableRef(startLine: number, startColumn: number): Token {
    const start = this.position;
    this.advanceChar(); // Skip $

    if (this.isAtEnd() || !this.isIdentifierStart(this.currentChar())) {
      const error = new LexerError(
        ErrorCode.INVALID_TOKEN,
        'Invalid variable reference ($ must be followed by identifier)',
        startLine,
        startColumn,
      );
      this.errors.push(error);
      return this.createToken(TokenType.ERROR, '$', '$', startLine, startColumn);
    }

    while (!this.isAtEnd() && this.isIdentifierPart(this.currentChar())) {
      this.advanceChar();
    }

    const raw = this.input.slice(start, this.position);
    const value = raw.slice(1); // Remove $
    return this.createToken(TokenType.VARIABLE_REF, value, raw, startLine, startColumn);
  }

  /**
   * Try to read placement tokens: @c5, s4, r2, rs3
   */
  private tryReadPlacementToken(startLine: number, startColumn: number): Token | null {
    const start = this.position;

    // @c5 - column start
    if (this.currentChar() === '@' && this.peekChar() === 'c') {
      this.advanceChar(); // Skip @
      this.advanceChar(); // Skip c
      if (!this.isAtEnd() && this.isDigit(this.currentChar())) {
        const numStart = this.position;
        while (!this.isAtEnd() && this.isDigit(this.currentChar())) {
          this.advanceChar();
        }
        const numStr = this.input.slice(numStart, this.position);
        const value = parseInt(numStr, 10);
        const raw = this.input.slice(start, this.position);
        return this.createToken(TokenType.AT_COLUMN, value, raw, startLine, startColumn);
      }
    }

    // rs3 - row span (must check before r2 due to prefix)
    if (
      this.currentChar() === 'r' &&
      this.peekChar() === 's' &&
      this.isDigit(this.peekChar(2))
    ) {
      this.advanceChar(); // Skip r
      this.advanceChar(); // Skip s
      const numStart = this.position;
      while (!this.isAtEnd() && this.isDigit(this.currentChar())) {
        this.advanceChar();
      }
      const numStr = this.input.slice(numStart, this.position);
      const value = parseInt(numStr, 10);
      const raw = this.input.slice(start, this.position);
      return this.createToken(TokenType.ROW_SPAN, value, raw, startLine, startColumn);
    }

    // r2 - row start
    if (this.currentChar() === 'r' && this.isDigit(this.peekChar())) {
      this.advanceChar(); // Skip r
      const numStart = this.position;
      while (!this.isAtEnd() && this.isDigit(this.currentChar())) {
        this.advanceChar();
      }
      const numStr = this.input.slice(numStart, this.position);
      const value = parseInt(numStr, 10);
      const raw = this.input.slice(start, this.position);
      return this.createToken(TokenType.ROW, value, raw, startLine, startColumn);
    }

    // s4 - span
    if (this.currentChar() === 's' && this.isDigit(this.peekChar())) {
      this.advanceChar(); // Skip s
      const numStart = this.position;
      while (!this.isAtEnd() && this.isDigit(this.currentChar())) {
        this.advanceChar();
      }
      const numStr = this.input.slice(numStart, this.position);
      const value = parseInt(numStr, 10);
      const raw = this.input.slice(start, this.position);
      return this.createToken(TokenType.SPAN, value, raw, startLine, startColumn);
    }

    return null;
  }

  /**
   * Read identifier or keyword
   */
  private readIdentifierOrKeyword(startLine: number, startColumn: number): Token {
    const start = this.position;

    while (!this.isAtEnd() && this.isIdentifierPart(this.currentChar())) {
      this.advanceChar();
    }

    const raw = this.input.slice(start, this.position);
    const value = raw;

    // Check for keywords
    const componentType = COMPONENT_KEYWORDS[value];
    if (componentType !== undefined) {
      return this.createToken(componentType, value, raw, startLine, startColumn);
    }

    const styleKeyword = STYLE_KEYWORDS[value];
    if (styleKeyword !== undefined) {
      return this.createToken(styleKeyword, value, raw, startLine, startColumn);
    }

    const booleanProp = BOOLEAN_PROPERTY_KEYWORDS[value];
    if (booleanProp !== undefined) {
      return this.createToken(booleanProp, true, raw, startLine, startColumn);
    }

    // Check if followed by colon (property)
    this.skipWhitespaceExceptNewlines();
    if (!this.isAtEnd() && this.currentChar() === ':') {
      // Check property keywords
      const propType = PROPERTY_KEYWORDS[value] ?? STYLE_PROPERTY_KEYWORDS[value];
      if (propType !== undefined) {
        return this.createToken(propType, value, raw, startLine, startColumn);
      }
    }

    // Check for color references: color.brand
    if (value === 'color' && !this.isAtEnd() && this.currentChar() === '.') {
      this.advanceChar(); // Skip .
      const colorStart = this.position;
      while (!this.isAtEnd() && this.isIdentifierPart(this.currentChar())) {
        this.advanceChar();
      }
      const colorName = this.input.slice(colorStart, this.position);
      const fullRaw = this.input.slice(start, this.position);
      return this.createToken(TokenType.COLOR_REF, `color.${colorName}`, fullRaw, startLine, startColumn);
    }

    // Regular identifier
    return this.createToken(TokenType.IDENTIFIER, value, raw, startLine, startColumn);
  }

  /**
   * Read punctuation or operators
   */
  private readPunctuationOrOperator(startLine: number, startColumn: number): Token {
    const char = this.currentChar();
    this.advanceChar();

    switch (char) {
      case '{':
        return this.createToken(TokenType.LBRACE, '{', '{', startLine, startColumn);
      case '}':
        return this.createToken(TokenType.RBRACE, '}', '}', startLine, startColumn);
      case '(':
        return this.createToken(TokenType.LPAREN, '(', '(', startLine, startColumn);
      case ')':
        return this.createToken(TokenType.RPAREN, ')', ')', startLine, startColumn);
      case ':':
        return this.createToken(TokenType.COLON, ':', ':', startLine, startColumn);
      case ';':
        return this.createToken(TokenType.SEMICOLON, ';', ';', startLine, startColumn);
      case ',':
        return this.createToken(TokenType.COMMA, ',', ',', startLine, startColumn);
      case '.':
        return this.createToken(TokenType.DOT, '.', '.', startLine, startColumn);
      case '#':
        return this.createToken(TokenType.HASH, '#', '#', startLine, startColumn);
      case '@':
        return this.createToken(TokenType.AT, '@', '@', startLine, startColumn);
      case '/':
        return this.createToken(TokenType.SLASH, '/', '/', startLine, startColumn);
      case '=':
        return this.createToken(TokenType.EQUALS, '=', '=', startLine, startColumn);
      case '<':
        if (!this.isAtEnd() && this.currentChar() === '=') {
          this.advanceChar();
          return this.createToken(TokenType.LTE, '<=', '<=', startLine, startColumn);
        }
        return this.createToken(TokenType.LT, '<', '<', startLine, startColumn);
      case '>':
        if (!this.isAtEnd() && this.currentChar() === '=') {
          this.advanceChar();
          return this.createToken(TokenType.GTE, '>=', '>=', startLine, startColumn);
        }
        return this.createToken(TokenType.GT, '>', '>', startLine, startColumn);
      default: {
        const error = new LexerError(
          ErrorCode.INVALID_TOKEN,
          `Unexpected character: '${char}'`,
          startLine,
          startColumn,
          undefined,
          'Check for typos or unsupported syntax',
        );
        this.errors.push(error);
        return this.createToken(TokenType.ERROR, char, char, startLine, startColumn);
      }
    }
  }

  /**
   * Create a token with position metadata
   */
  private createToken(
    type: TokenType,
    value: string | number | boolean,
    raw: string,
    line?: number,
    column?: number,
  ): Token {
    return {
      type,
      value,
      raw,
      line: line ?? this.line,
      column: column ?? this.column,
    };
  }

  /**
   * Handle indentation at the start of a line
   * Emits INDENT or DEDENT tokens based on indentation changes
   */
  private handleIndentation(): Token | null {
    const startLine = this.line;
    const startColumn = this.column;

    // Measure indentation (spaces/tabs at line start)
    let indentWidth = 0;

    while (!this.isAtEnd() && (this.currentChar() === ' ' || this.currentChar() === '\t')) {
      if (this.currentChar() === '\t') {
        indentWidth += 4; // Tab = 4 spaces
      } else {
        indentWidth += 1;
      }
      this.advanceChar();
    }

    // Skip blank lines and comments (don't change indentation)
    if (this.isAtEnd() || this.currentChar() === '\n' ||
        (this.currentChar() === '/' && this.peekChar() === '/')) {
      return null;
    }

    const currentIndent = this.indentationStack[this.indentationStack.length - 1]!;

    // Indentation increased
    if (indentWidth > currentIndent) {
      this.indentationStack.push(indentWidth);
      return this.createToken(TokenType.INDENT, '', '', startLine, startColumn);
    }

    // Indentation decreased (possibly multiple levels)
    if (indentWidth < currentIndent) {
      // Find matching indentation level
      let dedentCount = 0;
      while (
        this.indentationStack.length > 0 &&
        this.indentationStack[this.indentationStack.length - 1]! > indentWidth
      ) {
        this.indentationStack.pop();
        dedentCount++;
      }

      // Check if indentation matches a level on the stack
      if (this.indentationStack[this.indentationStack.length - 1] !== indentWidth) {
        const error = new LexerError(
          ErrorCode.INVALID_TOKEN,
          `Inconsistent indentation (expected ${this.indentationStack[this.indentationStack.length - 1]}, got ${indentWidth})`,
          startLine,
          startColumn,
          undefined,
          'Indentation must match a previous level',
        );
        this.errors.push(error);
      }

      // Queue DEDENT tokens (emit all but one, return first)
      for (let i = 1; i < dedentCount; i++) {
        this.pendingTokens.push(this.createToken(TokenType.DEDENT, '', '', startLine, startColumn));
      }

      if (dedentCount > 0) {
        return this.createToken(TokenType.DEDENT, '', '', startLine, startColumn);
      }
    }

    // Same indentation - no token needed
    return null;
  }

  // ===== Character helpers =====

  /**
   * Check if the current position looks like the start of a hex color
   * Valid: #RGB or #RRGGBB (3 or 6 hex digits)
   */
  private looksLikeHexColor(): boolean {
    // Skip the # we're currently on
    let offset = 1;
    let hexCount = 0;

    // Count consecutive hex digits
    while (
      this.position + offset < this.input.length &&
      this.isHexDigit(this.input[this.position + offset]!)
    ) {
      hexCount++;
      offset++;
    }

    // Valid hex color must be exactly 3 or 6 digits
    if (hexCount !== 3 && hexCount !== 6) {
      return false;
    }

    // After the hex digits, must be end of input or non-identifier character
    const nextChar = this.input[this.position + offset];
    return (
      nextChar === undefined ||
      !this.isIdentifierPart(nextChar) ||
      nextChar === ' ' ||
      nextChar === '\t' ||
      nextChar === '\n' ||
      nextChar === '\r'
    );
  }

  private currentChar(): string {
    return this.input[this.position] ?? '';
  }

  private peekChar(offset: number = 1): string {
    return this.input[this.position + offset] ?? '';
  }

  private advanceChar(): void {
    if (!this.isAtEnd()) {
      this.position++;
      this.column++;
    }
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return (
      (char >= '0' && char <= '9') ||
      (char >= 'a' && char <= 'f') ||
      (char >= 'A' && char <= 'F')
    );
  }

  private isIdentifierStart(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_'
    );
  }

  private isIdentifierPart(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char) || char === '-';
  }
}
