import type { Document, Node, Selector, StyleRule } from '../ast/types.js';

export interface StyleEvaluationMetrics {
  /** Total number of style rules parsed */
  totalRules: number;
  /** Rules that matched at least one node */
  matchedRules: number;
  /** Selector strings that never matched (for logging/observability) */
  unmatchedSelectors: string[];
}

export interface StyleEvaluationResult {
  /** Global declarations (merged `style default` values) */
  globals: Record<string, unknown>;
  /** Optional skin name derived from globals */
  skin?: string;
  /** Look-up map keyed by AST node reference */
  nodeStyles: Map<Node, Record<string, unknown>>;
  /** Helper to fetch resolved styles for a node */
  getNodeStyles: (node: Node) => Record<string, unknown> | undefined;
  /** Metrics for observability */
  metrics: StyleEvaluationMetrics;
}

interface CompiledRule {
  selector: Selector;
  declarations: Record<string, unknown>;
  specificity: number;
  order: number;
  selectorText: string;
  matchCount: number;
}

/**
 * Evaluate parsed style rules against the document tree.
 */
export function evaluateStyles(document: Document): StyleEvaluationResult {
  const compiledRules = compileRules(document.styles ?? []);
  const defaultRules = compiledRules.filter((rule) => rule.selector.type === 'default');
  const targetedRules = compiledRules.filter((rule) => rule.selector.type !== 'default');
  const globals = mergeDefaultDeclarations(defaultRules);
  const nodeStyles = new Map<Node, Record<string, unknown>>();

  let nodeCount = 0;

  traverseNodes(document.nodes, (node) => {
    nodeCount++;
    const resolved: Record<string, unknown> = { ...globals };
    const matches = targetedRules.filter((rule) => matchesSelector(rule.selector, node));
    matches.sort(compareRules);

    for (const rule of matches) {
      rule.matchCount++;
      Object.assign(resolved, rule.declarations);
    }

    nodeStyles.set(node, resolved);
  });

  if (nodeCount > 0) {
    for (const rule of defaultRules) {
      rule.matchCount = nodeCount;
    }
  }

  const unmatchedSelectors = targetedRules
    .filter((rule) => rule.matchCount === 0)
    .map((rule) => rule.selectorText);

  if (unmatchedSelectors.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `[Styles] ${unmatchedSelectors.length} selectors did not match any nodes: ${unmatchedSelectors.join(', ')}`,
    );
  }

  return {
    globals,
    skin: typeof globals.skin === 'string' ? (globals.skin as string) : undefined,
    nodeStyles,
    getNodeStyles: (node: Node) => nodeStyles.get(node),
    metrics: {
      totalRules: compiledRules.length,
      matchedRules: compiledRules.filter((rule) => rule.matchCount > 0).length,
      unmatchedSelectors,
    },
  };
}

function compileRules(rules: StyleRule[]): CompiledRule[] {
  return rules.map((rule, index) => ({
    selector: rule.selector,
    declarations: rule.declarations,
    specificity: getSpecificity(rule.selector),
    order: index,
    selectorText: formatSelector(rule.selector),
    matchCount: 0,
  }));
}

function mergeDefaultDeclarations(rules: CompiledRule[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const sorted = [...rules].sort((a, b) => a.order - b.order);
  for (const rule of sorted) {
    Object.assign(merged, rule.declarations);
  }
  return merged;
}

function traverseNodes(nodes: Node[] = [], visitor: (node: Node) => void): void {
  for (const node of nodes) {
    visitor(node);
    if (node.children?.length) {
      traverseNodes(node.children, visitor);
    }
  }
}

function matchesSelector(selector: Selector, node: Node): boolean {
  switch (selector.type) {
    case 'default':
      return true;
    case 'type':
      return node.type === selector.name;
    case 'class':
      return Array.isArray(node.classes) && node.classes.includes(selector.name);
    case 'id':
      return node.id === selector.name;
    default:
      return false;
  }
}

function compareRules(a: CompiledRule, b: CompiledRule): number {
  if (a.specificity !== b.specificity) {
    return a.specificity - b.specificity;
  }
  return a.order - b.order;
}

function getSpecificity(selector: Selector): number {
  switch (selector.type) {
    case 'default':
      return 0;
    case 'type':
      return 1;
    case 'class':
      return 10;
    case 'id':
      return 100;
    default:
      return 0;
  }
}

function formatSelector(selector: Selector): string {
  switch (selector.type) {
    case 'default':
      return 'default';
    case 'type':
      return `type(${selector.name})`;
    case 'class':
      return `.${selector.name}`;
    case 'id':
      return `#${selector.name}`;
    default:
      return '';
  }
}
