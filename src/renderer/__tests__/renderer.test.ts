import { describe, expect, it } from 'vitest';
import type { LayoutBox } from '../../layout/types.js';
import { render } from '../index.js';

function createBox(partial: {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  label?: string;
  tone?: string;
}): LayoutBox {
  return {
    id: partial.id,
    type: partial.type,
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    zIndex: partial.zIndex,
    label: partial.label,
    tone: partial.tone,
    nodeId: partial.id,
    props: undefined,
    children: undefined,
    signature: `${partial.type}-${partial.id}`,
  };
}

describe('renderer', () => {
  it('renders clean skin snapshot for sample layout nodes', () => {
    const card = createBox({
      id: 'card-hero',
      type: 'card',
      x: 32,
      y: 32,
      width: 480,
      height: 320,
      zIndex: 0,
      tone: 'ghost',
      label: 'Hero',
    });
    const heading = createBox({
      id: 'text-heading',
      type: 'text',
      x: 64,
      y: 72,
      width: 320,
      height: 32,
      zIndex: 1,
      label: 'Clean skin renderer',
    });
    const body = createBox({
      id: 'text-body',
      type: 'text',
      x: 64,
      y: 112,
      width: 320,
      height: 24,
      zIndex: 2,
      label: 'Instant SVG previews with Loom defaults.',
    });
    const primaryButton = createBox({
      id: 'button-primary',
      type: 'button',
      x: 64,
      y: 200,
      width: 160,
      height: 40,
      zIndex: 3,
      label: 'Get started',
      tone: 'brand',
    });
    const ghostButton = createBox({
      id: 'button-ghost',
      type: 'button',
      x: 240,
      y: 200,
      width: 140,
      height: 40,
      zIndex: 4,
      label: 'Docs',
      tone: 'ghost',
    });

    card.children = [heading, body, primaryButton, ghostButton];

    const tabs = createBox({
      id: 'tabs-1',
      type: 'tabs',
      x: 32,
      y: 380,
      width: 420,
      height: 72,
      zIndex: 5,
    });

    const list = createBox({
      id: 'list-1',
      type: 'list',
      x: 520,
      y: 64,
      width: 320,
      height: 212,
      zIndex: 1,
    });

    const input = createBox({
      id: 'input-1',
      type: 'input',
      x: 520,
      y: 300,
      width: 320,
      height: 48,
      zIndex: 2,
      label: 'Email',
    });

    const accentText = createBox({
      id: 'text-accent',
      type: 'text',
      x: 520,
      y: 368,
      width: 220,
      height: 24,
      zIndex: 3,
      label: '“Preview ready”',
      tone: 'brand',
    });

    const result = render([card, tabs, list, input, accentText]);

    expect(result.metrics.nodeCount).toBeGreaterThan(0);
    expect(result.svg).toMatchInlineSnapshot(`
      "<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loom preview (clean skin)" width="840" height="452" viewBox="0 0 840 452">
        <defs>
          <filter id="loomCardShadow" x="-20%" y="-20%" width="140%" height="160%" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.12" />
        </filter>
          <style>
          .loom-node { font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; transition: 120ms ease; }
          .loom-node.is-hover { opacity: 0.92; }
          .loom-node.is-focus { outline: 2px solid #7C3AED; outline-offset: 3px; }
          .loom-text { letter-spacing: 0.01em; }
          .loom-button__label { text-transform: none; }
          .loom-tabs text { pointer-events: none; }
        </style>
        </defs>
        <rect class="loom-canvas" x="0" y="0" width="840" height="452" fill="#F8FAFC" />
        <rect class="loom-node loom-card tone-ghost" data-node-id="card-hero" data-type="card" x="32" y="32" width="480" height="320" rx="12" ry="12" fill="#eff1f4" stroke="#E2E8F0" stroke-width="1" filter="url(#loomCardShadow)" /><g class="loom-node loom-list" data-node-id="list-1" data-type="list">
          <rect x="520" y="64" width="320" height="212" rx="12" ry="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
          <circle cx="532" cy="76" r="4" fill="#CBD5F5" />
          <rect x="544" y="68" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="108" r="4" fill="#CBD5F5" />
          <rect x="544" y="100" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="140" r="4" fill="#CBD5F5" />
          <rect x="544" y="132" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="172" r="4" fill="#CBD5F5" />
          <rect x="544" y="164" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="204" r="4" fill="#CBD5F5" />
          <rect x="544" y="196" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="236" r="4" fill="#CBD5F5" />
          <rect x="544" y="228" width="280" height="12" rx="6" fill="#F1F5F9" />
        </g><text class="loom-node loom-text" data-node-id="text-heading" data-type="text" x="68" y="88" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Clean skin renderer</text><g class="loom-node loom-input" data-node-id="input-1" data-type="input">
          <rect x="520" y="300" width="320" height="48" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
          <text x="532" y="325" fill="#94A3B8" font-size="14" font-weight="500" dominant-baseline="middle">Email</text>
        </g><text class="loom-node loom-text" data-node-id="text-body" data-type="text" x="68" y="124" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Instant SVG previews with Loom defaults.</text><g class="loom-node loom-button tone-brand" data-node-id="button-primary" data-type="button">
          <rect x="64" y="200" width="160" height="40" rx="8" ry="8" fill="#6D28D9" stroke="#6D28D9" stroke-width="1" />
          <text class="loom-button__label" x="144" y="221" fill="#FFFFFF" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Get started</text>
        </g><text class="loom-node loom-text tone-brand" data-node-id="text-accent" data-type="text" x="524" y="380" fill="#6D28D9" font-size="14" font-weight="500" dominant-baseline="middle">“Preview ready”</text><g class="loom-node loom-button tone-ghost" data-node-id="button-ghost" data-type="button">
          <rect x="240" y="200" width="140" height="40" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
          <text class="loom-button__label" x="310" y="221" fill="#0F172A" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Docs</text>
        </g><g class="loom-node loom-tabs" data-node-id="tabs-1" data-type="tabs">
          <g class="loom-tab is-active">
            <rect x="40" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
            <text x="103.33333333333333" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="#475569">Tab 1</text>
          </g><g class="loom-tab">
            <rect x="174.66666666666666" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#EEF2FF" stroke="#CBD5F5" stroke-width="1" />
            <text x="238" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="500" fill="#475569">Tab 2</text>
          </g><g class="loom-tab">
            <rect x="309.3333333333333" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#EEF2FF" stroke="#CBD5F5" stroke-width="1" />
            <text x="372.66666666666663" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="500" fill="#475569">Tab 3</text>
          </g>
        </g>
      </svg>"
    `);
  });

  it('sanitizes unsafe text content', () => {
    const textBox = createBox({
      id: 'text-bad',
      type: 'text',
      x: 0,
      y: 0,
      width: 200,
      height: 24,
      zIndex: 0,
      label: '<script>oops()</script>',
    });

    const result = render([textBox]);
    expect(result.svg).toContain('&lt;script&gt;oops()&lt;/script&gt;');
    expect(result.metrics.sanitizedTextCount).toBe(1);
  });
});
