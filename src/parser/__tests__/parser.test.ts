/**
 * Parser tests
 */

import { describe, it, expect } from 'vitest';
import { parseDocument } from '../parser.js';
import { ErrorCode } from '../../errors/index.js';

describe('Parser', () => {
  describe('Basic component parsing', () => {
    it('parses simple component', () => {
      const input = 'button "Click me"\n';
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(1);
      expect(result.document.nodes[0]!.type).toBe('button');
      expect(result.document.nodes[0]!.label).toBe('Click me');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses component without label', () => {
      const input = 'spacer\n';
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(1);
      expect(result.document.nodes[0]!.type).toBe('spacer');
      expect(result.document.nodes[0]!.label).toBeUndefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reports error for missing label on text component', () => {
      const input = 'text\n';
      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.MISSING_LABEL);
    });

    it('parses component with ID', () => {
      const input = 'button "Submit" #submit-btn\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.id).toBe('submit-btn');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses component with classes', () => {
      const input = 'button "Submit" .primary .large\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.classes).toEqual(['primary', 'large']);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses component with ID and classes', () => {
      const input = 'button "Submit" #submit .primary .large\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.id).toBe('submit');
      expect(result.document.nodes[0]!.classes).toEqual(['primary', 'large']);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reports error for duplicate IDs', () => {
      const input = `button "First" #btn
button "Second" #btn
`;
      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.DUPLICATE_ID);
      expect(result.diagnostics[0]!.message).toContain('Duplicate ID');
    });
  });

  describe('Property parsing', () => {
    it('parses key:value properties', () => {
      const input = 'grid cols:12 gap:4\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.props).toEqual({
        cols: 12,
        gap: 4,
      });
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses boolean properties', () => {
      const input = 'button "Submit" grow\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.props).toEqual({
        grow: true,
      });
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses mixed properties', () => {
      const input = 'button "Submit" tone:brand grow\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.props).toEqual({
        tone: 'brand',
        grow: true,
      });
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses string property values', () => {
      const input = 'input "Email" type:email\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.props).toEqual({
        type: 'email',
      });
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Placement token parsing', () => {
    it('parses column placement', () => {
      const input = 'button "Submit" @c9 s4\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.place).toEqual({
        c: 9,
        s: 4,
      });
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses row placement', () => {
      const input = 'button "Submit" @c1 s6 r2 rs3\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.place).toEqual({
        c: 1,
        s: 6,
        r: 2,
        rs: 3,
      });
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses partial placement', () => {
      const input = 'button "Submit" @c5\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.place).toEqual({
        c: 5,
      });
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Children parsing with INDENT/DEDENT', () => {
    it('parses container with children', () => {
      const input = `grid cols:12
  button "Submit"
  button "Cancel"
`;
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(1);
      expect(result.document.nodes[0]!.type).toBe('grid');
      expect(result.document.nodes[0]!.children).toHaveLength(2);
      expect(result.document.nodes[0]!.children![0]!.type).toBe('button');
      expect(result.document.nodes[0]!.children![1]!.type).toBe('button');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses nested containers', () => {
      const input = `card "Login"
  vstack gap:4
    text "Welcome"
    button "Login"
`;
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(1);
      const card = result.document.nodes[0]!;
      expect(card.type).toBe('card');
      expect(card.children).toHaveLength(1);

      const vstack = card.children![0]!;
      expect(vstack.type).toBe('vstack');
      expect(vstack.children).toHaveLength(2);
      expect(vstack.children![0]!.type).toBe('text');
      expect(vstack.children![1]!.type).toBe('button');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses empty container', () => {
      const input = 'grid cols:12\n';
      const result = parseDocument(input);

      expect(result.document.nodes[0]!.children).toBeUndefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    it('parses multiple root nodes', () => {
      const input = `button "First"
spacer
text "Second"
`;
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(3);
      expect(result.document.nodes[0]!.type).toBe('button');
      expect(result.document.nodes[1]!.type).toBe('spacer');
      expect(result.document.nodes[2]!.type).toBe('text');
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Error handling and recovery', () => {
    it('recovers from unexpected token', () => {
      const input = `button "First"
invalid-token
button "Second"
`;
      const result = parseDocument(input);

      // Should recover and parse second button
      expect(result.document.nodes).toHaveLength(2);
      expect(result.document.nodes[0]!.type).toBe('button');
      expect(result.document.nodes[1]!.type).toBe('button');
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    it('handles missing label gracefully', () => {
      const input = `button "First"
text
button "Third"
`;
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(3);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.MISSING_LABEL);
    });

    it('continues parsing after error', () => {
      const input = `button "First" #id
button "Second" #id
button "Third"
`;
      const result = parseDocument(input);

      expect(result.document.nodes).toHaveLength(3);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.DUPLICATE_ID);
    });
  });

  describe('Node count tracking', () => {
    it('warns at 300 nodes', () => {
      // Generate 300 nodes
      const lines = Array.from({ length: 300 }, (_, i) => `spacer`).join('\n');
      const input = lines + '\n';

      const result = parseDocument(input);

      expect(result.metrics.nodeCount).toBe(300);
      expect(result.diagnostics.some(d => d.code === ErrorCode.NODE_COUNT_WARNING)).toBe(true);
    });

    it('errors at 1000 nodes', () => {
      // Generate 1000 nodes
      const lines = Array.from({ length: 1000 }, (_, i) => `spacer`).join('\n');
      const input = lines + '\n';

      const result = parseDocument(input);

      expect(result.metrics.nodeCount).toBe(1000);
      expect(result.diagnostics.some(d => d.code === ErrorCode.NODE_COUNT_LIMIT)).toBe(true);
    });

    it('respects custom node count options', () => {
      const lines = Array.from({ length: 50 }, () => 'spacer').join('\n');
      const input = lines + '\n';

      const result = parseDocument(input, {
        warnThreshold: 50,
        maxNodes: 100,
      });

      expect(result.metrics.nodeCount).toBe(50);
      expect(result.diagnostics.some(d => d.code === ErrorCode.NODE_COUNT_WARNING)).toBe(true);
    });
  });

  describe('Complete DSL examples', () => {
    it('parses login form', () => {
      const input = `card "Login" #login-card .auth
  vstack gap:4 pad:6
    text "Welcome back"
    input "Email" type:email
    input "Password" type:password
    hstack gap:2
      button "Cancel" shrink
      button "Login" tone:brand grow
`;

      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(0);
      expect(result.document.nodes).toHaveLength(1);

      const card = result.document.nodes[0]!;
      expect(card.type).toBe('card');
      expect(card.label).toBe('Login');
      expect(card.id).toBe('login-card');
      expect(card.classes).toEqual(['auth']);

      const vstack = card.children![0]!;
      expect(vstack.type).toBe('vstack');
      expect(vstack.props).toEqual({ gap: 4, pad: 6 });
      expect(vstack.children).toHaveLength(4); // text, input, input, hstack
    });

    it('parses grid layout', () => {
      const input = `grid cols:12 gap:4
  text "Header" @c1 s12
  button "A" @c1 s6
  button "B" @c7 s6
  text "Footer" @c1 s12
`;

      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(0);
      expect(result.document.nodes).toHaveLength(1);

      const grid = result.document.nodes[0]!;
      expect(grid.type).toBe('grid');
      expect(grid.props).toEqual({ cols: 12, gap: 4 });
      expect(grid.children).toHaveLength(4);

      expect(grid.children![0]!.place).toEqual({ c: 1, s: 12 });
      expect(grid.children![1]!.place).toEqual({ c: 1, s: 6 });
      expect(grid.children![2]!.place).toEqual({ c: 7, s: 6 });
    });

    it('parses dashboard with nested grids', () => {
      const input = `section
  grid cols:12 gap:4
    card "Stats" @c1 s3
      text "100 users"
    card "Chart" @c4 s9
      text "Revenue chart"
    card "Activity" @c1 s12
      text "Recent activity"
`;

      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(0);
      expect(result.document.nodes).toHaveLength(1);

      const section = result.document.nodes[0]!;
      expect(section.type).toBe('section');

      const grid = section.children![0]!;
      expect(grid.type).toBe('grid');
      expect(grid.children).toHaveLength(3);
    });
  });

  describe('Parse metrics', () => {
    it('reports parse time', () => {
      const input = 'button "Test"\n';
      const result = parseDocument(input);

      expect(result.metrics.parseTimeMs).toBeGreaterThan(0);
      expect(result.metrics.nodeCount).toBe(1);
      expect(result.metrics.diagnosticCount).toBe(0);
      expect(result.metrics.errorCount).toBe(0);
      expect(result.metrics.warningCount).toBe(0);
    });

    it('reports diagnostic counts', () => {
      const input = `text
button "Second" #id
button "Third" #id
`;
      const result = parseDocument(input);

      expect(result.metrics.diagnosticCount).toBe(2);
      expect(result.metrics.errorCount).toBe(2);
    });
  });

  describe('Style block parsing', () => {
    it('captures style rules and top-level variables', () => {
      const input = `let primaryGap = 2
style default {
  gap: $primaryGap
  skin: clean
}

style .primary {
  tone: brand
}

button "Test"
`;

      const result = parseDocument(input);

      expect(result.document.variables['primaryGap']).toBe(2);
      expect(result.document.styles).toHaveLength(2);
      expect(result.document.styles[0]!.selector.type).toBe('default');
      expect(result.document.styles[0]!.declarations['gap']).toBe(2);
      expect(result.document.styles[1]!.selector).toEqual({ type: 'class', name: 'primary' });
      expect(result.document.styles[1]!.declarations['tone']).toBe('brand');
      expect(result.diagnostics).toHaveLength(0);
    });

    it('scopes let statements inside style blocks', () => {
      const input = `style default {
  let stackPad = 3
  pad: $stackPad
}
`;
      const result = parseDocument(input);

      expect(result.document.styles[0]!.declarations['pad']).toBe(3);
      expect(result.document.variables['stackPad']).toBeUndefined();
    });

    it('reports undefined variables in style declarations', () => {
      const input = `style default {
  gap: $missingValue
}`;
      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.UNDEFINED_VARIABLE);
    });

    it('warns on unsupported style properties', () => {
      const input = `style default {
  padding: 2
}`;
      const result = parseDocument(input);

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]!.code).toBe(ErrorCode.INVALID_PROPERTY);
      expect(result.document.styles[0]!.declarations).not.toHaveProperty('padding');
    });
  });

  describe('Stub features (when)', () => {
    it('recognizes when blocks (stubbed)', () => {
      const input = `when >768 {}
button "Test"
`;
      const result = parseDocument(input);

      // When blocks are still stubbed
      expect(result.document.nodes).toHaveLength(1);
      expect(result.document.nodes[0]!.type).toBe('button');
    });
  });
});
