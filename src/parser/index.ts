/**
 * Parser module exports
 */

export { Parser, parseDocument } from './parser.js';
export type { ParseOptions, ParseResult, ParseMetrics } from './parser.js';
export { ParserError } from './errors.js';
export { DiagnosticCollector } from './diagnostics.js';
export type { Diagnostic } from './diagnostics.js';
export {
  validateNode,
  validateNodeProperties,
  validatePlacement,
  validatePlacementContext,
  validatePropertyValues,
} from './validators.js';
