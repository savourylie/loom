import { Document, Node, isContainerNode } from '../ast/types.js';
import { ErrorCode, ErrorSeverity } from '../errors/index.js';
import { DiagnosticCollector } from '../parser/diagnostics.js';
import type { LayoutBox, LayoutOptions, LayoutResult } from './types.js';
import { createLayoutSignature } from './types.js';
import type { LayoutMemoHooks } from './types.js';

interface LayoutContext {
  unit: number;
  viewportWidth: number;
  viewportHeight: number;
  memo?: LayoutMemoHooks;
  diagnostics: DiagnosticCollector;
  warningCount: number;
  collisionCount: number;
  memoHitCount: number;
  autoId: number;
  nodeCount: number;
}

interface LayoutConstraints {
  availableWidth: number;
  availableHeight?: number;
  assignedWidth?: number;
  assignedHeight?: number;
}

interface Alignment {
  horizontal: 'start' | 'center' | 'end' | 'stretch';
  vertical: 'start' | 'center' | 'end' | 'stretch';
}

const DEFAULT_UNIT = 8;
const DEFAULT_ROOT_GAP_UNITS = 2;
const DEFAULT_VIEWPORT_WIDTH = 1024;
const DEFAULT_VIEWPORT_HEIGHT = 768;

const DEFAULT_LEAF_SIZES: Record<string, { width: number; height: number }> = {
  text: { width: 240, height: 24 },
  input: { width: 280, height: 48 },
  button: { width: 144, height: 40 },
  image: { width: 320, height: 200 },
  icon: { width: 24, height: 24 },
  spacer: { width: 16, height: 16 },
  list: { width: 320, height: 160 },
  tabs: { width: 320, height: 72 },
  card: { width: 320, height: 200 },
  section: { width: 320, height: 200 },
};

const STACK_TYPES = new Set(['section', 'card']);

const CARD_DEFAULT_PAD = 2;

function cloneBox(box: LayoutBox): LayoutBox {
  return {
    ...box,
    children: box.children ? box.children.map(cloneBox) : undefined,
    props: box.props ? { ...box.props } : undefined,
  };
}

function offsetBox(box: LayoutBox, dx: number, dy: number): void {
  box.x += dx;
  box.y += dy;
  if (box.children) {
    for (const child of box.children) {
      offsetBox(child, dx, dy);
    }
  }
}

