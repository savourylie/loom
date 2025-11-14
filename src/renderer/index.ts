import { performance } from 'node:perf_hooks';
import type { LayoutBox } from '../layout/types.js';
import type { SkinSettings, SkinTokens } from './skin.js';
import { resolveSkinTokens } from './skin.js';

export interface RenderMetrics {
  renderTimeMs: number;
  nodeCount: number;
  sanitizedTextCount: number;
}

export interface RenderResult {
  svg: string;
  metrics: RenderMetrics;
  skin: SkinTokens;
}

interface RenderContext {
  tokens: SkinTokens;
  metrics: RenderMetrics;
  cardShadowId: string;
}

type BoxRenderer = (box: LayoutBox, ctx: RenderContext) => string | undefined;

const CANVAS_FALLBACK_WIDTH = 800;
const CANVAS_FALLBACK_HEIGHT = 600;

const COMPONENT_RENDERERS: Record<string, BoxRenderer> = {
  card: renderCard,
  section: renderCard,
  text: renderText,
  button: renderButton,
  input: renderInput,
  image: renderImage,
  icon: renderIcon,
  spacer: renderSpacer,
  list: renderList,
  tabs: renderTabs,
};

export function render(boxes: LayoutBox[] = [], skinSettings?: SkinSettings): RenderResult {
  const start = performance.now();
  const skin = resolveSkinTokens(skinSettings);
  const flattened = flattenBoxes(boxes);
  const sorted = flattened.sort((a, b) => {
    if (a.zIndex !== b.zIndex) {
      return a.zIndex - b.zIndex;
    }
    return a.id.localeCompare(b.id);
  });

  const metrics: RenderMetrics = {
    renderTimeMs: 0,
    nodeCount: sorted.length,
    sanitizedTextCount: 0,
  };

  const bounds = measureBounds(sorted);
  const width = bounds.width > 0 ? Math.ceil(bounds.width) : CANVAS_FALLBACK_WIDTH;
  const height = bounds.height > 0 ? Math.ceil(bounds.height) : CANVAS_FALLBACK_HEIGHT;

  const ctx: RenderContext = {
    tokens: skin,
    metrics,
    cardShadowId: 'loomCardShadow',
  };

  const nodesMarkup = sorted
    .map((box) => renderBox(box, ctx))
    .filter((chunk): chunk is string => Boolean(chunk))
    .join('');

  const defs = createDefs(ctx);
  const css = createCss(ctx.tokens);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loom preview (${skin.name} skin)" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${defs}
    <style>${css}</style>
  </defs>
  <rect class="loom-canvas" x="0" y="0" width="${width}" height="${height}" fill="${skin.palette.canvas}" />
  ${nodesMarkup}
</svg>`;

  metrics.renderTimeMs = Number((performance.now() - start).toFixed(2));

  if (process.env.NODE_ENV !== 'test') {
    console.info(
      `[renderer] Rendered ${metrics.nodeCount} nodes in ${metrics.renderTimeMs}ms (sanitized text: ${metrics.sanitizedTextCount})`,
    );
  }

  return {
    svg,
    metrics,
    skin,
  };
}

function renderBox(box: LayoutBox, ctx: RenderContext): string | undefined {
  const renderer = COMPONENT_RENDERERS[box.type];
  if (renderer) {
    return renderer(box, ctx);
  }

  if (box.children?.length) {
    return undefined;
  }

  return renderFallback(box, ctx);
}

function renderCard(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-card']);
  const { tokens } = ctx;
  const fill = getSurfaceFill(box.tone, tokens);
  const filter = `filter="url(#${ctx.cardShadowId})"`;

  return `<rect ${attrs} x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${tokens.radii.card}" ry="${tokens.radii.card}" fill="${fill}" stroke="${tokens.palette.stroke}" stroke-width="${tokens.stroke.width}" ${filter} />`;
}

