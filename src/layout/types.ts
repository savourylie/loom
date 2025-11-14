import type { Document, Node } from '../ast/types.js';
import type { Diagnostic } from '../parser/diagnostics.js';

/**
 * Normalized layout box consumed by renderer
 */
export interface LayoutBox {
  /** Stable layout box id (prefers node id, falls back to auto) */
  id: string;
  /** Optional AST node id */
  nodeId?: string;
  /** Component type */
  type: string;
  /** Optional label */
  label?: string;
  /** Absolute x/y coordinates in pixels */
  x: number;
  y: number;
  /** Absolute size in pixels */
  width: number;
  height: number;
  /** Rendering order (increases down the tree) */
  zIndex: number;
  /** Semantic tone propagated from props/styles */
  tone?: string;
  /** Node props snapshot for renderer/memoization */
  props?: Record<string, unknown>;
  /** Children (if container) */
  children?: LayoutBox[];
  /** Signature derived from node id + props for memoization */
  signature: string;
}

/**
 * Layout execution metrics for observability
 */
export interface LayoutMetrics {
  /** Time spent computing layout */
  layoutTimeMs: number;
  /** Nodes processed */
  nodeCount: number;
  /** Warnings emitted */
  warningCount: number;
  /** Number of detected collisions */
  collisionCount: number;
  /** Cache hits when memo hooks are provided */
  memoHitCount: number;
}

/**
 * Result of running the layout engine
 */
export interface LayoutResult {
  boxes: LayoutBox[];
  diagnostics: Diagnostic[];
  metrics: LayoutMetrics;
}

/**
 * Hooks that enable host apps to plug layout memoization caches
 */
export interface LayoutMemoHooks {
  /** Called before layouting a node; return cached box to skip recompute */
  get?: (signature: string) => LayoutBox | undefined;
  /** Called after a node is laid out so hosts can cache */
  set?: (signature: string, box: LayoutBox) => void;
}

/**
 * Options that tweak layout behavior
 */
export interface LayoutOptions {
  /** Available width for root nodes (px) */
  viewportWidth?: number;
  /** Available height hint for root nodes (px) */
  viewportHeight?: number;
  /** Base spacing unit; defaults to 8px */
  unit?: number;
  /** Gap between root nodes in units */
  rootGapUnits?: number;
  /** Parse duration, used for logging parse+layout time */
  parseTimeMs?: number;
  /** Optional memoization hooks */
  memo?: LayoutMemoHooks;
  /** Soft limit for diagnostics count (default 10) */
  diagnosticsLimit?: number;
}

/**
 * Layout API entry point signature
 */
export type LayoutRunner = (document: Document, options?: LayoutOptions) => LayoutResult;

/**
 * Derive a cache key / signature for memoization from a node
 */
export function createLayoutSignature(node: Node): string {
  const idPart = node.id ?? '';
  const typePart = node.type;
  const propsPart = node.props ? JSON.stringify(node.props) : '';
  const placePart = node.place ? JSON.stringify(node.place) : '';
  const childPart = node.children ? node.children.length.toString() : '0';
  return `${typePart}:${idPart}:${propsPart}:${placePart}:${childPart}`;
}
