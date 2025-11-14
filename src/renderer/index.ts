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

let sketchUsageCount = 0;

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
  if (skin.name === 'sketch') {
    sketchUsageCount++;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.info(
      `[renderer] Rendered ${metrics.nodeCount} nodes in ${metrics.renderTimeMs}ms (skin: ${skin.name}, overrides: ${countSkinOverrides(skinSettings?.overrides)}, sketchUsage: ${sketchUsageCount}, sanitized text: ${metrics.sanitizedTextCount})`,
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
  const attrs = `${nodeAttrs(box, ['loom-card'])} filter="url(#${ctx.cardShadowId})"`;
  const { tokens } = ctx;
  const fill = getSurfaceFill(box.tone, tokens);

  return renderRectElement(ctx, {
    attrs,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    radius: tokens.radii.card,
    fill,
    stroke: tokens.palette.stroke,
    seed: `${box.id}-card`,
  });
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
    ${renderRectElement(ctx, {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      radius: ctx.tokens.radii.control,
      fill: variant.fill,
      stroke: variant.stroke,
      seed: `${box.id}-button`,
    })}
    <text class="loom-button__label" x="${box.x + box.width / 2}" y="${textY}" fill="${variant.text}" font-size="${ctx.tokens.typography.buttonSize}" font-weight="${ctx.tokens.typography.weightBold}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </g>`;
}

function renderInput(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-input']);
  const label = sanitizeCopy(box.label, ctx, 'Field label');
  const textY = box.y + box.height / 2 + 1;

  return `<g ${attrs}>
    ${renderRectElement(ctx, {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      radius: ctx.tokens.radii.control,
      fill: ctx.tokens.palette.surface,
      stroke: ctx.tokens.palette.stroke,
      seed: `${box.id}-input`,
    })}
    <text x="${box.x + 12}" y="${textY}" fill="${ctx.tokens.palette.placeholder}" font-size="${ctx.tokens.typography.baseSize}" font-weight="${ctx.tokens.typography.weightRegular}" dominant-baseline="middle">${label}</text>
  </g>`;
}

function renderImage(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-image']);
  const { palette } = ctx.tokens;
  const pad = 12;
  const strokeAttrs = formatStrokeAttributes(ctx.tokens, { dashed: false });
  const strokeSegment = strokeAttrs ? ` ${strokeAttrs}` : '';

  return `<g ${attrs}>
    ${renderRectElement(ctx, {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      radius: ctx.tokens.radii.card,
      fill: palette.surfaceAlt,
      stroke: palette.stroke,
      seed: `${box.id}-image`,
      jitter: true,
    })}
    <path d="M ${box.x + pad} ${box.y + pad} L ${box.x + box.width - pad} ${box.y + box.height - pad}" stroke="${palette.mutedStroke}"${strokeSegment} />
    <path d="M ${box.x + pad} ${box.y + box.height - pad} L ${box.x + box.width - pad} ${box.y + pad}" stroke="${palette.mutedStroke}"${strokeSegment} />
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
    ${renderRectElement(ctx, {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      radius: ctx.tokens.radii.card,
      fill: ctx.tokens.palette.surface,
      stroke: ctx.tokens.palette.stroke,
      seed: `${box.id}-list`,
    })}
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
    const rectMarkup = renderRectElement(ctx, {
      x,
      y,
      width,
      height: tabHeight,
      radius: ctx.tokens.radii.control,
      fill,
      stroke,
      seed: `${box.id}-tab-${i}`,
    });

    elements += `<g class="loom-tab${isActive ? ' is-active' : ''}">
      ${rectMarkup}
      <text x="${x + width / 2}" y="${y + tabHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${ctx.tokens.typography.baseSize}" font-weight="${isActive ? ctx.tokens.typography.weightBold : ctx.tokens.typography.weightRegular}" fill="${ctx.tokens.palette.textMuted}">${label}</text>
    </g>`;
  }

  return `<g ${attrs}>
    ${elements}
  </g>`;
}

function renderFallback(box: LayoutBox, ctx: RenderContext): string {
  const attrs = nodeAttrs(box, ['loom-fallback']);

  return renderRectElement(ctx, {
    attrs,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    radius: ctx.tokens.radii.control,
    fill: ctx.tokens.palette.surfaceAlt,
    stroke: ctx.tokens.palette.stroke,
    seed: `${box.id}-fallback`,
  });
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

interface RectElementOptions {
  attrs?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fill: string;
  stroke: string;
  seed: string;
  jitter?: boolean;
  dashed?: boolean;
}

function renderRectElement(ctx: RenderContext, options: RectElementOptions): string {
  const { tokens } = ctx;
  const attrSegment =
    options.attrs && options.attrs.trim().length > 0 ? `${options.attrs.trim()} ` : '';
  const strokeAttrs = formatStrokeAttributes(tokens, { dashed: options.dashed });
  const strokeSegment = strokeAttrs ? ` ${strokeAttrs}` : '';
  const radius = Math.max(
    0,
    Math.min(options.radius ?? 0, Math.min(options.width, options.height) / 2),
  );
  const jitterEnabled =
    options.jitter !== false && tokens.jitter.enabled && tokens.jitter.amplitude > 0;

  if (jitterEnabled) {
    const seed = `${options.seed}:${tokens.jitter.seedOffset}`;
    const path = createSketchRectPath(
      options.x,
      options.y,
      options.width,
      options.height,
      radius,
      tokens.jitter.amplitude,
      seed,
    );
    return `<path ${attrSegment}d="${path}" fill="${options.fill}" stroke="${options.stroke}"${strokeSegment} />`;
  }

  const radiusAttrs = radius > 0 ? ` rx="${radius}" ry="${radius}"` : '';
  return `<rect ${attrSegment}x="${options.x}" y="${options.y}" width="${options.width}" height="${options.height}"${radiusAttrs} fill="${options.fill}" stroke="${options.stroke}"${strokeSegment} />`;
}

function formatStrokeAttributes(
  tokens: SkinTokens,
  options?: { dashed?: boolean; width?: number },
): string {
  const attrs: string[] = [`stroke-width="${options?.width ?? tokens.stroke.width}"`];
  if (tokens.stroke.linecap) {
    attrs.push(`stroke-linecap="${tokens.stroke.linecap}"`);
  }
  if (tokens.stroke.dasharray && options?.dashed !== false) {
    attrs.push(`stroke-dasharray="${tokens.stroke.dasharray}"`);
  }
  return attrs.join(' ');
}

function createSketchRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  jitter: number,
  seed: string,
): string {
  const rand = createSeededRandom(`${seed}:${width}:${height}`);
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));

  const start = jitterPoint(x + r, y, jitter, rand);
  const topRight = jitterPoint(x + width - r, y, jitter, rand);
  const topRightCtrl = jitterPoint(x + width, y, jitter, rand);
  const rightTop = jitterPoint(x + width, y + r, jitter, rand);
  const rightBottom = jitterPoint(x + width, y + height - r, jitter, rand);
  const bottomRightCtrl = jitterPoint(x + width, y + height, jitter, rand);
  const bottomRight = jitterPoint(x + width - r, y + height, jitter, rand);
  const bottomLeft = jitterPoint(x + r, y + height, jitter, rand);
  const bottomLeftCtrl = jitterPoint(x, y + height, jitter, rand);
  const leftBottom = jitterPoint(x, y + height - r, jitter, rand);
  const leftTop = jitterPoint(x, y + r, jitter, rand);
  const topLeftCtrl = jitterPoint(x, y, jitter, rand);
  const topLeft = jitterPoint(x + r, y, jitter, rand);

  return [
    `M ${start.x} ${start.y}`,
    `L ${topRight.x} ${topRight.y}`,
    `Q ${topRightCtrl.x} ${topRightCtrl.y} ${rightTop.x} ${rightTop.y}`,
    `L ${rightBottom.x} ${rightBottom.y}`,
    `Q ${bottomRightCtrl.x} ${bottomRightCtrl.y} ${bottomRight.x} ${bottomRight.y}`,
    `L ${bottomLeft.x} ${bottomLeft.y}`,
    `Q ${bottomLeftCtrl.x} ${bottomLeftCtrl.y} ${leftBottom.x} ${leftBottom.y}`,
    `L ${leftTop.x} ${leftTop.y}`,
    `Q ${topLeftCtrl.x} ${topLeftCtrl.y} ${topLeft.x} ${topLeft.y}`,
    'Z',
  ].join(' ');
}

function jitterPoint(
  x: number,
  y: number,
  amplitude: number,
  rand: () => number,
): { x: number; y: number } {
  if (amplitude <= 0) {
    return { x, y };
  }
  const offset = (): number => (rand() - 0.5) * 2 * amplitude;
  return {
    x: Number((x + offset()).toFixed(2)),
    y: Number((y + offset()).toFixed(2)),
  };
}

function createSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function next(): number {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function countSkinOverrides(overrides: SkinSettings['overrides']): number {
  if (!overrides) {
    return 0;
  }
  let count = 0;
  if (overrides.palette) {
    count += Object.keys(overrides.palette).length;
  }
  if (overrides.radii) {
    count += Object.keys(overrides.radii).length;
  }
  if (overrides.typography) {
    count += Object.keys(overrides.typography).length;
  }
  if (overrides.stroke) {
    count += Object.keys(overrides.stroke).length;
  }
  if (overrides.shadows?.card) {
    count += Object.keys(overrides.shadows.card).length;
  }
  if (overrides.jitter) {
    count += Object.keys(overrides.jitter).length;
  }
  return count;
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
