import type { Breakpoint, Document, Node, StyleRule } from '../ast/types.js';

export interface BreakpointMatchInfo {
  breakpoint: Breakpoint;
  index: number;
}

export interface BreakpointMetrics {
  evaluated: number;
  matchedIndex: number;
  usedFallback: boolean;
  fallbackActivations: number;
}

export interface BreakpointEvaluationResult {
  document: Document;
  nodes: Node[];
  styles: StyleRule[];
  activeBreakpoint?: BreakpointMatchInfo;
  metrics: BreakpointMetrics;
}

let fallbackActivations = 0;

/**
 * Evaluate breakpoint conditions for a viewport width and produce active nodes/styles
 */
export function evaluateBreakpoints(
  document: Document,
  viewportWidth: number,
): BreakpointEvaluationResult {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 0;
  const breakpoints = document.breakpoints ?? [];
  let activeMatch: BreakpointMatchInfo | undefined;

  breakpoints.forEach((breakpoint, index) => {
    if (matchesBreakpoint(breakpoint, width)) {
      activeMatch = { breakpoint, index };
    }
  });

  const usedFallback = !activeMatch;
  if (usedFallback) {
    fallbackActivations++;
  }

  const baseNodes = document.nodes ?? [];
  const baseStyles = document.styles ?? [];
  const nodes = activeMatch?.breakpoint.nodes?.length ? activeMatch.breakpoint.nodes : baseNodes;
  const styleOverrides = activeMatch?.breakpoint.styles ?? [];
  const styles = styleOverrides.length > 0 ? [...baseStyles, ...styleOverrides] : baseStyles;

  if (process.env.NODE_ENV !== 'test') {
    if (activeMatch) {
      console.info(
        `[Breakpoints] width ${width}px matched '${activeMatch.breakpoint.condition}' (index ${activeMatch.index})`,
      );
    } else {
      console.info(
        `[Breakpoints] width ${width}px using base document (fallback count: ${fallbackActivations})`,
      );
    }
  }

  return {
    document: {
      ...document,
      nodes,
      styles,
    },
    nodes,
    styles,
    activeBreakpoint: activeMatch,
    metrics: {
      evaluated: breakpoints.length,
      matchedIndex: activeMatch?.index ?? -1,
      usedFallback,
      fallbackActivations,
    },
  };
}

/** Reset instrumentation counters (primarily for tests) */
export function resetBreakpointInstrumentation(): void {
  fallbackActivations = 0;
}

function matchesBreakpoint(breakpoint: Breakpoint, width: number): boolean {
  const expressions = breakpoint.conditions ?? [];
  if (expressions.length === 0) {
    return false;
  }

  return expressions.every((expr) => {
    switch (expr.operator) {
      case '<':
        return width < expr.value;
      case '<=':
        return width <= expr.value;
      case '>':
        return width > expr.value;
      case '>=':
        return width >= expr.value;
      default:
        return false;
    }
  });
}
