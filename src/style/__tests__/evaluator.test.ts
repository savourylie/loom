import { describe, it, expect } from 'vitest';
import { createDocument, createNode, createStyleRule } from '../../ast/types.js';
import { evaluateStyles } from '../evaluator.js';

describe('evaluateStyles', () => {
  it('merges declarations according to specificity and order', () => {
    const document = createDocument();
    const button = createNode('button', 'Primary');
    button.classes = ['primary'];
    button.id = 'cta';
    document.nodes.push(button);

    document.styles = [
      createStyleRule({ type: 'default' }, { pad: 1, tone: 'ghost' }),
      createStyleRule({ type: 'type', name: 'button' }, { pad: 2 }),
      createStyleRule({ type: 'class', name: 'primary' }, { tone: 'brand' }),
      createStyleRule({ type: 'id', name: 'cta' }, { stroke: 'accent' }),
    ];

    const result = evaluateStyles(document);
    const resolved = result.getNodeStyles(button)!;

    expect(result.globals.pad).toBe(1);
    expect(resolved.pad).toBe(2); // type selector overrides default pad
    expect(resolved.tone).toBe('brand'); // class overrides default tone
    expect(resolved.stroke).toBe('accent'); // id wins with highest specificity
  });

  it('tracks unmatched selectors for observability', () => {
    const document = createDocument();
    document.nodes.push(createNode('card'));
    document.styles = [
      createStyleRule({ type: 'class', name: 'missing' }, { gap: 4 }),
    ];

    const result = evaluateStyles(document);

    expect(result.metrics.totalRules).toBe(1);
    expect(result.metrics.matchedRules).toBe(0);
    expect(result.metrics.unmatchedSelectors).toEqual(['.missing']);
  });

  it('exposes globals and skin derived from default styles', () => {
    const document = createDocument();
    const card = createNode('card');
    const button = createNode('button');
    button.classes = ['primary'];
    card.children = [button];
    document.nodes.push(card);

    document.styles = [
      createStyleRule({ type: 'default' }, { skin: 'sketch', tone: 'ghost' }),
      createStyleRule({ type: 'class', name: 'primary' }, { tone: 'brand' }),
    ];

    const result = evaluateStyles(document);

    expect(result.skin).toBe('sketch');
    expect(result.getNodeStyles(card)?.tone).toBe('ghost');
    expect(result.getNodeStyles(button)?.tone).toBe('brand');
    expect(result.nodeStyles.size).toBe(2);
  });
});
