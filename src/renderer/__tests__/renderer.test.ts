import { describe, expect, it } from 'vitest';
import type { LayoutBox } from '../../layout/types.js';
import { render } from '../index.js';
import { skinSettingsFromGlobals } from '../skin.js';

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

function buildSampleLayout(): LayoutBox[] {
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

  return [card, tabs, list, input, accentText];
}

describe('renderer', () => {
  it('renders clean skin snapshot for sample layout nodes', () => {
    const nodes = buildSampleLayout();
    const result = render(nodes);

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
        <rect class="loom-node loom-card tone-ghost" data-node-id="card-hero" data-type="card" filter="url(#loomCardShadow)" x="32" y="32" width="480" height="320" rx="12" ry="12" fill="#eff1f4" stroke="#E2E8F0" stroke-width="1" stroke-linecap="butt" /><g class="loom-node loom-list" data-node-id="list-1" data-type="list">
          <rect x="520" y="64" width="320" height="212" rx="12" ry="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" stroke-linecap="butt" />
          <circle cx="532" cy="76" r="4" fill="#CBD5F5" />
          <rect x="544" y="68" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="108" r="4" fill="#CBD5F5" />
          <rect x="544" y="100" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="140" r="4" fill="#CBD5F5" />
          <rect x="544" y="132" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="172" r="4" fill="#CBD5F5" />
          <rect x="544" y="164" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="204" r="4" fill="#CBD5F5" />
          <rect x="544" y="196" width="280" height="12" rx="6" fill="#F1F5F9" /><circle cx="532" cy="236" r="4" fill="#CBD5F5" />
          <rect x="544" y="228" width="280" height="12" rx="6" fill="#F1F5F9" />
        </g><text class="loom-node loom-text" data-node-id="text-heading" data-type="text" x="68" y="88" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Clean skin renderer</text><g class="loom-node loom-input" data-node-id="input-1" data-type="input">
          <rect x="520" y="300" width="320" height="48" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" stroke-linecap="butt" />
          <text x="532" y="325" fill="#94A3B8" font-size="14" font-weight="500" dominant-baseline="middle">Email</text>
        </g><text class="loom-node loom-text" data-node-id="text-body" data-type="text" x="68" y="124" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Instant SVG previews with Loom defaults.</text><g class="loom-node loom-button tone-brand" data-node-id="button-primary" data-type="button">
          <rect x="64" y="200" width="160" height="40" rx="8" ry="8" fill="#6D28D9" stroke="#6D28D9" stroke-width="1" stroke-linecap="butt" />
          <text class="loom-button__label" x="144" y="221" fill="#FFFFFF" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Get started</text>
        </g><text class="loom-node loom-text tone-brand" data-node-id="text-accent" data-type="text" x="524" y="380" fill="#6D28D9" font-size="14" font-weight="500" dominant-baseline="middle">“Preview ready”</text><g class="loom-node loom-button tone-ghost" data-node-id="button-ghost" data-type="button">
          <rect x="240" y="200" width="140" height="40" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" stroke-linecap="butt" />
          <text class="loom-button__label" x="310" y="221" fill="#0F172A" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Docs</text>
        </g><g class="loom-node loom-tabs" data-node-id="tabs-1" data-type="tabs">
          <g class="loom-tab is-active">
            <rect x="40" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" stroke-linecap="butt" />
            <text x="103.33333333333333" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="#475569">Tab 1</text>
          </g><g class="loom-tab">
            <rect x="174.66666666666666" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#EEF2FF" stroke="#CBD5F5" stroke-width="1" stroke-linecap="butt" />
            <text x="238" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="500" fill="#475569">Tab 2</text>
          </g><g class="loom-tab">
            <rect x="309.3333333333333" y="396" width="126.66666666666666" height="40" rx="8" ry="8" fill="#EEF2FF" stroke="#CBD5F5" stroke-width="1" stroke-linecap="butt" />
            <text x="372.66666666666663" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="500" fill="#475569">Tab 3</text>
          </g>
        </g>
      </svg>"
    `);
  });

  it('renders sketch skin snapshot for sample layout nodes', () => {
    const nodes = buildSampleLayout();
    const skinSettings = skinSettingsFromGlobals({ skin: 'sketch' })!;
    const result = render(nodes, skinSettings);

    expect(result.skin.name).toBe('sketch');
    expect(result.svg).toMatchInlineSnapshot(`
      "<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loom preview (sketch skin)" width="840" height="452" viewBox="0 0 840 452">
        <defs>
          <filter id="loomCardShadow" x="-20%" y="-20%" width="140%" height="160%" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.08" />
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
        <rect class="loom-canvas" x="0" y="0" width="840" height="452" fill="#FFFBF0" />
        <path class="loom-node loom-card tone-ghost" data-node-id="card-hero" data-type="card" filter="url(#loomCardShadow)" d="M 42.79 31.8 L 500.82 32.52 Q 512.5 30.66 511.15 44.9 L 510.91 340.16 Q 511.97 351.73 500.45 351 L 45.35 351.17 Q 32.88 351.66 32.02 338.61 L 30.97 45.22 Q 33.24 31.16 44.5 33.02 Z" fill="#eff1f4" stroke="#D4A373" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" /><g class="loom-node loom-list" data-node-id="list-1" data-type="list">
          <path d="M 531.07 64.4 L 826.71 64.59 Q 840.41 64.7 841.08 75.7 L 839.59 264.09 Q 838.9 276.4 828.55 275.76 L 532.25 275.74 Q 521.01 275.82 519.2 263.63 L 518.72 75.22 Q 520.45 64.49 530.69 64.23 Z" fill="#FFFDF7" stroke="#D4A373" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
          <circle cx="532" cy="76" r="4" fill="#FDE68A" />
          <rect x="544" y="68" width="280" height="12" rx="6" fill="#FEF3C7" /><circle cx="532" cy="108" r="4" fill="#FDE68A" />
          <rect x="544" y="100" width="280" height="12" rx="6" fill="#FEF3C7" /><circle cx="532" cy="140" r="4" fill="#FDE68A" />
          <rect x="544" y="132" width="280" height="12" rx="6" fill="#FEF3C7" /><circle cx="532" cy="172" r="4" fill="#FDE68A" />
          <rect x="544" y="164" width="280" height="12" rx="6" fill="#FEF3C7" /><circle cx="532" cy="204" r="4" fill="#FDE68A" />
          <rect x="544" y="196" width="280" height="12" rx="6" fill="#FEF3C7" /><circle cx="532" cy="236" r="4" fill="#FDE68A" />
          <rect x="544" y="228" width="280" height="12" rx="6" fill="#FEF3C7" />
        </g><text class="loom-node loom-text" data-node-id="text-heading" data-type="text" x="68" y="88" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Clean skin renderer</text><g class="loom-node loom-input" data-node-id="input-1" data-type="input">
          <path d="M 528.46 298.93 L 831.73 300.42 Q 841.04 300.63 839.52 308.75 L 839.73 339.39 Q 839.78 348.74 832.24 348.27 L 527.87 347.07 Q 519.34 346.82 519.61 341.29 L 520.27 308.46 Q 518.76 301.38 527.52 300.47 Z" fill="#FFFDF7" stroke="#D4A373" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
          <text x="532" y="325" fill="#94A3B8" font-size="14" font-weight="500" dominant-baseline="middle">Email</text>
        </g><text class="loom-node loom-text" data-node-id="text-body" data-type="text" x="68" y="124" fill="#0F172A" font-size="14" font-weight="500" dominant-baseline="middle">Instant SVG previews with Loom defaults.</text><g class="loom-node loom-button tone-brand" data-node-id="button-primary" data-type="button">
          <path d="M 72.25 199.27 L 215.48 199.4 Q 224.54 200.67 224.26 209.3 L 224.38 230.83 Q 224.97 240.01 214.64 240.32 L 71.93 240.34 Q 62.97 241.04 64.57 231.74 L 64.65 207.4 Q 63.89 199.76 73.06 199.32 Z" fill="#6D28D9" stroke="#6D28D9" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
          <text class="loom-button__label" x="144" y="221" fill="#FFFFFF" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Get started</text>
        </g><text class="loom-node loom-text tone-brand" data-node-id="text-accent" data-type="text" x="524" y="380" fill="#6D28D9" font-size="14" font-weight="500" dominant-baseline="middle">“Preview ready”</text><g class="loom-node loom-button tone-ghost" data-node-id="button-ghost" data-type="button">
          <path d="M 248.81 199.54 L 371 201.17 Q 379.62 199.24 380.21 208.99 L 379.3 232.34 Q 379.47 239.12 373.22 241.3 L 248.57 239.9 Q 240.14 240.34 240.67 231.47 L 238.74 207.68 Q 240.23 201.24 248.8 198.89 Z" fill="#FFFDF7" stroke="#D4A373" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
          <text class="loom-button__label" x="310" y="221" fill="#0F172A" font-size="15" font-weight="600" text-anchor="middle" dominant-baseline="middle">Docs</text>
        </g><g class="loom-node loom-tabs" data-node-id="tabs-1" data-type="tabs">
          <g class="loom-tab is-active">
            <path d="M 48.26 396.24 L 159.41 395.38 Q 167.57 395.77 166.25 403.23 L 166.96 428.79 Q 166.84 434.71 157.7 436.37 L 47.54 434.88 Q 40.86 434.97 39.14 427.23 L 39.35 404.26 Q 40.28 395.6 47.92 396.49 Z" fill="#FFFDF7" stroke="#D4A373" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
            <text x="103.33333333333333" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="#475569">Tab 1</text>
          </g><g class="loom-tab">
            <path d="M 183.53 396.88 L 293.33 396.14 Q 302.03 395.38 302.49 404.46 L 300.85 426.98 Q 301.81 435.22 291.97 435.83 L 181.52 435.78 Q 174.15 437.34 175.46 427.93 L 175.03 403.07 Q 175.97 395.69 181.72 396.94 Z" fill="#EEF2FF" stroke="#FDE68A" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
            <text x="238" y="416" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="500" fill="#475569">Tab 2</text>
          </g><g class="loom-tab">
            <path d="M 316.89 395.37 L 426.82 397.3 Q 436.38 397.32 435.98 403.72 L 436.85 427.8 Q 434.99 436.87 428.23 435.79 L 316.03 435.82 Q 308.77 434.89 309.12 427.74 L 309.61 404.17 Q 309.55 395.74 317.95 395.91 Z" fill="#EEF2FF" stroke="#FDE68A" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="8 5" />
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
