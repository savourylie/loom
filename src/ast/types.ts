/**
 * AST (Abstract Syntax Tree) type definitions for Loom DSL
 * Based on DSL_SPEC_V1.md Section 9: AST Data Model
 */

/**
 * Grid placement tokens for positioning children in a grid container
 */
export interface PlacementTokens {
  /** Column start position (@c) */
  c?: number;

  /** Column span (s) */
  s?: number;

  /** Row start position (r) */
  r?: number;

  /** Row span (rs) */
  rs?: number;
}

/**
 * Core Node structure representing any component in the DSL
 */
export interface Node {
  /** Component type: 'grid', 'card', 'button', etc. */
  type: string;

  /** Optional ID from #id token */
  id?: string;

  /** Optional class names from .class tokens */
  classes?: string[];

  /** Optional label text from "Label" string */
  label?: string;

  /** Grid placement (only for children of grid containers) */
  place?: PlacementTokens;

  /** Component properties: gap, pad, tone, type, at, etc. */
  props?: Record<string, unknown>;

  /** Child nodes (for container components) */
  children?: Node[];
}

/**
 * Selector types for style rules
 */
export type Selector =
  | { type: 'default' }
  | { type: 'type'; name: string }
  | { type: 'class'; name: string }
  | { type: 'id'; name: string };

/**
 * Style rule with selector and declarations
 */
export interface StyleRule {
  /** Selector that determines which elements this rule applies to */
  selector: Selector;

  /** Style declarations: skin, fill, stroke, text, radius, etc. */
  declarations: Record<string, unknown>;
}

/**
 * Breakpoint condition for responsive layouts
 */
export interface Breakpoint {
  /** Condition string: '<600', '>=1024', etc. */
  condition: string;

  /** Alternative node tree for this breakpoint */
  nodes?: Node[];

  /** Style overrides for this breakpoint */
  styles?: StyleRule[];
}

/**
 * Complete DSL document structure
 */
export interface Document {
  /** DSL specification version */
  version: string;

  /** Root-level nodes (top-level components) */
  nodes: Node[];

  /** Global and scoped style rules */
  styles: StyleRule[];

  /** Let variables (key-value pairs) */
  variables: Record<string, unknown>;

  /** Responsive breakpoints (when blocks) */
  breakpoints?: Breakpoint[];
}

/**
 * Helper to create a default empty document
 */
export function createDocument(): Document {
  return {
    version: '1.0',
    nodes: [],
    styles: [],
    variables: {},
    breakpoints: [],
  };
}

/**
 * Helper to create a node with required fields
 */
export function createNode(type: string, label?: string): Node {
  const node: Node = { type };
  if (label !== undefined) {
    node.label = label;
  }
  return node;
}

/**
 * Helper to create a style rule
 */
export function createStyleRule(
  selector: Selector,
  declarations: Record<string, unknown>,
): StyleRule {
  return { selector, declarations };
}

/**
 * Type guard to check if a node is a container (can have children)
 */
export function isContainerNode(node: Node): boolean {
  const containerTypes = [
    'grid',
    'hstack',
    'vstack',
    'zstack',
    'section',
    'card',
    'list',
    'tabs',
  ];
  return containerTypes.includes(node.type);
}

/**
 * Type guard to check if a node has placement tokens
 */
export function hasPlacement(node: Node): node is Node & { place: PlacementTokens } {
  return node.place !== undefined;
}
