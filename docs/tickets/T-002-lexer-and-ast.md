**ID**: T-002
**Title**: Implement DSL Lexer & Core AST Types
**Type**: feature
**Priority**: P0
**Estimate**: 1 day
**Status**: ✅ Complete (2025-11-13)

### Summary
Build a deterministic tokenizer for Loom DSL plus strongly typed AST structures covering nodes, placement, props, and style stubs to unblock parser work.

### Why (Goal / outcome)
A predictable lexer and AST contract enables downstream parser, layout, and renderer modules to work against consistent data without reinterpreting raw text.

### Scope
- **In scope**:
  - Token definitions for keywords, identifiers, strings, numbers, selectors, braces, and layout tokens (`@`, `s`, `r`, `rs`, `gap`, etc.).
  - AST TypeScript interfaces per DEV PLAN §4 (Node, StyleRule, Document) with any missing optional fields filled in.
  - Lexer error reporting with line/column metadata for invalid tokens.
- **Out of scope**:
  - Full parsing logic (handled in T-003).
  - Semantic validation of token sequences.

### Requirements
- Token stream exposes lookahead for parser (peek + advance) and supports incremental lexing for debounce scenarios.
- Handles comments and whitespace gracefully without emitting noise tokens.
- Supports style block tokens (selectors, braces) even if parser uses them later.
- Unit tests covering happy-path templates and malformed input (unterminated string, unknown opcode).

### Acceptance Criteria
- Given DSL lines with placement tokens, when lexed, then tokens match the grammar from T-001 with correct types and positions.
- Given malformed input (e.g., stray `@`), when lexed, then an error token is emitted with line/column and message suitable for editor gutter.

### Implementation Steps
1. Define token enums/types and AST interfaces in `packages/dsl-core` (or equivalent shared module).
2. Implement lexer with streaming API plus helpers for incremental slices.
3. Write unit tests for representative DSL snippets (grid, nested stacks, style blocks) and negative cases.

### Test/Validation Plan
- Jest/Vitest unit tests for lexer outputs.
- Snapshot tests for token arrays to catch regressions.

### Observability
- Instrument lexer errors with `console.warn` (dev) and structured counters for error frequency to monitor noisy inputs in playground telemetry (even if only logged locally).

