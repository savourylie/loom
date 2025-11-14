/**
 * Loom DSL - Core lexer and AST types
 * @module loom-dsl
 */

// Lexer exports
export { Tokenizer } from './lexer/index.js';
export type { Token } from './lexer/index.js';
export {
  TokenType,
  COMPONENT_KEYWORDS,
  STYLE_KEYWORDS,
  PROPERTY_KEYWORDS,
  BOOLEAN_PROPERTY_KEYWORDS,
  STYLE_PROPERTY_KEYWORDS,
  isComponentToken,
  isPlacementToken,
  isPropertyToken,
  isStylePropertyToken,
} from './lexer/index.js';

// AST exports
export type {
  PlacementTokens,
  Node,
  Selector,
  StyleRule,
  Breakpoint,
  Document,
} from './ast/index.js';

export {
  createDocument,
  createNode,
  createStyleRule,
  isContainerNode,
  hasPlacement,
} from './ast/index.js';

// Error exports
export { ErrorCode, ErrorSeverity, LexerError } from './errors/index.js';

// Parser exports
export { Parser, parseDocument } from './parser/index.js';
export type { ParseOptions, ParseResult, ParseMetrics, Diagnostic } from './parser/index.js';
export { ParserError, DiagnosticCollector } from './parser/index.js';
export {
  validateNode,
  validateNodeProperties,
  validatePlacement,
  validatePlacementContext,
  validatePropertyValues,
} from './parser/index.js';

// Style exports
export { evaluateStyles } from './style/index.js';
export type { StyleEvaluationResult, StyleEvaluationMetrics } from './style/index.js';

// Layout exports
export { layoutDocument, createLayoutSignature } from './layout/index.js';
export type {
  LayoutRunner,
  LayoutBox,
  LayoutResult,
  LayoutMetrics,
  LayoutOptions,
  LayoutMemoHooks,
} from './layout/index.js';

// Renderer exports
export { render } from './renderer/index.js';
export type { RenderMetrics, RenderResult } from './renderer/index.js';
export { resolveSkinTokens } from './renderer/skin.js';
export type { SkinName, SkinSettings, SkinTokens, SkinTokensOverride } from './renderer/skin.js';
