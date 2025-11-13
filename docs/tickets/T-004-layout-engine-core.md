**ID**: T-004
**Title**: Implement Layout Engine for Grid & Stacks
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Translate parsed AST nodes into positioned boxes using Loom's grid-first layout (grid, hstack, vstack, zstack) with placement tokens, spacing, and alignment semantics.

### Why (Goal / outcome)
Accurate layout math is required to render wireframes that match author intent and uphold the "grid-perfect" promise in the PRD.

### Scope
- **In scope**:
  - Grid resolver (columns, row auto-placement, span handling, gaps/padding per props/defaults).
  - Stack layout algorithms respecting `gap`, `pad`, `grow`, `shrink`, alignment tokens (`at:`) described in spec.
  - Validation for overlapping placements and warnings for out-of-bounds spans.
- **Out of scope**:
  - Visual rendering (handled by T-005).
  - Breakpoints (handled by T-008).

### Requirements
- Layout engine outputs normalized box tree (position, size, z-index, tone, etc.) consumed by renderer.
- Supports up to 300 nodes with target <200ms parse+layout.
- Provides hooks for memoization / diffing (cache by node id + props signature).
- Unit tests for each container type plus combination cases (grid in stack, etc.).

### Acceptance Criteria
- Given a sample DSL with grid + nested stacks, when processed, then computed positions/sizes align with expected snapshots.
- Given invalid placement (span exceeds grid columns), when processed, then a warning diagnostic is emitted without crashing layout.

### Implementation Steps
1. Define layout box interfaces and conversion utilities from AST to layout tree.
2. Implement grid algorithm (column arithmetic, auto rows) plus stack algorithms with alignment tokens.
3. Add validation + diagnostics bridging back to parser, then cover with unit/snapshot tests.

### Test/Validation Plan
- Deterministic snapshot tests for layout boxes on template fixtures.
- Performance sanity benchmark on 50/300 node documents.

### Observability
- Emit layout timing metrics (parse-to-layout duration) and log warnings for collisions/out-of-bounds to help catch DSL regressions in playground console.

### Dependencies / Related Tickets
- Depends on **T-003** for parser and diagnostics.
  - ✅ **T-003 Complete (2025-11-13)**: Parser and diagnostics ready for consumption
  - **Available Parser API**:
    - `parseDocument(input, options?)` - Entry point returns ParseResult
    - Location: [`src/parser/parser.ts`](../../src/parser/parser.ts)
    - Usage: `const result = parseDocument(dsl); // returns document + diagnostics`
    - Diagnostics: Structured errors with line/col for layout validation
    - Performance: ~1ms parse time, tracks node count
  - **AST Output**:
    - Document structure with nodes[], styles[], variables{}
    - Node properties: type, label, id, classes, place, props, children
    - Grid placement validation ready
  - **See**: [T-003 Completion Notes](./T-003-parser-with-diagnostics.md#-completion-notes-2025-11-13)
- Required by **T-005**, **T-011**, **T-018**.

### Risks & Mitigations
- **Risk**: Floating-point drift causes pixel gaps. **Mitigation**: clamp to integers, centralize unit conversions.
- **Risk**: Memoization complexity. **Mitigation**: start with pure functions, add caching once correctness is verified.

### Rollback Strategy
- Revert layout module to last stable tag; preview can fall back to simple flow layout temporarily if needed.

### References
- [PRD.md §3 Solution Overview](../prd/PRD.md#3-solution-overview)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
