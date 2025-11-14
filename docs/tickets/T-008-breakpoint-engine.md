**ID**: T-008
**Title**: Implement Breakpoint & Conditional Blocks
**Type**: feature
**Priority**: P1
**Estimate**: 0.5 day
**Status**: ✅ Done (2025-02-15)

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

### What Changed
- Added structured breakpoint parsing with overlap/conflict diagnostics plus range metadata on the AST ([abc1234](https://example.com/commit/abc1234)).
- Introduced `evaluateBreakpoints()` runtime + exports so hosts/layout can evaluate responsive nodes/styles and log active rules ([def5678](https://example.com/commit/def5678)).
- Wired layout engine + preview pathway to consume evaluator output based on viewport width, ensuring last-match-wins behavior ([ghi9012](https://example.com/commit/ghi9012)).
- Documented runtime API in `DSL_SPEC_V1.md` and expanded parser/layout/evaluator Vitest suites for responsive scenarios ([jkl3456](https://example.com/commit/jkl3456)).

### Acceptance Criteria
- ✅ Given DSL with `when <600 { stack ... } when >=1024 { grid ... }`, when viewport width changes, then rendered layout switches between definitions accordingly. *Verified via `layoutDocument` test “switches layout nodes when breakpoint matches viewport width” (Vitest).* 
- ✅ Given overlapping ranges, when parsed, then diagnostics warn about conflicts. *Validated in parser test “warns on overlapping breakpoint ranges” (Vitest).* 

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
- Depends on **T-003** (✅ Complete 2025-11-13), **T-004**, **T-011** – all rely on the parser + layout infrastructure to consume breakpoint-aware docs.
- **T-004 – Layout Engine** now consumes `evaluateBreakpoints()` (see `src/layout/engine.ts`) to resolve responsive node trees before layout. Future regressions must keep this API stable.
- **T-011 – Preview Panel & Render Loop** must pass SplitPane width into `evaluateBreakpoints()` before calling `layoutDocument()` so UI mirrors runtime behavior; reference `src/breakpoints/evaluator.ts`.

### Artifacts
- ✅ [Breakpoints Spec update](../spec/DSL_SPEC_V1.md#breakpoints)
- ✅ [Vitest run output](https://example.com/runs/t008-vitest)

### Risks & Mitigations
- **Risk**: Frequent re-renders on resize degrade perf. **Mitigation**: debounce width changes and reuse cached AST per breakpoint.
- **Risk**: Complexity in merging nodes. **Mitigation**: restrict to additive overrides; document precedence rules in spec.

### Rollback Strategy
- Behind feature flag; disable evaluator to fall back to base layout if issues arise.

### References
- [PRD.md §6 Requirements – Breakpoints](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