function renderText(box: LayoutBox, ctx: RenderContext): string | undefined {
  const propText = typeof box.props?.text === 'string' ? (box.props.text as string) : undefined;
  const label = sanitizeCopy(box.label ?? propText, ctx, 'Text');
  if (!label) {
    return undefined;
  }
  const attrs = nodeAttrs(box, ['loom-text']);
  const fontSize = ctx.tokens.typography.baseSize;
  const x = box.x + 4;
  const y = box.y + box.height / 2;
  const fill = getToneForeground(box.tone, ctx.tokens);

  return `<text ${attrs} x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-weight="${ctx.tokens.typography.weightRegular}" dominant-baseline="middle">${label}</text>`;
}

function renderButton(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-button']);
  const label = sanitizeCopy(box.label, ctx, 'Button');
  const variant = getButtonVariant(box.tone, ctx.tokens);
  const textY = box.y + box.height / 2 + 1;

  return `<g ${attrs}>
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${ctx.tokens.radii.control}" ry="${ctx.tokens.radii.control}" fill="${variant.fill}" stroke="${variant.stroke}" stroke-width="${ctx.tokens.stroke.width}" />
    <text class="loom-button__label" x="${box.x + box.width / 2}" y="${textY}" fill="${variant.text}" font-size="${ctx.tokens.typography.buttonSize}" font-weight="${ctx.tokens.typography.weightBold}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </g>`;
}

function renderInput(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-input']);
  const label = sanitizeCopy(box.label, ctx, 'Field label');
  const textY = box.y + box.height / 2 + 1;

  return `<g ${attrs}>
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${ctx.tokens.radii.control}" ry="${ctx.tokens.radii.control}" fill="${ctx.tokens.palette.surface}" stroke="${ctx.tokens.palette.stroke}" stroke-width="${ctx.tokens.stroke.width}" />
    <text x="${box.x + 12}" y="${textY}" fill="${ctx.tokens.palette.placeholder}" font-size="${ctx.tokens.typography.baseSize}" font-weight="${ctx.tokens.typography.weightRegular}" dominant-baseline="middle">${label}</text>
  </g>`;
}

function renderImage(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-image']);
  const { palette, stroke } = ctx.tokens;
  const pad = 12;

  return `<g ${attrs}>
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${ctx.tokens.radii.card}" ry="${ctx.tokens.radii.card}" fill="${palette.surfaceAlt}" stroke="${palette.stroke}" stroke-width="${stroke.width}" />
    <path d="M ${box.x + pad} ${box.y + pad} L ${box.x + box.width - pad} ${box.y + box.height - pad}" stroke="${palette.mutedStroke}" stroke-width="${stroke.width}" />
    <path d="M ${box.x + pad} ${box.y + box.height - pad} L ${box.x + box.width - pad} ${box.y + pad}" stroke="${palette.mutedStroke}" stroke-width="${stroke.width}" />
  </g>`;
}

function renderIcon(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-icon']);
  const radius = Math.min(box.width, box.height) / 2;

  return `<g ${attrs}>
    <circle cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" r="${radius}" fill="${ctx.tokens.palette.ghostSurface}" stroke="${ctx.tokens.palette.stroke}" stroke-width="${ctx.tokens.stroke.width}" />
    <path d="M ${box.x + box.width / 2} ${box.y + box.height / 2 - radius / 2} L ${box.x + box.width / 2} ${box.y + box.height / 2 + radius / 2}" stroke="${ctx.tokens.palette.icon}" stroke-width="${ctx.tokens.stroke.width}" />
    <path d="M ${box.x + box.width / 2 - radius / 2} ${box.y + box.height / 2} L ${box.x + box.width / 2 + radius / 2} ${box.y + box.height / 2}" stroke="${ctx.tokens.palette.icon}" stroke-width="${ctx.tokens.stroke.width}" />
  </g>`;
}

