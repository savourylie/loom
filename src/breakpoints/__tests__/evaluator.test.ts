import { describe, it, expect, beforeEach } from 'vitest';
import { parseDocument } from '../../parser/parser.js';
import { evaluateBreakpoints, resetBreakpointInstrumentation } from '../evaluator.js';

describe('evaluateBreakpoints', () => {
  beforeEach(() => {
    resetBreakpointInstrumentation();
  });

  it('returns breakpoint nodes when width matches condition', () => {
    const input = `grid cols:12 gap:2
when <600 {
  vstack gap:1
    text "Mobile"
}`;
    const document = parseDocument(input).document;

    const evaluation = evaluateBreakpoints(document, 480);

    expect(evaluation.nodes[0]?.type).toBe('vstack');
    expect(evaluation.activeBreakpoint?.index).toBe(0);
    expect(evaluation.metrics.usedFallback).toBe(false);
  });

  it('falls back to base document when no breakpoint matches and tracks count', () => {
    const input = `grid cols:12 gap:2
  card "Base"

when <600 {
  vstack gap:1
    text "Mobile"
}`;
    const document = parseDocument(input).document;

    const evaluation = evaluateBreakpoints(document, 1280);

    expect(evaluation.nodes[0]?.type).toBe('grid');
    expect(evaluation.metrics.usedFallback).toBe(true);
    expect(evaluation.metrics.fallbackActivations).toBe(1);
  });

  it('merges breakpoint style overrides with base styles', () => {
    const input = `grid cols:12 gap:2

style default {
  tone: base
}

when <900 {
  style .primary {
    tone: brand
  }
}`;
    const document = parseDocument(input).document;

    const evaluation = evaluateBreakpoints(document, 800);

    expect(evaluation.styles.length).toBe(document.styles.length + 1);
    expect(evaluation.metrics.usedFallback).toBe(false);
  });
});
