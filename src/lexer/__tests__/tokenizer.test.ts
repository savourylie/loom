import { describe, it, expect } from 'vitest';
import { Tokenizer } from '../tokenizer.js';
import { TokenType } from '../tokens.js';

describe('Tokenizer', () => {
  describe('Basic token recognition', () => {
    it('tokenizes component keywords', () => {
      const tokenizer = new Tokenizer('grid card button');
      const tokens = tokenizer.tokenize();

      expect(tokens).toHaveLength(4); // grid, card, button, EOF
      expect(tokens[0]?.type).toBe(TokenType.GRID);
      expect(tokens[1]?.type).toBe(TokenType.CARD);
      expect(tokens[2]?.type).toBe(TokenType.BUTTON);
      expect(tokens[3]?.type).toBe(TokenType.EOF);
    });

    it('tokenizes numbers', () => {
      const tokenizer = new Tokenizer('123 456');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.NUMBER);
      expect(tokens[0]?.value).toBe(123);
      expect(tokens[1]?.type).toBe(TokenType.NUMBER);
      expect(tokens[1]?.value).toBe(456);
    });

    it('tokenizes strings', () => {
      const tokenizer = new Tokenizer('"Hello" "World"');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.STRING);
      expect(tokens[0]?.value).toBe('Hello');
      expect(tokens[1]?.type).toBe(TokenType.STRING);
      expect(tokens[1]?.value).toBe('World');
    });

    it('tokenizes strings with escapes', () => {
      const tokenizer = new Tokenizer('"Hello \\"World\\"" "Line\\nBreak"');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.value).toBe('Hello "World"');
      expect(tokens[1]?.value).toBe('Line\nBreak');
    });

    it('tokenizes newlines', () => {
      const tokenizer = new Tokenizer('card\nbutton');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.CARD);
      expect(tokens[1]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[2]?.type).toBe(TokenType.BUTTON);
    });
  });

  describe('Placement tokens', () => {
    it('tokenizes column placement @c5', () => {
      const tokenizer = new Tokenizer('@c5');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.AT_COLUMN);
      expect(tokens[0]?.value).toBe(5);
      expect(tokens[0]?.raw).toBe('@c5');
    });

    it('tokenizes span s4', () => {
      const tokenizer = new Tokenizer('s4');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.SPAN);
      expect(tokens[0]?.value).toBe(4);
    });

    it('tokenizes row r2', () => {
      const tokenizer = new Tokenizer('r2');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.ROW);
      expect(tokens[0]?.value).toBe(2);
    });

    it('tokenizes row span rs3', () => {
      const tokenizer = new Tokenizer('rs3');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.ROW_SPAN);
      expect(tokens[0]?.value).toBe(3);
    });

    it('tokenizes placement tokens in context', () => {
      const tokenizer = new Tokenizer('card @c5 s4 r2 rs3');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.CARD);
      expect(tokens[1]?.type).toBe(TokenType.AT_COLUMN);
      expect(tokens[2]?.type).toBe(TokenType.SPAN);
      expect(tokens[3]?.type).toBe(TokenType.ROW);
      expect(tokens[4]?.type).toBe(TokenType.ROW_SPAN);
    });
  });

  describe('Properties', () => {
    it('tokenizes property keywords', () => {
      const tokenizer = new Tokenizer('gap: pad: tone:');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.PROP_GAP);
      expect(tokens[1]?.type).toBe(TokenType.COLON);
      expect(tokens[2]?.type).toBe(TokenType.PROP_PAD);
      expect(tokens[3]?.type).toBe(TokenType.COLON);
      expect(tokens[4]?.type).toBe(TokenType.PROP_TONE);
      expect(tokens[5]?.type).toBe(TokenType.COLON);
    });

    it('tokenizes boolean properties', () => {
      const tokenizer = new Tokenizer('grow shrink');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.PROP_GROW);
      expect(tokens[0]?.value).toBe(true);
      expect(tokens[1]?.type).toBe(TokenType.PROP_SHRINK);
      expect(tokens[1]?.value).toBe(true);
    });

    it('tokenizes property with value', () => {
      const tokenizer = new Tokenizer('gap:2 pad:3');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.PROP_GAP);
      expect(tokens[1]?.type).toBe(TokenType.COLON);
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
      expect(tokens[2]?.value).toBe(2);
    });
  });

  describe('Style system', () => {
    it('tokenizes style keywords', () => {
      const tokenizer = new Tokenizer('style let when');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.STYLE);
      expect(tokens[1]?.type).toBe(TokenType.LET);
      expect(tokens[2]?.type).toBe(TokenType.WHEN);
    });

    it('tokenizes default selector', () => {
      const tokenizer = new Tokenizer('default');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.SELECTOR_DEFAULT);
    });

    it('tokenizes type selectors with parentheses', () => {
      const tokenizer = new Tokenizer('type(card)');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0]?.value).toBe('type');
      expect(tokens[1]?.type).toBe(TokenType.LPAREN);
      expect(tokens[2]?.type).toBe(TokenType.CARD);
      expect(tokens[2]?.value).toBe('card');
      expect(tokens[3]?.type).toBe(TokenType.RPAREN);
    });

    it('tokenizes braces for style blocks', () => {
      const tokenizer = new Tokenizer('{ }');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.LBRACE);
      expect(tokens[1]?.type).toBe(TokenType.RBRACE);
    });

    it('tokenizes color references', () => {
      const tokenizer = new Tokenizer('color.brand color.text');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.COLOR_REF);
      expect(tokens[0]?.value).toBe('color.brand');
      expect(tokens[1]?.type).toBe(TokenType.COLOR_REF);
      expect(tokens[1]?.value).toBe('color.text');
    });

    it('tokenizes hex colors', () => {
      const tokenizer = new Tokenizer('#6D28D9 #FFF');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.HEX_COLOR);
      expect(tokens[0]?.value).toBe('#6D28D9');
      expect(tokens[1]?.type).toBe(TokenType.HEX_COLOR);
      expect(tokens[1]?.value).toBe('#FFF');
    });

    it('tokenizes variable references', () => {
      const tokenizer = new Tokenizer('$primaryGap $accentColor');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.VARIABLE_REF);
      expect(tokens[0]?.value).toBe('primaryGap');
      expect(tokens[1]?.type).toBe(TokenType.VARIABLE_REF);
      expect(tokens[1]?.value).toBe('accentColor');
    });
  });

  describe('Comments', () => {
    it('skips line comments', () => {
      const tokenizer = new Tokenizer('card // This is a comment\nbutton');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.CARD);
      expect(tokens[1]?.type).toBe(TokenType.NEWLINE);
      expect(tokens[2]?.type).toBe(TokenType.BUTTON);
      expect(tokens).toHaveLength(4); // card, newline, button, EOF
    });

    it('skips comment at end of file', () => {
      const tokenizer = new Tokenizer('card // Comment');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.CARD);
      expect(tokens[1]?.type).toBe(TokenType.EOF);
    });
  });

  describe('Peek and advance API', () => {
    it('allows peeking at next token', () => {
      const tokenizer = new Tokenizer('card button');

      const peeked = tokenizer.peek();
      expect(peeked.type).toBe(TokenType.CARD);

      const advanced = tokenizer.advance();
      expect(advanced.type).toBe(TokenType.CARD);
    });

    it('allows peeking ahead multiple tokens', () => {
      const tokenizer = new Tokenizer('card button text');

      expect(tokenizer.peek(0).type).toBe(TokenType.CARD);
      expect(tokenizer.peek(1).type).toBe(TokenType.BUTTON);
      expect(tokenizer.peek(2).type).toBe(TokenType.TEXT);

      tokenizer.advance();
      expect(tokenizer.peek(0).type).toBe(TokenType.BUTTON);
    });
  });

  describe('Error handling', () => {
    it('reports unterminated string', () => {
      const tokenizer = new Tokenizer('"unterminated');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.ERROR);
      expect(tokenizer.getErrors()).toHaveLength(1);
      expect(tokenizer.getErrors()[0]?.code).toBe('E001');
    });

    it('reports invalid character', () => {
      const tokenizer = new Tokenizer('card ~ button');
      const tokens = tokenizer.tokenize();

      expect(tokens[1]?.type).toBe(TokenType.ERROR);
      expect(tokenizer.getErrors()).toHaveLength(1);
      expect(tokenizer.getErrors()[0]?.code).toBe('E002');
    });

    it('correctly handles non-hex-color hash patterns', () => {
      // #12345 (5 digits) is not a valid hex color, so tokenize as HASH + NUMBER
      const tokenizer = new Tokenizer('#12345');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.HASH);
      expect(tokens[1]?.type).toBe(TokenType.NUMBER);
      expect(tokens[1]?.value).toBe(12345);
      expect(tokenizer.getErrors()).toHaveLength(0);
    });

    it('tracks line and column for errors', () => {
      const tokenizer = new Tokenizer('card\n"unterminated');
      const tokens = tokenizer.tokenize();

      const errors = tokenizer.getErrors();
      expect(errors[0]?.line).toBe(2);
      expect(errors[0]?.column).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Position tracking', () => {
    it('tracks line numbers', () => {
      const tokenizer = new Tokenizer('card\nbutton\ntext');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.line).toBe(1); // card
      expect(tokens[1]?.line).toBe(1); // newline
      expect(tokens[2]?.line).toBe(2); // button
      expect(tokens[4]?.line).toBe(3); // text
    });

    it('tracks column numbers', () => {
      const tokenizer = new Tokenizer('card button');
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.column).toBe(0);
      expect(tokens[1]?.column).toBeGreaterThan(tokens[0]!.column);
    });
  });

  describe('Complete DSL examples', () => {
    it('tokenizes simple card layout', () => {
      const dsl = `card "Login" #auth pad:3
  button "Sign in" tone:primary`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.CARD);
      expect(tokens[1]?.type).toBe(TokenType.STRING);
      expect(tokens[1]?.value).toBe('Login');
      expect(tokens[2]?.type).toBe(TokenType.HASH);
      expect(tokens[3]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[3]?.value).toBe('auth');

      // Should have no errors
      expect(tokenizer.getErrors()).toHaveLength(0);
    });

    it('tokenizes grid with placement', () => {
      const dsl = `grid cols:12 gap:2
  card @c5 s4 r2`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.GRID);
      expect(tokens[1]?.type).toBe(TokenType.PROP_COLS);
      expect(tokens[2]?.type).toBe(TokenType.COLON);
      expect(tokens[3]?.type).toBe(TokenType.NUMBER);
      expect(tokens[3]?.value).toBe(12);

      // Find placement tokens
      const placementTokens = tokens.filter(
        (t) =>
          t.type === TokenType.AT_COLUMN ||
          t.type === TokenType.SPAN ||
          t.type === TokenType.ROW,
      );
      expect(placementTokens).toHaveLength(3);
    });

    it('tokenizes style block', () => {
      const dsl = `style default {
  skin: clean;
  color.brand: #6D28D9
}`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.STYLE);
      expect(tokens[1]?.type).toBe(TokenType.SELECTOR_DEFAULT);
      expect(tokens[2]?.type).toBe(TokenType.LBRACE);

      // Find closing brace
      const rbrace = tokens.find((t) => t.type === TokenType.RBRACE);
      expect(rbrace).toBeDefined();

      // Find color reference
      const colorRef = tokens.find((t) => t.type === TokenType.COLOR_REF);
      expect(colorRef?.value).toBe('color.brand');
    });

    it('tokenizes let variables', () => {
      const dsl = `let primaryGap = 2
let accentColor = #6D28D9`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.LET);
      expect(tokens[1]?.type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1]?.value).toBe('primaryGap');
      expect(tokens[2]?.type).toBe(TokenType.EQUALS);
      expect(tokens[3]?.type).toBe(TokenType.NUMBER);
      expect(tokens[3]?.value).toBe(2);
    });

    it('tokenizes when blocks with conditions', () => {
      const dsl = `when <600 {
  vstack gap:2
}`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      expect(tokens[0]?.type).toBe(TokenType.WHEN);
      expect(tokens[1]?.type).toBe(TokenType.LT);
      expect(tokens[2]?.type).toBe(TokenType.NUMBER);
      expect(tokens[2]?.value).toBe(600);
    });
  });

  describe('Snapshot tests', () => {
    it('matches snapshot for login form example', () => {
      const dsl = `grid cols:12 gap:2 pad:3
  card "Sign in" @c5 s4 pad:3
    input "Email" #email type:email
    button "Sign in" tone:primary

style default {
  skin: clean;
  color.brand: #6D28D9
}`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      // Simplify tokens for snapshot (remove position details)
      const simplified = tokens.map((t) => ({
        type: t.type,
        value: t.value,
        raw: t.raw,
      }));

      expect(simplified).toMatchSnapshot();
    });

    it('matches snapshot for dashboard layout', () => {
      const dsl = `grid cols:12 gap:2
  card "Dashboard" @c1 s12 pad:2
  card "Activity" @c1 s8 r2 pad:3
  card "Actions" @c9 s4 r2 pad:2`;

      const tokenizer = new Tokenizer(dsl);
      const tokens = tokenizer.tokenize();

      const simplified = tokens.map((t) => ({
        type: t.type,
        value: t.value,
      }));

      expect(simplified).toMatchSnapshot();
    });
  });
});
