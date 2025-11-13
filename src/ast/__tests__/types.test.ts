import { describe, it, expect } from 'vitest';
import {
  createDocument,
  createNode,
  createStyleRule,
  isContainerNode,
  hasPlacement,
  type Node,
} from '../types.js';

describe('AST Types', () => {
  describe('createDocument', () => {
    it('creates an empty document with defaults', () => {
      const doc = createDocument();

      expect(doc.version).toBe('1.0');
      expect(doc.nodes).toEqual([]);
      expect(doc.styles).toEqual([]);
      expect(doc.variables).toEqual({});
      expect(doc.breakpoints).toEqual([]);
    });
  });

  describe('createNode', () => {
    it('creates a node with type only', () => {
      const node = createNode('button');

      expect(node.type).toBe('button');
      expect(node.label).toBeUndefined();
      expect(node.children).toBeUndefined();
    });

    it('creates a node with type and label', () => {
      const node = createNode('button', 'Click me');

      expect(node.type).toBe('button');
      expect(node.label).toBe('Click me');
    });

    it('can add properties to created node', () => {
      const node = createNode('button', 'Submit');
      node.props = { tone: 'primary' };
      node.id = 'submit-btn';

      expect(node.props?.['tone']).toBe('primary');
      expect(node.id).toBe('submit-btn');
    });
  });

  describe('createStyleRule', () => {
    it('creates a default selector style rule', () => {
      const rule = createStyleRule({ type: 'default' }, { skin: 'clean' });

      expect(rule.selector.type).toBe('default');
      expect(rule.declarations['skin']).toBe('clean');
    });

    it('creates a type selector style rule', () => {
      const rule = createStyleRule(
        { type: 'type', name: 'button' },
        { fill: 'brand' },
      );

      expect(rule.selector.type).toBe('type');
      expect(rule.selector).toHaveProperty('name', 'button');
      expect(rule.declarations['fill']).toBe('brand');
    });

    it('creates a class selector style rule', () => {
      const rule = createStyleRule(
        { type: 'class', name: 'heading' },
        { text: 'brand' },
      );

      expect(rule.selector.type).toBe('class');
      expect(rule.selector).toHaveProperty('name', 'heading');
    });

    it('creates an id selector style rule', () => {
      const rule = createStyleRule(
        { type: 'id', name: 'submit' },
        { fill: 'brand', text: 'white' },
      );

      expect(rule.selector.type).toBe('id');
      expect(rule.selector).toHaveProperty('name', 'submit');
      expect(rule.declarations['fill']).toBe('brand');
      expect(rule.declarations['text']).toBe('white');
    });
  });

  describe('isContainerNode', () => {
    it('returns true for container types', () => {
      expect(isContainerNode(createNode('grid'))).toBe(true);
      expect(isContainerNode(createNode('hstack'))).toBe(true);
      expect(isContainerNode(createNode('vstack'))).toBe(true);
      expect(isContainerNode(createNode('zstack'))).toBe(true);
      expect(isContainerNode(createNode('section'))).toBe(true);
      expect(isContainerNode(createNode('card'))).toBe(true);
      expect(isContainerNode(createNode('list'))).toBe(true);
      expect(isContainerNode(createNode('tabs'))).toBe(true);
    });

    it('returns false for non-container types', () => {
      expect(isContainerNode(createNode('button'))).toBe(false);
      expect(isContainerNode(createNode('text'))).toBe(false);
      expect(isContainerNode(createNode('input'))).toBe(false);
      expect(isContainerNode(createNode('image'))).toBe(false);
      expect(isContainerNode(createNode('icon'))).toBe(false);
      expect(isContainerNode(createNode('spacer'))).toBe(false);
    });
  });

  describe('hasPlacement', () => {
    it('returns true for nodes with placement', () => {
      const node = createNode('card');
      node.place = { c: 5, s: 4 };

      expect(hasPlacement(node)).toBe(true);
    });

    it('returns false for nodes without placement', () => {
      const node = createNode('card');

      expect(hasPlacement(node)).toBe(false);
    });

    it('narrows type when placement exists', () => {
      const node: Node = createNode('card');
      node.place = { c: 5, s: 4, r: 2 };

      if (hasPlacement(node)) {
        // Type should be narrowed to include place property
        expect(node.place.c).toBe(5);
        expect(node.place.s).toBe(4);
        expect(node.place.r).toBe(2);
      }
    });
  });

  describe('PlacementTokens', () => {
    it('allows all placement properties', () => {
      const node = createNode('card');
      node.place = {
        c: 5, // column start
        s: 4, // span
        r: 2, // row
        rs: 3, // row span
      };

      expect(node.place.c).toBe(5);
      expect(node.place.s).toBe(4);
      expect(node.place.r).toBe(2);
      expect(node.place.rs).toBe(3);
    });

    it('allows partial placement properties', () => {
      const node = createNode('card');
      node.place = { c: 5 }; // Only column

      expect(node.place.c).toBe(5);
      expect(node.place.s).toBeUndefined();
    });
  });

  describe('Document structure', () => {
    it('can build a complete document', () => {
      const doc = createDocument();

      // Add nodes
      const grid = createNode('grid');
      grid.props = { cols: 12, gap: 2 };

      const card = createNode('card', 'Login');
      card.id = 'auth';
      card.place = { c: 5, s: 4 };

      grid.children = [card];
      doc.nodes.push(grid);

      // Add style rule
      const styleRule = createStyleRule(
        { type: 'default' },
        { skin: 'clean', 'color.brand': '#6D28D9' },
      );
      doc.styles.push(styleRule);

      // Add variable
      doc.variables['primaryGap'] = 2;

      // Verify structure
      expect(doc.nodes).toHaveLength(1);
      expect(doc.nodes[0]?.type).toBe('grid');
      expect(doc.nodes[0]?.children).toHaveLength(1);
      expect(doc.nodes[0]?.children?.[0]?.type).toBe('card');
      expect(doc.styles).toHaveLength(1);
      expect(doc.variables['primaryGap']).toBe(2);
    });

    it('can add breakpoints to document', () => {
      const doc = createDocument();

      doc.breakpoints = [
        {
          condition: '<600',
          nodes: [createNode('vstack')],
        },
        {
          condition: '>=600',
          nodes: [createNode('grid')],
        },
      ];

      expect(doc.breakpoints).toHaveLength(2);
      expect(doc.breakpoints[0]?.condition).toBe('<600');
      expect(doc.breakpoints[1]?.condition).toBe('>=600');
    });
  });

  describe('Node properties', () => {
    it('supports all node properties', () => {
      const node = createNode('button', 'Click me');
      node.id = 'submit';
      node.classes = ['primary', 'large'];
      node.props = {
        tone: 'primary',
        grow: true,
      };
      node.place = { c: 5, s: 2 };

      expect(node.type).toBe('button');
      expect(node.label).toBe('Click me');
      expect(node.id).toBe('submit');
      expect(node.classes).toEqual(['primary', 'large']);
      expect(node.props?.['tone']).toBe('primary');
      expect(node.props?.['grow']).toBe(true);
      expect(node.place?.c).toBe(5);
    });

    it('supports nested children', () => {
      const grid = createNode('grid');
      const card = createNode('card', 'Container');
      const button = createNode('button', 'Action');

      card.children = [button];
      grid.children = [card];

      expect(grid.children).toHaveLength(1);
      expect(grid.children?.[0]?.type).toBe('card');
      expect(grid.children?.[0]?.children?.[0]?.type).toBe('button');
    });
  });
});