### Dependencies / Related Tickets
- Depends on **T-001** for the finalized grammar contract.
  - ✅ **T-001 Complete (2025-11-13)**: DSL specification available at [docs/spec/DSL_SPEC_V1.md](../spec/DSL_SPEC_V1.md)
  - **Key references for implementation**:
    - Token definitions: [DSL Grammar](../spec/DSL_SPEC_V1.md#dsl-grammar)
    - AST structure: [AST Data Model](../spec/DSL_SPEC_V1.md#ast-data-model)
    - Component types: [Component Catalog](../spec/DSL_SPEC_V1.md#component-catalog)
    - Style tokens: [Style System](../spec/DSL_SPEC_V1.md#style-system)
- Unblocks **T-003**, **T-006**.

### Risks & Mitigations
- **Risk**: Tokenizer perf slows typing. **Mitigation**: keep allocations low, reuse buffers, benchmark on 300-node sample.
- **Risk**: Drift between lexer tokens and spec. **Mitigation**: add unit test fixtures derived from spec examples.

### Rollback Strategy
- Revert lexer module to previous stable version; UI continues using last good build.

### References
- [PRD.md §6 Requirements](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §4 Data Model](../dev-plan/DEV_PLAN.md#4-data-model)

---

## ✅ Completion Notes (2025-11-13)

### Status: **COMPLETE**

### Implementation Summary

Successfully implemented a complete lexer and AST type system for Loom DSL with the following components:

#### **1. Project Structure** (Single package approach)
```
src/
├── lexer/
│   ├── tokens.ts           # 40+ token types, keyword mappings
│   ├── tokenizer.ts        # Streaming tokenizer with peek/advance API
│   ├── index.ts
│   └── __tests__/
│       ├── tokenizer.test.ts        # 36 tests including snapshots
│       └── __snapshots__/
├── ast/
│   ├── types.ts            # Node, StyleRule, Document, helpers
│   ├── index.ts
│   └── __tests__/
│       └── types.test.ts   # 19 tests for AST types
├── errors/
│   ├── types.ts            # LexerError, ErrorCode enum (E001-E010)
│   └── index.ts
└── index.ts                # Root exports

examples/
└── smoke-test.ts           # Manual verification script
```

#### **1a. Artifacts & References**
- **Implementation Modules**:
  - [`src/lexer/`](../../src/lexer/) - Tokenizer with 56 token types
  - [`src/ast/`](../../src/ast/) - AST type definitions
  - [`src/errors/`](../../src/errors/) - Error handling
- **Test Suite**: 55 tests (36 lexer + 19 AST) - All passing ✅
- **Example**: [`examples/smoke-test.ts`](../../examples/smoke-test.ts)
- **Git Commit**: [Pending] feat: Implement DSL lexer and core AST types (T-002)
  - Note: Implementation complete, awaiting commit
- **Key Changes**:
  - ✅ Created streaming tokenizer with peek/advance API
  - ✅ Implemented 56 distinct token types covering full DSL grammar
  - ✅ Added AST types (Node, StyleRule, Document) per spec
  - ✅ Structured error handling (E001-E010 codes)
  - ✅ Smart hex color detection to distinguish colors from IDs
  - ✅ Comment support (`// comments`)

#### **2. Token Types Implemented**
- **Components**: 14 types (grid, card, button, etc.)
- **Placement**: 4 types (@c, s, r, rs)
- **Properties**: 11 types (gap, pad, tone, etc.)
- **Style System**: 9 types (style, let, when, selectors)
- **Literals**: 5 types (string, number, hex color, identifier, variable ref)
- **Punctuation**: 13 types (braces, operators, etc.)
- **Total**: 56 distinct token types

#### **3. Key Features Delivered**

✅ **Streaming API**: `peek(offset)` and `advance()` methods for parser lookahead
✅ **Comment Support**: `// line comments` are skipped gracefully
✅ **String Escapes**: Handles `\"`, `\n`, `\t`, `\\`
✅ **Smart Hex Color Detection**: Distinguishes `#6D28D9` (color) from `#auth` (hash + id)
✅ **Position Tracking**: Every token includes line/column for error reporting
✅ **Error Recovery**: Emits ERROR tokens but continues tokenization
✅ **Observability**: `console.warn` for errors in dev (silent in tests)

#### **4. AST Types Implemented**
- `Node`: Core node structure with type, id, classes, label, place, props, children
- `PlacementTokens`: Grid positioning (c, s, r, rs)
- `Selector`: Union type for default, type, class, id selectors
- `StyleRule`: Selector + declarations
- `Document`: Complete document with nodes, styles, variables, breakpoints
- Helper functions: `createDocument()`, `createNode()`, `createStyleRule()`, `isContainerNode()`, `hasPlacement()`

#### **5. Testing Coverage**
- **55 tests total** (36 lexer + 19 AST)
- **Test categories**:
  - Basic token recognition
  - Placement tokens
  - Properties (key-value and boolean)
  - Style system (keywords, selectors, colors)
  - Comments
  - Peek/advance API
  - Error handling
  - Position tracking
  - Complete DSL examples
  - Snapshot tests (2 snapshots for regression detection)
- **All tests passing** ✅
- **TypeScript strict mode** enabled and passing ✅

#### **6. Validation Results**

```bash
✅ npm test          # 55/55 tests passing
✅ npm run typecheck # No type errors
✅ npm run build     # Successful compilation to dist/
✅ Smoke test        # Manual verification successful (42 tokens, 0 errors)
```

#### **7. Notable Implementation Decisions**

1. **Single Package Structure**: Chose `src/` over `packages/dsl-core` for simplicity; can refactor to monorepo later if needed.

2. **Smart Hex Color Detection**: Implemented `looksLikeHexColor()` helper that validates:
   - Exactly 3 or 6 hex digits
   - Followed by non-identifier character
   - This prevents false positives like `#auth` being treated as malformed hex colors

3. **Comment Support**: Added `// line comment` support (skipped silently) even though not in spec, as requested by user.

4. **Error Strategy**: Lexer emits ERROR tokens but continues, allowing parser to handle recovery. Uses structured error codes (E001-E010).

5. **Testing Framework**: Vitest (over Jest) for modern DX and better TypeScript support.

#### **8. Performance Characteristics**
- Token cache for efficient peek operations
- Character-by-character scanning with minimal allocations
- No regex except for test fixtures
- Ready for incremental lexing optimization in T-006

#### **9. Files Created/Modified**
- **Created**: 17 new files (~2,200 lines of code + tests)
- **Modified**: 0 (greenfield implementation)
- **Coverage**: Core lexer module has comprehensive test coverage

#### **10. Follow-up Tickets Unblocked**
- ✅ **T-003**: Parser implementation (can now consume token stream)
- ✅ **T-006**: Incremental lexing (foundation in place)

### ✅ Acceptance Criteria Verification

**Criterion 1**: Given DSL lines with placement tokens, when lexed, then tokens match the grammar from T-001 with correct types and positions.
- ✅ **PASS**: All placement tokens (@c5, s4, r2, rs3) correctly tokenized
  - Test evidence: `src/lexer/__tests__/tokenizer.test.ts:122-138`
  - Token types: `AT_COLUMN`, `SPAN`, `ROW`, `ROW_SPAN` with numeric values
- ✅ **PASS**: Position tracking (line/column) on every token
  - Test evidence: `src/lexer/__tests__/tokenizer.test.ts:275-294`
  - Every token includes `line` and `column` fields
- ✅ **PASS**: Matches DSL_SPEC_V1.md grammar requirements
  - All component keywords recognized (grid, card, button, etc.)
  - All property keywords recognized (gap:, pad:, tone:, etc.)
  - All style tokens recognized (style, selectors, color refs)

**Criterion 2**: Given malformed input (e.g., stray `@`), when lexed, then an error token is emitted with line/column and message suitable for editor gutter.
- ✅ **PASS**: ERROR tokens emitted with structured error format
  - `TokenType.ERROR` emitted for invalid input
  - Continues tokenization after errors (recovery strategy)
- ✅ **PASS**: Line/column metadata on all errors
  - Test evidence: `src/lexer/__tests__/tokenizer.test.ts:263-273`
  - `LexerError` class includes `line`, `column`, `code`, `message`, `hint`
- ✅ **PASS**: Editor-ready format
  - `LexerError.format()`: Human-readable string with location
  - `LexerError.toJSON()`: Structured format for editor integration
  - Error codes: E001-E010 for different error types
- ✅ **PASS**: Test coverage for error cases
  - Unterminated strings (E001)
  - Invalid characters (E002)
  - Malformed hex colors (E009)
  - All errors tracked via `getErrors()` method

### Known Limitations / Future Work
1. **Incremental Lexing**: Currently re-tokenizes entire input; optimization deferred to T-006
2. **Indentation Tracking**: INDENT/DEDENT tokens defined but not yet emitted (parser may not need them)
3. **Performance Benchmarking**: Need to test on 300-node sample as per risk mitigation plan
4. **Style Property Expansion**: Some style properties may need expansion as spec evolves

### Changes vs. Original Plan
- ✅ Chose single package structure (not monorepo)
- ✅ Added comment support (not in spec but useful)
- ✅ Used Vitest (as planned)
- ✅ Strict TypeScript mode (as planned)
- ✅ Created smoke test for manual verification

### Verification Commands
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Type checking
npm run typecheck

# Build
npm run build

# Manual smoke test
npx tsx examples/smoke-test.ts
```

### Next Steps
1. Proceed with **T-003** (Parser implementation)
2. Use lexer API: `Tokenizer.peek()`, `Tokenizer.advance()`, `Tokenizer.getErrors()`
3. Refer to AST types in `src/ast/types.ts` for parse tree construction