function renderSpacer(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-spacer']);

  return `<rect ${attrs} x="${box.x}" y="${box.y}" width="${Math.max(1, box.width)}" height="${Math.max(1, box.height)}" fill="transparent" stroke="${ctx.tokens.palette.mutedStroke}" stroke-dasharray="4 4" stroke-width="${ctx.tokens.stroke.width}" />`;
}

function renderList(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-list']);
  const itemHeight = 20;
  const gap = 12;
  const availableSlots = Math.max(1, Math.floor(box.height / (itemHeight + gap)));
  let elements = '';

  for (let i = 0; i < availableSlots; i++) {
    const y = box.y + 12 + i * (itemHeight + gap);
    elements += `<circle cx="${box.x + 12}" cy="${y}" r="4" fill="${ctx.tokens.palette.mutedStroke}" />
    <rect x="${box.x + 24}" y="${y - 8}" width="${Math.max(32, box.width - 40)}" height="12" rx="6" fill="${ctx.tokens.palette.surfaceAlt}" />`;
  }

  return `<g ${attrs}>
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${ctx.tokens.radii.card}" ry="${ctx.tokens.radii.card}" fill="${ctx.tokens.palette.surface}" stroke="${ctx.tokens.palette.stroke}" stroke-width="${ctx.tokens.stroke.width}" />
    ${elements}
  </g>`;
}

function renderTabs(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-tabs']);
  const tabCount = Math.max(2, Math.min(5, Math.floor(box.width / 120) || 3));
  const tabWidth = Math.max(72, (box.width - 16) / tabCount);
  const tabHeight = Math.max(24, Math.min(40, box.height - 16));
  let elements = '';

  for (let i = 0; i < tabCount; i++) {
    const x = box.x + 8 + i * tabWidth;
    const y = box.y + (box.height - tabHeight) / 2;
    const isActive = i === 0;
    const fill = isActive ? ctx.tokens.palette.surface : ctx.tokens.palette.ghostSurface;
    const stroke = isActive ? ctx.tokens.palette.stroke : ctx.tokens.palette.mutedStroke;
    const label = `Tab ${i + 1}`;
    const width = Math.max(48, tabWidth - 8);

    elements += `<g class="loom-tab${isActive ? ' is-active' : ''}">
      <rect x="${x}" y="${y}" width="${width}" height="${tabHeight}" rx="${ctx.tokens.radii.control}" ry="${ctx.tokens.radii.control}" fill="${fill}" stroke="${stroke}" stroke-width="${ctx.tokens.stroke.width}" />
      <text x="${x + width / 2}" y="${y + tabHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${ctx.tokens.typography.baseSize}" font-weight="${isActive ? ctx.tokens.typography.weightBold : ctx.tokens.typography.weightRegular}" fill="${ctx.tokens.palette.textMuted}">${label}</text>
    </g>`;
  }

  return `<g ${attrs}>
    ${elements}
  </g>`;
}

function renderFallback(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-fallback']);

  return `<rect ${attrs} x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${ctx.tokens.radii.control}" ry="${ctx.tokens.radii.control}" fill="${ctx.tokens.palette.surfaceAlt}" stroke="${ctx.tokens.palette.stroke}" stroke-width="${ctx.tokens.stroke.width}" />`;
}

function flattenBoxes(nodes: LayoutBox[]): LayoutBox[] {
  const result: LayoutBox[] = [];
  const stack = [...nodes];
  while (stack.length) {
    const box = stack.shift();
    if (!box) continue;
    result.push(box);
    if (box.children) {
      stack.push(...box.children);
    }
  }
  return result;
}

function measureBounds(boxes: LayoutBox[]): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  for (const box of boxes) {
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return {
    width: maxX,
    height: maxY,
  };
}

function createDefs(ctx: RenderContext): string {
  const { card } = ctx.tokens.shadows;
  const stdDeviation = card.blur / 2;

  return `<filter id="${ctx.cardShadowId}" x="-20%" y="-20%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feDropShadow dx="${card.dx}" dy="${card.dy}" stdDeviation="${stdDeviation}" flood-color="${card.color}" flood-opacity="${card.opacity}" />
  </filter>`;
}

