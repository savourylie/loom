**ID**: T-008
**Title**: Implement Breakpoint & Conditional Blocks
**Type**: feature
**Priority**: P1
**Estimate**: 0.5 day

### Summary
Add the `when <expr> { ... }` breakpoint evaluator that toggles layout/style blocks based on viewport width, enabling responsive tweaks promised in the PRD "Should-have" list.

### Why (Goal / outcome)
Authors need lightweight responsiveness without leaving the DSL; this engine allows adaptive layouts for small/large screens inside the playground.

### Scope
- **In scope**:
  - Parsing + evaluating `when` clauses with `<`, `<=`, `>=` operators and numeric widths.
  - Applying conditional blocks to both structural nodes and style overrides.
  - Preview integration to pass current viewport width (panel size) into evaluator.
- **Out of scope**:
  - Complex media query syntax or orientation checks.

### Requirements
- Supports multiple breakpoint blocks in a document; last matching rule wins.
- Evaluations happen on resize with debounced updates to avoid thrash.
- Diagnostics for overlapping/conflicting conditions.

### Acceptance Criteria
- Given DSL with `when <600 { stack ... } when >=1024 { grid ... }`, when viewport width changes, then rendered layout switches between definitions accordingly.
- Given overlapping ranges, when parsed, then diagnostics warn about conflicts.

### Implementation Steps
1. Extend parser AST to capture `when` blocks referencing child nodes/styles.
2. Build evaluator that selects active block based on width and merges into base document.
3. Wire preview resize events to trigger evaluator + re-render; add tests for condition evaluation.

### Test/Validation Plan
- Unit tests for evaluator logic (inputs vs expected boolean results).
- Integration test verifying layout tree switches when simulated width crosses thresholds.

### Observability
- Log breakpoint evaluations (active rule + width) in dev console to debug template behavior; expose counter for fallback path usage.

### Dependencies / Related Tickets
- Depends on **T-003** (✅ Complete 2025-11-13), **T-004**, **T-011**.

### Risks & Mitigations
- **Risk**: Frequent re-renders on resize degrade perf. **Mitigation**: debounce width changes and reuse cached AST per breakpoint.
- **Risk**: Complexity in merging nodes. **Mitigation**: restrict to additive overrides; document precedence rules in spec.

### Rollback Strategy
- Behind feature flag; disable evaluator to fall back to base layout if issues arise.

### References
- [PRD.md §6 Requirements – Breakpoints](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
