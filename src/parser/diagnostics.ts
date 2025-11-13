/**
 * Diagnostic collection and formatting for parser errors and warnings
 */

import { ErrorCode, ErrorSeverity } from '../errors/index.js';
import { ParserError } from './errors.js';

/**
 * Structured diagnostic suitable for editor integration
 */
export interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  hint?: string;
  range?: { start: number; end: number };
}

/**
 * Collects and manages diagnostics during parsing
 */
export class DiagnosticCollector {
  private diagnostics: Diagnostic[] = [];
  private readonly maxDiagnostics: number;

  constructor(maxDiagnostics: number = 10) {
    this.maxDiagnostics = maxDiagnostics;
  }

  /**
   * Add a diagnostic
   */
  add(
    code: ErrorCode,
    message: string,
    line: number,
    column: number,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    hint?: string,
    range?: { start: number; end: number },
  ): void {
    // Stop collecting after reaching max to avoid flooding
    if (this.diagnostics.length >= this.maxDiagnostics) {
      return;
    }

    this.diagnostics.push({
      code,
      severity,
      message,
      line,
      column,
      hint,
      range,
    });
  }

  /**
   * Add from ParserError
   */
  addFromError(error: ParserError): void {
    this.add(
      error.code,
      error.message,
      error.line,
      error.column,
      error.severity,
      error.hint,
      error.range,
    );
  }

  /**
   * Get all diagnostics
   */
  getAll(): Diagnostic[] {
    return this.diagnostics;
  }

  /**
   * Get count by severity
   */
  getCounts(): { error: number; warning: number; info: number } {
    return {
      error: this.diagnostics.filter((d) => d.severity === 'error').length,
      warning: this.diagnostics.filter((d) => d.severity === 'warning').length,
      info: this.diagnostics.filter((d) => d.severity === 'info').length,
    };
  }

  /**
   * Check if there are any errors (not warnings/info)
   */
  hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'error');
  }

  /**
   * Check if diagnostic limit reached
   */
  isAtLimit(): boolean {
    return this.diagnostics.length >= this.maxDiagnostics;
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnostics = [];
  }

  /**
   * Format all diagnostics for display
   */
  format(): string {
    if (this.diagnostics.length === 0) {
      return 'No diagnostics';
    }

    const lines = this.diagnostics.map((d) => {
      const location = `${d.line}:${d.column}`;
      const severityIcon = d.severity === 'error' ? '✗' : d.severity === 'warning' ? '⚠' : 'ℹ';
      const hint = d.hint ? `\n    Hint: ${d.hint}` : '';
      return `  ${severityIcon} [${d.code}] ${d.message} at ${location}${hint}`;
    });

    const counts = this.getCounts();
    const summary = `${counts.error} errors, ${counts.warning} warnings, ${counts.info} info`;

    return `Diagnostics (${summary}):\n${lines.join('\n')}`;
  }
}
