/**
 * Token types for Loom DSL lexer
 * Covers components, placement, properties, styles, and literals per DSL_SPEC_V1.md
 */
export enum TokenType {
  // ===== Component Types =====
  GRID = 'GRID',
  HSTACK = 'HSTACK',
  VSTACK = 'VSTACK',
  ZSTACK = 'ZSTACK',
  SECTION = 'SECTION',
  CARD = 'CARD',
  TEXT = 'TEXT',
  INPUT = 'INPUT',
  BUTTON = 'BUTTON',
  IMAGE = 'IMAGE',
  ICON = 'ICON',
  SPACER = 'SPACER',
  LIST = 'LIST',
  TABS = 'TABS',

  // ===== Placement Tokens (Grid positioning) =====
  AT_COLUMN = 'AT_COLUMN', // @c5
  SPAN = 'SPAN', // s4
  ROW = 'ROW', // r2
  ROW_SPAN = 'ROW_SPAN', // rs3

  // ===== Property Keywords =====
  PROP_COLS = 'PROP_COLS', // cols:
  PROP_GAP = 'PROP_GAP', // gap:
  PROP_PAD = 'PROP_PAD', // pad:
  PROP_W = 'PROP_W', // w:
  PROP_H = 'PROP_H', // h:
  PROP_GROW = 'PROP_GROW', // grow
  PROP_SHRINK = 'PROP_SHRINK', // shrink
  PROP_RADIUS = 'PROP_RADIUS', // radius:
  PROP_TONE = 'PROP_TONE', // tone:
  PROP_TYPE = 'PROP_TYPE', // type:
  PROP_AT = 'PROP_AT', // at: (alignment)

  // ===== Style Keywords =====
  STYLE = 'STYLE',
  LET = 'LET',
  WHEN = 'WHEN',

  // ===== Style Property Names =====
  STYLE_SKIN = 'STYLE_SKIN', // skin:
  STYLE_FONT = 'STYLE_FONT', // font:
  STYLE_U = 'STYLE_U', // u: (base unit)
  STYLE_FILL = 'STYLE_FILL', // fill:
  STYLE_STROKE = 'STYLE_STROKE', // stroke:
  STYLE_TEXT = 'STYLE_TEXT', // text:
  STYLE_SHADOW = 'STYLE_SHADOW', // shadow:

  // ===== Selector Types =====
  SELECTOR_DEFAULT = 'SELECTOR_DEFAULT', // default
  SELECTOR_TYPE = 'SELECTOR_TYPE', // type(...)
  SELECTOR_CLASS = 'SELECTOR_CLASS', // .classname
  SELECTOR_ID = 'SELECTOR_ID', // #id

  // ===== Color Tokens =====
  COLOR_REF = 'COLOR_REF', // color.brand, color.text, etc.

  // ===== Literals =====
  STRING = 'STRING', // "quoted text"
  NUMBER = 'NUMBER', // 123
  IDENTIFIER = 'IDENTIFIER', // variable names, values
  HEX_COLOR = 'HEX_COLOR', // #6D28D9
  VARIABLE_REF = 'VARIABLE_REF', // $variableName

  // ===== Punctuation & Operators =====
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  COLON = 'COLON', // :
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  HASH = 'HASH', // #
  AT = 'AT', // @
  SLASH = 'SLASH', // /
  LT = 'LT', // <
  LTE = 'LTE', // <=
  GT = 'GT', // >
  GTE = 'GTE', // >=
  EQUALS = 'EQUALS', // =

  // ===== Structural =====
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT', // Indentation level change
  DEDENT = 'DEDENT', // Dedentation

  // ===== Meta =====
  EOF = 'EOF',
  ERROR = 'ERROR',
}

/**
 * Token interface with position metadata for error reporting
 */
export interface Token {
  /** Token type */
  type: TokenType;

  /** Token value (parsed) */
  value: string | number | boolean;

  /** Original raw text from source */
  raw: string;

  /** Line number (1-indexed) */
  line: number;

  /** Column number (0-indexed) */
  column: number;
}

/**
 * Keywords that map to component types
 */
export const COMPONENT_KEYWORDS: Record<string, TokenType> = {
  grid: TokenType.GRID,
  hstack: TokenType.HSTACK,
  vstack: TokenType.VSTACK,
  zstack: TokenType.ZSTACK,
  section: TokenType.SECTION,
  card: TokenType.CARD,
  text: TokenType.TEXT,
  input: TokenType.INPUT,
  button: TokenType.BUTTON,
  image: TokenType.IMAGE,
  icon: TokenType.ICON,
  spacer: TokenType.SPACER,
  list: TokenType.LIST,
  tabs: TokenType.TABS,
};

/**
 * Keywords for style system
 */
export const STYLE_KEYWORDS: Record<string, TokenType> = {
  style: TokenType.STYLE,
  let: TokenType.LET,
  when: TokenType.WHEN,
  default: TokenType.SELECTOR_DEFAULT,
};

/**
 * Property keywords (used with colon)
 */
export const PROPERTY_KEYWORDS: Record<string, TokenType> = {
  cols: TokenType.PROP_COLS,
  gap: TokenType.PROP_GAP,
  pad: TokenType.PROP_PAD,
  w: TokenType.PROP_W,
  h: TokenType.PROP_H,
  radius: TokenType.PROP_RADIUS,
  tone: TokenType.PROP_TONE,
  type: TokenType.PROP_TYPE,
  at: TokenType.PROP_AT,
};

/**
 * Boolean property keywords (no colon)
 */
export const BOOLEAN_PROPERTY_KEYWORDS: Record<string, TokenType> = {
  grow: TokenType.PROP_GROW,
  shrink: TokenType.PROP_SHRINK,
};

/**
 * Style property keywords (used inside style blocks)
 */
export const STYLE_PROPERTY_KEYWORDS: Record<string, TokenType> = {
  skin: TokenType.STYLE_SKIN,
  font: TokenType.STYLE_FONT,
  u: TokenType.STYLE_U,
  fill: TokenType.STYLE_FILL,
  stroke: TokenType.STYLE_STROKE,
  text: TokenType.STYLE_TEXT,
  shadow: TokenType.STYLE_SHADOW,
  // Note: radius, tone can appear in both contexts
  radius: TokenType.PROP_RADIUS,
  tone: TokenType.PROP_TONE,
};

/**
 * Helper to check if a token is a component type
 */
export function isComponentToken(type: TokenType): boolean {
  return Object.values(COMPONENT_KEYWORDS).includes(type);
}

/**
 * Helper to check if a token is a placement token
 */
export function isPlacementToken(type: TokenType): boolean {
  return [
    TokenType.AT_COLUMN,
    TokenType.SPAN,
    TokenType.ROW,
    TokenType.ROW_SPAN,
  ].includes(type);
}

/**
 * Helper to check if a token is a property token
 */
export function isPropertyToken(type: TokenType): boolean {
  return (
    Object.values(PROPERTY_KEYWORDS).includes(type) ||
    Object.values(BOOLEAN_PROPERTY_KEYWORDS).includes(type)
  );
}

/**
 * Helper to check if a token is a style property token
 */
export function isStylePropertyToken(type: TokenType): boolean {
  return Object.values(STYLE_PROPERTY_KEYWORDS).includes(type);
}
