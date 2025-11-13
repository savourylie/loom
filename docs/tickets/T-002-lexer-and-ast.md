**ID**: T-002
**Title**: Implement DSL Lexer & Core AST Types
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

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