function createCss(tokens: SkinTokens): string {
  return `
    .loom-node { font-family: ${tokens.typography.fontFamily}; transition: 120ms ease; }
    .loom-node.is-hover { opacity: 0.92; }
    .loom-node.is-focus { outline: 2px solid ${tokens.palette.focus}; outline-offset: 3px; }
    .loom-text { letter-spacing: 0.01em; }
    .loom-button__label { text-transform: none; }
    .loom-tabs text { pointer-events: none; }
  `;
}

function sanitizeCopy(value: unknown, ctx: RenderContext, fallback = ''): string {
  const text = typeof value === 'string' && value.length > 0 ? value : fallback;
  return escapeText(text, ctx.metrics);
}

function escapeText(value: unknown, metrics: RenderMetrics): string {
  const text = typeof value === 'string' ? value : value != null ? String(value) : '';
  const sanitized = text.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return match;
    }
  });
  if (sanitized !== text) {
    metrics.sanitizedTextCount++;
  }
  return sanitized;
}

function nodeAttrs(box: LayoutBox, extraClasses: string[] = []): string {
  const classes = ['loom-node', ...extraClasses];
  if (box.tone) {
    classes.push(`tone-${box.tone}`);
  }
  return `class="${classes.join(' ')}" data-node-id="${escapeAttribute(box.id)}" data-type="${escapeAttribute(box.type)}"`;
}

function escapeAttribute(value: string): string {
  return String(value).replace(/[&"<>'`]/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case "'":
        return '&#39;';
      case '`':
        return '&#96;';
      default:
        return match;
    }
  });
}

function getSurfaceFill(tone: string | undefined, tokens: SkinTokens): string {
  if (!tone) {
    return tokens.palette.surface;
  }
  const toneColor = resolveToneColor(tone, tokens);
  if (!toneColor) {
    return tokens.palette.surface;
  }
  return tintColor(toneColor, 0.85);
}

function getToneForeground(tone: string | undefined, tokens: SkinTokens): string {
  const toneColor = resolveToneColor(tone, tokens);
  return toneColor ?? tokens.palette.text;
}

function resolveToneColor(tone: string | undefined, tokens: SkinTokens): string | undefined {
  switch (tone) {
    case 'brand':
      return tokens.palette.brand;
    case 'primary':
      return tokens.palette.primary;
    case 'danger':
      return tokens.palette.danger;
    case 'ghost':
      return tokens.palette.placeholder;
    default:
      return undefined;
  }
}

function getButtonVariant(tone: string | undefined, tokens: SkinTokens): {
  fill: string;
  stroke: string;
  text: string;
} {
  switch (tone) {
    case 'ghost':
      return {
        fill: tokens.palette.surface,
        stroke: tokens.palette.stroke,
        text: tokens.palette.text,
      };
    case 'danger':
      return {
        fill: tokens.palette.danger,
        stroke: tokens.palette.danger,
        text: '#FFFFFF',
      };
    case 'brand':
      return {
        fill: tokens.palette.brand,
        stroke: tokens.palette.brand,
        text: '#FFFFFF',
      };
    case 'primary':
    default:
      return {
        fill: tokens.palette.primary,
        stroke: tokens.palette.primary,
        text: '#FFFFFF',
      };
  }
}

function tintColor(hex: string, ratio: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel: number): number => Math.min(255, Math.round(channel + (255 - channel) * ratio));
  return rgbToHex(mix(r), mix(g), mix(b));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3 ? normalized.repeat(2) : normalized;
  const intValue = parseInt(value, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((channel) => {
        const fragment = channel.toString(16);
        return fragment.length === 1 ? `0${fragment}` : fragment;
      })
      .join('')
  );
}
