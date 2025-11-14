import { describe, it, expect } from 'vitest';
import { parseDocument } from '../../parser/parser.js';
import { layoutDocument } from '../engine.js';
import { ErrorCode } from '../../errors/index.js';

const defaultOptions = { viewportWidth: 640, unit: 8 } as const;

describe('layoutDocument', () => {
  it('positions grid children using placement tokens', () => {
    const input = `grid cols:4
  button "Primary" @c1 s2
  button "Ghost" @c3 s2
`;
    const result = parseDocument(input);
    const layout = layoutDocument(result.document, { ...defaultOptions });

    expect(layout.boxes).toHaveLength(1);
    const grid = layout.boxes[0]!;
    expect(grid.width).toBe(640);
    expect(grid.children).toHaveLength(2);

    const [primary, ghost] = grid.children!;
    expect(primary.x).toBeCloseTo(0);
    expect(primary.width).toBeCloseTo(320);
    expect(ghost.x).toBeCloseTo(320);
    expect(ghost.width).toBeCloseTo(320);
  });

  it('distributes hstack space with grow + gap', () => {
    const input = `hstack gap:1 pad:1
  button "Cancel"
  button "Submit" grow
`;
    const result = parseDocument(input);
    const layout = layoutDocument(result.document, { viewportWidth: 400, unit: 8 });

    const stack = layout.boxes[0]!;
    expect(stack.width).toBe(400);
    const [cancel, submit] = stack.children!;

    expect(cancel.x).toBeCloseTo(8);
    expect(cancel.width).toBeCloseTo(144);
    expect(submit.x).toBeCloseTo(160);
    expect(submit.width).toBeCloseTo(232);
  });

  it('lays out nested grid inside vstack preserving offsets', () => {
    const input = `vstack gap:1 pad:1
  text "Header"
  grid cols:2 gap:1
    button "A" @c1 s1
    button "B" @c2 s1
`;
    const result = parseDocument(input);
    const layout = layoutDocument(result.document, { viewportWidth: 480, unit: 8 });

    const stack = layout.boxes[0]!;
    expect(stack.children).toHaveLength(2);
    const header = stack.children![0]!;
    const grid = stack.children![1]!;

    expect(header.y).toBeCloseTo(8);
    expect(grid.y).toBeGreaterThan(header.y + header.height);
    expect(grid.children?.[0]?.x).toBeCloseTo(grid.x);
  });

  it('stacks zstack children with increasing z-indices', () => {
    const input = `zstack pad:1
  image "BG"
  card "Overlay"
`;
    const result = parseDocument(input);
    const layout = layoutDocument(result.document, { viewportWidth: 300, unit: 8 });

    const stack = layout.boxes[0]!;
    expect(stack.children).toHaveLength(2);
    const [bg, overlay] = stack.children!;
    expect(overlay.zIndex).toBeGreaterThan(bg.zIndex);
    expect(overlay.y).toBe(bg.y);
  });

  it('emits diagnostics when placement spans exceed grid columns', () => {
    const input = `grid cols:3
  card "Wide" @c3 s3
`;
    const result = parseDocument(input);
    const layout = layoutDocument(result.document, defaultOptions);

    expect(layout.diagnostics.length).toBeGreaterThan(0);
    expect(layout.diagnostics[0]?.code).toBe(ErrorCode.PLACEMENT_OUT_OF_BOUNDS);
  });
});