function addWarning(
  ctx: LayoutContext,
  message: string,
  code: ErrorCode = ErrorCode.PLACEMENT_OUT_OF_BOUNDS,
  hint?: string,
): void {
  ctx.warningCount++;
  ctx.diagnostics.add(code, message, 0, 0, ErrorSeverity.WARNING, hint);
  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[Layout Warning] ${message}`);
  }
}

function toPx(valueUnits: number | undefined, ctx: LayoutContext, fallbackUnits = 0): number {
  const units = valueUnits ?? fallbackUnits;
  return Math.max(0, units * ctx.unit);
}

function getDefaultPadUnits(node: Node): number {
  if (node.type === 'card') {
    return CARD_DEFAULT_PAD;
  }
  return 0;
}

function parseAlignment(value: unknown): Alignment {
  if (typeof value !== 'string') {
    return { horizontal: 'start', vertical: 'start' };
  }

  const tokens = value.split('/');
  const horizontalToken = tokens[0]?.trim().toLowerCase();
  const verticalToken = tokens[1]?.trim().toLowerCase();

  return {
    horizontal: mapHorizontalAlign(horizontalToken),
    vertical: mapVerticalAlign(verticalToken),
  };
}

function mapHorizontalAlign(token?: string): Alignment['horizontal'] {
  switch (token) {
    case 'c':
    case 'center':
      return 'center';
    case 'r':
    case 'right':
      return 'end';
    case 's':
    case 'stretch':
      return 'stretch';
    default:
      return 'start';
  }
}

function mapVerticalAlign(token?: string): Alignment['vertical'] {
  switch (token) {
    case 'm':
    case 'middle':
    case 'c':
    case 'center':
      return 'center';
    case 'b':
    case 'bottom':
      return 'end';
    case 's':
    case 'stretch':
      return 'stretch';
    default:
      return 'start';
  }
}

function alignOffset(mode: 'start' | 'center' | 'end', containerSize: number, childSize: number): number {
  const freeSpace = Math.max(0, containerSize - childSize);
  if (mode === 'center') {
    return freeSpace / 2;
  }
  if (mode === 'end') {
    return freeSpace;
  }
  return 0;
}

function resolveTone(node: Node): string | undefined {
  const tone = node.props?.tone;
  return typeof tone === 'string' ? tone : undefined;
}

function createBaseBox(node: Node, ctx: LayoutContext, signature: string, depth: number): LayoutBox {
  return {
    id: node.id ?? `${node.type}-${ctx.autoId++}`,
    nodeId: node.id,
    type: node.type,
    label: node.label,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zIndex: depth,
    tone: resolveTone(node),
    props: node.props ? { ...node.props } : undefined,
    signature,
  };
}

function getLeafSize(node: Node, constraints: LayoutConstraints): { width: number; height: number } {
  const explicitWidth = typeof node.props?.w === 'number' ? node.props.w : undefined;
  const explicitHeight = typeof node.props?.h === 'number' ? node.props.h : undefined;

  const defaultSize = DEFAULT_LEAF_SIZES[node.type] ?? { width: 160, height: 48 };
  const width = Math.min(constraints.assignedWidth ?? explicitWidth ?? defaultSize.width, constraints.availableWidth);
  const height = constraints.assignedHeight ?? explicitHeight ?? defaultSize.height;

  return {
    width: Math.max(0, width),
    height: Math.max(0, height),
  };
}

const isStackLike = (node: Node): boolean => STACK_TYPES.has(node.type);

export function layoutDocument(document: Document, options: LayoutOptions = {}): LayoutResult {
  const unit = options.unit ?? DEFAULT_UNIT;
  const viewportWidth = options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH;
  const viewportHeight = options.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
  const rootGap = (options.rootGapUnits ?? DEFAULT_ROOT_GAP_UNITS) * unit;
  const diagnostics = new DiagnosticCollector(options.diagnosticsLimit ?? 10);

  const ctx: LayoutContext = {
    unit,
    viewportWidth,
    viewportHeight,
    memo: options.memo,
    diagnostics,
    warningCount: 0,
    collisionCount: 0,
    memoHitCount: 0,
    autoId: 0,
    nodeCount: 0,
  };

  const boxes: LayoutBox[] = [];
  let yCursor = 0;

  const startTime = performance.now();

  for (const node of document.nodes) {
    const box = layoutNode(node, { availableWidth: viewportWidth, availableHeight: viewportHeight }, ctx, 0);
    offsetBox(box, 0, yCursor);
    boxes.push(box);
    yCursor += box.height + rootGap;
  }

  const layoutTimeMs = performance.now() - startTime;
  const diagnosticsList = diagnostics.getAll();
  const warningCount = diagnosticsList.filter((d) => d.severity === 'warning').length;

  if (process.env.NODE_ENV !== 'test') {
    const parseTimeMs = options.parseTimeMs ?? 0;
    console.log(
      `[Layout] Layout time: ${layoutTimeMs.toFixed(2)}ms (parse+layout ${(layoutTimeMs + parseTimeMs).toFixed(2)}ms, nodes: ${ctx.nodeCount})`,
    );
  }

  return {
    boxes,
    diagnostics: diagnosticsList,
    metrics: {
      layoutTimeMs,
      nodeCount: ctx.nodeCount,
      warningCount,
      collisionCount: ctx.collisionCount,
      memoHitCount: ctx.memoHitCount,
    },
  };
}

function layoutNode(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
): LayoutBox {
  ctx.nodeCount++;
  const signature = createLayoutSignature(node);

  if (ctx.memo?.get) {
    const cached = ctx.memo.get(signature);
    if (cached) {
      ctx.memoHitCount++;
      return cloneBox(cached);
    }
  }

  let box: LayoutBox;

  if (node.type === 'grid') {
    box = layoutGrid(node, constraints, ctx, depth, signature);
  } else if (node.type === 'hstack') {
    box = layoutHStack(node, constraints, ctx, depth, signature);
  } else if (node.type === 'vstack') {
    box = layoutVStack(node, constraints, ctx, depth, signature);
  } else if (node.type === 'zstack') {
    box = layoutZStack(node, constraints, ctx, depth, signature);
  } else if (isStackLike(node) && node.children) {
    // section/card behave like vertical stacks with padding defaults
    box = layoutVStack(node, constraints, ctx, depth, signature);
  } else {
    box = layoutLeaf(node, constraints, ctx, depth, signature);
  }

  if (ctx.memo?.set) {
    ctx.memo.set(signature, cloneBox(box));
  }

  return box;
}

function layoutLeaf(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
  signature: string,
): LayoutBox {
  const size = getLeafSize(node, constraints);
  const box = createBaseBox(node, ctx, signature, depth);
  box.width = size.width;
  box.height = size.height;
  return box;
}

function resolveContainerWidth(node: Node, constraints: LayoutConstraints): number {
  if (constraints.assignedWidth !== undefined) {
    return constraints.assignedWidth;
  }
  if (typeof node.props?.w === 'number') {
    return Math.min(node.props.w, constraints.availableWidth);
  }
  if (!isContainerNode(node)) {
    const defaultSize = DEFAULT_LEAF_SIZES[node.type];
    if (defaultSize) {
      return Math.min(defaultSize.width, constraints.availableWidth);
    }
  }
  return constraints.availableWidth;
}

function layoutVStack(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
  signature: string,
): LayoutBox {
  const box = createBaseBox(node, ctx, signature, depth);
  const alignment = parseAlignment(node.props?.at);

  const width = resolveContainerWidth(node, constraints);
  const pad = toPx(typeof node.props?.pad === 'number' ? node.props.pad : getDefaultPadUnits(node), ctx);
  const gap = toPx(typeof node.props?.gap === 'number' ? node.props.gap : 0, ctx);
  const contentWidth = Math.max(0, width - pad * 2);

  if (!node.children || node.children.length === 0) {
    box.width = width;
    box.height = pad * 2;
    box.children = [];
    return box;
  }

  const childBoxes: LayoutBox[] = [];
  let cursorY = pad;
  let maxChildWidth = 0;

  const crossStretch = alignment.horizontal === 'stretch';

  for (const child of node.children ?? []) {
    const childConstraints: LayoutConstraints = {
      availableWidth: contentWidth,
      availableHeight: constraints.availableHeight,
      assignedWidth: crossStretch ? contentWidth : undefined,
    };
    const childBox = layoutNode(child, childConstraints, ctx, depth + 1);
    maxChildWidth = Math.max(maxChildWidth, childBox.width);

    const offsetX = pad + alignOffset(
      alignment.horizontal === 'stretch' ? 'start' : alignment.horizontal,
      contentWidth,
      crossStretch ? contentWidth : childBox.width,
    );
    offsetBox(childBox, offsetX, cursorY);
    childBoxes.push(childBox);
    cursorY += childBox.height + gap;
  }

  if (childBoxes.length > 0) {
    cursorY -= gap;
  }

  const heightWithoutExplicit = cursorY + pad;
  const explicitHeight = constraints.assignedHeight ?? (typeof node.props?.h === 'number' ? node.props.h : undefined);
  const finalHeight = explicitHeight !== undefined ? Math.max(explicitHeight, pad * 2) : heightWithoutExplicit;
  const verticalFreeSpace = Math.max(0, finalHeight - heightWithoutExplicit);
  const verticalShift = alignment.vertical === 'center'
    ? verticalFreeSpace / 2
    : alignment.vertical === 'end'
      ? verticalFreeSpace
      : 0;

  if (verticalShift && childBoxes.length > 0) {
    for (const childBox of childBoxes) {
      offsetBox(childBox, 0, verticalShift);
    }
  }

  box.width = width;
  box.height = finalHeight;
  box.children = childBoxes;
  return box;
}

function layoutHStack(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
  signature: string,
): LayoutBox {
  const box = createBaseBox(node, ctx, signature, depth);
  const alignment = parseAlignment(node.props?.at);
  const width = resolveContainerWidth(node, constraints);
  const pad = toPx(typeof node.props?.pad === 'number' ? node.props.pad : getDefaultPadUnits(node), ctx);
  const gap = toPx(typeof node.props?.gap === 'number' ? node.props.gap : 0, ctx);
  const contentWidth = Math.max(0, width - pad * 2);

  if (!node.children || node.children.length === 0) {
    box.width = width;
    box.height = pad * 2;
    box.children = [];
    return box;
  }

  const childCount = node.children.length;
  const baseWidths: number[] = [];
  const growIndexes: number[] = [];
  const shrinkIndexes: number[] = [];

  for (let i = 0; i < childCount; i++) {
    const child = node.children[i]!;
    const childSize = getLeafLikeWidth(child, contentWidth);
    baseWidths.push(childSize);
    if (child.props?.grow === true) {
      growIndexes.push(i);
    }
    if (child.props?.shrink === true) {
      shrinkIndexes.push(i);
    }
  }

  const totalGap = gap * Math.max(childCount - 1, 0);
  const baseTotal = baseWidths.reduce((sum, value) => sum + value, 0);
  const delta = contentWidth - baseTotal - totalGap;
  const widths = [...baseWidths];

  if (delta > 0 && growIndexes.length > 0) {
    const share = delta / growIndexes.length;
    for (const index of growIndexes) {
      widths[index] = (widths[index] ?? 0) + share;
    }
  } else if (delta < 0 && shrinkIndexes.length > 0) {
    const shrinkShare = Math.abs(delta) / shrinkIndexes.length;
    for (const index of shrinkIndexes) {
      widths[index] = Math.max(0, (widths[index] ?? 0) - shrinkShare);
    }
  }

  const explicitHeight = constraints.assignedHeight ?? (typeof node.props?.h === 'number' ? node.props.h : undefined);
  const contentHeightTarget = explicitHeight !== undefined ? Math.max(0, explicitHeight - pad * 2) : undefined;

  const placements: { box: LayoutBox; assignedWidth: number; x: number }[] = [];
  let cursorX = pad;

  const totalContentWidth = widths.reduce((sum, value) => sum + value, 0) + totalGap;
  const extraSpace = Math.max(0, contentWidth - totalContentWidth);
  const horizontalShift = alignment.horizontal === 'center'
    ? extraSpace / 2
    : alignment.horizontal === 'end'
      ? extraSpace
      : 0;
  cursorX += horizontalShift;

  for (let i = 0; i < childCount; i++) {
    const child = node.children[i]!;
    const assignedWidth = widths[i]!;
    const childConstraints: LayoutConstraints = {
      availableWidth: assignedWidth,
      assignedWidth,
      availableHeight: contentHeightTarget,
      assignedHeight: alignment.vertical === 'stretch' && contentHeightTarget !== undefined ? contentHeightTarget : undefined,
    };
    const childBox = layoutNode(child, childConstraints, ctx, depth + 1);
    placements.push({ box: childBox, assignedWidth, x: cursorX });
    cursorX += assignedWidth + gap;
  }

  const measuredContentHeight = placements.reduce((max, placement) => Math.max(max, placement.box.height), 0);
  const containerContentHeight = contentHeightTarget !== undefined
    ? Math.max(contentHeightTarget, measuredContentHeight)
    : measuredContentHeight;
  const finalHeight = containerContentHeight + pad * 2;

  for (const placement of placements) {
    const childBox = placement.box;
    const freeSpace = Math.max(0, containerContentHeight - childBox.height);
    let offsetY = pad;
    if (alignment.vertical === 'center') {
      offsetY += freeSpace / 2;
    } else if (alignment.vertical === 'end') {
      offsetY += freeSpace;
    }
    offsetBox(childBox, placement.x, offsetY);
  }

  box.width = width;
  box.height = finalHeight;
  box.children = placements.map((placement) => placement.box);
  return box;
}

function getLeafLikeWidth(child: Node, availableWidth: number): number {
  if (typeof child.props?.w === 'number') {
    return Math.min(child.props.w, availableWidth);
  }
  if (isContainerNode(child)) {
    return availableWidth;
  }
  const defaultSize = DEFAULT_LEAF_SIZES[child.type]?.width ?? 160;
  return Math.min(defaultSize, availableWidth);
}

function layoutZStack(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
  signature: string,
): LayoutBox {
  const box = createBaseBox(node, ctx, signature, depth);
  const width = resolveContainerWidth(node, constraints);
  const pad = toPx(typeof node.props?.pad === 'number' ? node.props.pad : getDefaultPadUnits(node), ctx);
  const contentWidth = Math.max(0, width - pad * 2);

  if (!node.children || node.children.length === 0) {
    box.width = width;
    box.height = pad * 2;
    box.children = [];
    return box;
  }

  let maxHeight = 0;
  let childZ = depth + 1;
  const childBoxes: LayoutBox[] = [];

  for (const child of node.children) {
    const childConstraints: LayoutConstraints = {
      availableWidth: contentWidth,
      assignedWidth: contentWidth,
      availableHeight: constraints.availableHeight,
    };
    const childBox = layoutNode(child, childConstraints, ctx, childZ++);
    maxHeight = Math.max(maxHeight, childBox.height);
    offsetBox(childBox, pad, pad);
    childBoxes.push(childBox);
  }

  box.width = width;
  box.height = maxHeight + pad * 2;
  box.children = childBoxes;
  return box;
}

interface GridPlacement {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  width: number;
  box: LayoutBox;
}

function layoutGrid(
  node: Node,
  constraints: LayoutConstraints,
  ctx: LayoutContext,
  depth: number,
  signature: string,
): LayoutBox {
  const box = createBaseBox(node, ctx, signature, depth);
  if (!node.children || node.children.length === 0) {
    box.width = resolveContainerWidth(node, constraints);
    box.height = 0;
    box.children = [];
    return box;
  }

  const width = resolveContainerWidth(node, constraints);
  const cols = typeof node.props?.cols === 'number' ? Math.min(Math.max(1, node.props.cols), 24) : 12;
  const pad = toPx(typeof node.props?.pad === 'number' ? node.props.pad : 0, ctx);
  const gap = toPx(typeof node.props?.gap === 'number' ? node.props.gap : 0, ctx);
  const innerWidth = Math.max(0, width - pad * 2);
  const totalGapWidth = gap * Math.max(cols - 1, 0);
  const colWidth = cols > 0 ? Math.max(0, (innerWidth - totalGapWidth) / cols) : 0;

  const placements: GridPlacement[] = [];
  const occupancy: number[][] = [];

  const ensureRows = (count: number) => {
    while (occupancy.length < count) {
      occupancy.push(new Array(cols).fill(0));
    }
  };

  const markOccupied = (row: number, col: number, rowSpan: number, colSpan: number) => {
    ensureRows(row + rowSpan);
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (occupancy[r]![c] === 1) {
          ctx.collisionCount++;
          addWarning(ctx, `Overlapping grid placement at row ${r + 1}, col ${c + 1}`, ErrorCode.INVALID_PLACEMENT_COMBINATION);
        }
        occupancy[r]![c] = 1;
      }
    }
  };

  const findSlot = (row: number, colSpan: number, rowSpan: number, startCol?: number): { row: number; col: number } => {
    let currentRow = Math.max(0, row);
    while (true) {
      ensureRows(currentRow + rowSpan);
      const colStart = startCol !== undefined ? startCol : findColumnForRow(currentRow, colSpan, rowSpan);
      if (colStart !== -1) {
        return { row: currentRow, col: colStart };
      }
      currentRow++;
    }
  };

  const findColumnForRow = (rowIndex: number, colSpan: number, rowSpan: number): number => {
    for (let colIndex = 0; colIndex <= cols - colSpan; colIndex++) {
      let fits = true;
      for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
        ensureRows(r + 1);
        for (let c = colIndex; c < colIndex + colSpan; c++) {
          if (occupancy[r]![c] === 1) {
            fits = false;
            break;
          }
        }
        if (!fits) {
          break;
        }
      }
      if (fits) {
        return colIndex;
      }
    }
    return -1;
  };

  for (const child of node.children) {
    const place = child.place ?? {};
    let span = Math.max(1, place.s ?? 1);
    if (span > cols) {
      addWarning(ctx, `Span s${span} exceeds grid cols ${cols}`, ErrorCode.PLACEMENT_OUT_OF_BOUNDS);
      span = cols;
    }
    let startColumn = place.c !== undefined ? Math.max(1, place.c) - 1 : undefined;
    if (startColumn !== undefined && startColumn + span > cols) {
      addWarning(
        ctx,
        `Grid placement @c${place.c} s${span} exceeds grid width (${cols} cols)`,
        ErrorCode.PLACEMENT_OUT_OF_BOUNDS,
      );
      startColumn = Math.max(0, cols - span);
    }

    let rowSpan = Math.max(1, place.rs ?? 1);
    let startRow = place.r !== undefined ? Math.max(1, place.r) - 1 : 0;

    if (place.r !== undefined && startRow < 0) {
      addWarning(ctx, `Row start r${place.r} must be >= 1`, ErrorCode.PLACEMENT_OUT_OF_BOUNDS);
      startRow = 0;
    }

    const slot = findSlot(startRow, span, rowSpan, startColumn);
    markOccupied(slot.row, slot.col, rowSpan, span);

    const childWidth = span * colWidth + gap * Math.max(span - 1, 0);
    const childConstraints: LayoutConstraints = {
      availableWidth: childWidth,
      assignedWidth: childWidth,
      availableHeight: constraints.availableHeight,
    };
    const childBox = layoutNode(child, childConstraints, ctx, depth + 1);
    placements.push({
      row: slot.row,
      col: slot.col,
      rowSpan,
      colSpan: span,
      width: childWidth,
      box: childBox,
    });
  }

  const totalRows = occupancy.length;
  const rowHeights = new Array(totalRows).fill(0);
  for (const placement of placements) {
    const perRowHeight = placement.box.height / placement.rowSpan;
    for (let r = 0; r < placement.rowSpan; r++) {
      const rowIndex = placement.row + r;
      rowHeights[rowIndex] = Math.max(rowHeights[rowIndex], perRowHeight);
    }
  }

  const rowOffsets: number[] = [];
  let cursorY = pad;
  for (let r = 0; r < rowHeights.length; r++) {
    rowOffsets[r] = cursorY;
    cursorY += rowHeights[r] + gap;
  }
  if (rowOffsets.length > 0) {
    cursorY -= gap;
  }

  for (const placement of placements) {
    const x = pad + placement.col * (colWidth + gap);
    const y = rowOffsets[placement.row] ?? pad;
    offsetBox(placement.box, x, y);
  }

  box.width = width;
  box.height = cursorY + pad;
  box.children = placements.map((p) => p.box);
  return box;
}
