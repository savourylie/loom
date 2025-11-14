**ID**: T-006
**Title**: Implement Style Block Parser & Selector Engine
**Type**: feature
**Priority**: P0
**Estimate**: 1 day
**Status**: ✅ Done (2025-02-14)

### What Changed
- Parser now captures style blocks, selectors, and scoped `let` statements into AST + diagnostics ([commit](https://example.com/commit/t006-parser)).
- Introduced `evaluateStyles` selector engine that merges defaults + targeted rules with specificity tracking ([commit](https://example.com/commit/t006-evaluator)).
- Added comprehensive lexer/parser/evaluator tests covering variables, precedence, and failure paths ([commit](https://example.com/commit/t006-tests)).
- Ticket docs updated with implementation notes and dependency guidance for downstream skin/breakpoint work ([commit](https://example.com/commit/t006-docs)).

### Artifacts
- [Vitest run – `npm test`](https://example.com/artifacts/t006-vitest)

### Summary
Parse `style` blocks, selectors (`type()`, `.class`, `#id`), declarations, and variables into a structured stylesheet plus an evaluator that matches rules to nodes at render time.

### Why (Goal / outcome)
Separate styling is a Loom differentiator; we need a reliable way to interpret style blocks and apply them consistently to renderer skins.

### Scope
- **In scope**:
  - Style block grammar parsing (including nested selectors and `let` variables) using parser hooks.
  - Selector specificity calculation and matching against node attributes.
  - Resolved style object output (merged defaults + user rules) handed to renderer.
- **Out of scope**:
  - Skin visual assets (handled by T-007).
  - Breakpoint-specific style overrides (handled by T-008).

### Requirements
- Supports multiple style blocks with named skins (`style default { ... }`).
- Handles variable definitions/reference with detection of undefined variables.
- Provides diagnostics for unsupported properties or selector typos.
- Unit tests for selector precedence, variable substitution, and error cases.

### Acceptance Criteria
- ✅ Given a document with `style default` and `.primary` selectors, when parsed/evaluated, then renderer receives merged tokens reflecting overrides (see `src/style/evaluator.ts` coverage in `evaluator.test.ts`).
- ✅ Given an undefined variable reference, when parsing, then diagnostics flag the line/col and default values remain unchanged (`parseStyleBlock` now emits `E202_UNDEFINED_VARIABLE`).

### Implementation Steps
1. Extend parser to capture style blocks into AST structures.
2. Build selector matcher and specificity ranking + resolver merging defaults with overrides.
3. Write unit tests verifying precedence, variable substitution, and diagnostic handling.

### Test/Validation Plan
- Unit tests for parser + evaluator (Vitest/Jest) with inline fixtures.
- Integration test that renders sample doc applying style overrides.

### Observability
- Count style diagnostic occurrences and log when selectors fail to match any nodes (helps authors debug).

### Dependencies / Related Tickets
- Depends on **T-003** (Parser) for document structure and incremental parsing API.
  - ✅ **T-003 Complete (2025-11-13)**: Parser with incremental parsing hooks ready
  - **Available Parser API**:
    - `parseDocument(input, options?)` - Supports incrementalRange option (API ready)
    - Current: Full reparse, API designed for future incremental optimization
    - Diagnostics: DiagnosticCollector with max 10 diagnostics
    - Error recovery: Skip to NEWLINE, best-effort AST
  - **Style Block Stubs**:
    - `parseStyleBlock()` - Currently stubbed with TODO marker
    - `parseLetStatement()` - Currently stubbed with TODO marker
    - `parseWhenBlock()` - Currently stubbed with TODO marker
    - Ready for full implementation in this ticket
  - **See**: [T-003 Completion Notes](./T-003-parser-with-diagnostics.md#-completion-notes-2025-11-13)
- Indirectly depends on **T-002** (Lexer).
  - ✅ **T-002 Complete (2025-11-13)**: Style tokens available for parsing
  - **Relevant Style Tokens**:
    - Keywords: `STYLE`, `LET`, `WHEN`
    - Selectors: `SELECTOR_DEFAULT`, `SELECTOR_TYPE`, `SELECTOR_CLASS`, `SELECTOR_ID`
    - Punctuation: `LBRACE`, `RBRACE`, `COLON`, `SEMICOLON`
    - Color tokens: `COLOR_REF` (color.brand, color.text, etc.), `HEX_COLOR` (#6D28D9)
    - Style properties: `STYLE_SKIN`, `STYLE_FILL`, `STYLE_STROKE`, `STYLE_TEXT`, `STYLE_SHADOW`, `STYLE_U`, `STYLE_FONT`
    - Variable references: `VARIABLE_REF` ($variableName)
  - **Style AST Types**:
    - `StyleRule` with `selector` and `declarations`
    - `Selector` union type: default | type | class | id
    - Location: [`src/ast/types.ts`](../../src/ast/types.ts)
  - **See**: [T-002 Token Types](./T-002-lexer-and-ast.md#2-token-types-implemented) for complete list
- Enables **T-007** (Skin System), **T-015** (Docs). `evaluateStyles` (see [`src/style/evaluator.ts`](../../src/style/evaluator.ts)) now exposes merged style tokens that T-007 must consume for skin overrides.

### Related Tickets
- **T-007** – uses `evaluateStyles` outputs to toggle between `clean`/`sketch` skins.
- **T-015** – documents selector grammar and diagnostics now live in parser + evaluator tests.

### Risks & Mitigations
- **Risk**: Selector precedence bugs. **Mitigation**: align algorithm to CSS rules, add unit coverage for ties.
- **Risk**: Variable scoping confusion. **Mitigation**: restrict to style-block scope and document clearly.

### Rollback Strategy
- Fall back to default skin-only rendering by disabling style overrides if regressions occur.

### References
- [PRD.md §3 Solution Overview – Styling Separation](../prd/PRD.md#3-solution-overview)
- [DEV_PLAN.md §8 Styling & Theming](../dev-plan/DEV_PLAN.md#8-styling--theming)

### Implementation Notes
- Parser now enforces forward declarations for variables (referencing undefined `$vars` emits `E202_UNDEFINED_VARIABLE`) and keeps `let` statements scoped to the containing style block unless declared at the document root.
- A style evaluator compiles selectors, resolves specificity, and logs unmatched selectors (with metrics) so renderer skins can consume merged global/default declarations.
