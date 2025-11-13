**ID**: T-003
**Title**: Build Parser With Incremental Diagnostics
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Implement the Loom DSL parser that consumes lexer tokens, produces ASTs, and returns structured diagnostics suitable for live gutter annotations.

### Why (Goal / outcome)
Accurate parsing with actionable errors is foundational for layout, renderer, and editor feedback loops promised in the PRD.

### Scope
- **In scope**:
  - Recursive-descent parser for layout/container/component nodes plus style blocks.
  - Diagnostic objects (code, severity, message, line/col, hint) for syntax/semantic issues.
  - Incremental parsing hooks (ability to reparse affected ranges only) per performance goals.
- **Out of scope**:
  - Layout math or rendering logic.
  - Style evaluation semantics (handled by T-006/T-007).

### Requirements
- Parser rejects node counts >300 with a friendly warning (per performance constraints).
- Gracefully handles best-effort AST output when errors exist so preview can re-use last good render.
- Supports placement defaults (auto rows, spans) consistent with spec.
- Unit tests covering nested containers, templates, and invalid constructs (duplicate ids, missing `end`).

### Acceptance Criteria
- Given valid Loom DSL, when parsed, then AST nodes mirror the structure defined in T-001 with no diagnostics.
- Given invalid DSL (e.g., extra closing indent), when parsed, then diagnostics include line/col + message and the parser still returns the last valid AST snapshot.

### Implementation Steps
1. Create parser module atop lexer stream with functions per construct (document, node, props, style block).
2. Implement diagnostic collector and incremental parse API (accept changed ranges or tokens slice).
3. Write unit tests plus fixtures for success/error cases; integrate into CI.

### Test/Validation Plan
- Parser unit tests with snapshot comparisons of AST + diagnostics.
- Fuzz small random inputs to ensure parser never crashes (optional script).

### Observability
- Count diagnostics per parse and log when exceeding threshold (>5) to help tune editor UX later.
- Expose parser timing metrics (ms) for performance instrumentation consumed by T-018.

### Dependencies / Related Tickets
- Depends on **T-002**.
- Also references **T-001** for grammar specification:
  - ✅ **T-001 Complete (2025-11-13)**: DSL specification available at [docs/spec/DSL_SPEC_V1.md](../spec/DSL_SPEC_V1.md)
  - **Key references for implementation**:
    - Line syntax structure: [Grammar Specification](../spec/DSL_SPEC_V1.md#line-syntax-structure)
    - Component property validation: [Component Property Matrix](../spec/DSL_SPEC_V1.md#component-property-matrix)
    - Error handling patterns: [Error Handling](../spec/DSL_SPEC_V1.md#error-handling)
    - Performance constraints: [Performance Constraints](../spec/DSL_SPEC_V1.md#performance-constraints) (300 node warning)
- Prerequisite for **T-004**, **T-006**, **T-010**.

### Risks & Mitigations
- **Risk**: Incremental parsing complexity causes bugs. **Mitigation**: start with full parse, encapsulate API to enable later optimization.
- **Risk**: Error messages unclear. **Mitigation**: pair with UX for copy review, add unit snapshots for wording.

### Rollback Strategy
- Toggle feature flag to fall back to previous parser version; revert commit if new diagnostics cause regressions.

### References
- [PRD.md §7 User Experience](../prd/PRD.md#7-user-experience)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
