**ID**: T-011
**Title**: Implement Preview Panel & Render Loop
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Create the PreviewPanel that consumes AST/layout data, runs layout + renderer pipelines, and displays SVG with error fallbacks, zoom controls, and rulers toggle.

### Why (Goal / outcome)
Users must see immediate visual feedback; PreviewPanel stitches together AST → layout → SVG pipeline and manages UI polish.

### Scope
- **In scope**:
  - Component that listens to editor events, invokes layout (T-004) + renderer (T-005), and manages last-good render fallback when errors exist.
  - Inline error banner when diagnostics present.
  - Zoom (fit, 50–200%) and optional guides/rulers toggle.
  - Performance budget enforcement (<200ms P95) with visual indicator if exceeded.
- **Out of scope**:
  - Export/download logic (T-013).
  - Breakpoint UI (handled with T-008 but panel should expose width info).

### Requirements
- Maintains cached SVG of last successful render; on error shows banner + retains old image.
- Shows render time + node count badge for debugging.
- Resizable with SplitPane; responds to theme/skin changes.

### Acceptance Criteria
- Given valid AST, when preview renders, then time from AST receipt to SVG paint is <200ms P95 (log data) and UI shows updated image.
- Given parser error, when preview triggered, then banner displays error summary and old render remains visible.

### Implementation Steps
1. Compose preview context hooking into parser outputs and state store.
2. Wire layout + renderer modules with memoization/diffing, updating React state when SVG ready.
3. Add UI controls for zoom/rulers and error banner + instrumentation badges.

### Test/Validation Plan
- Integration tests mocking AST inputs and asserting fallback behavior.
- Manual perf measurement using browser devtools (Performance tab) on 50/300 node fixtures.

### Observability
- Log render duration, node counts, fallback occurrences; expose stats overlay toggled via dev hotkey for profiling (feeds T-018).

### Dependencies / Related Tickets
- Depends on **T-004**, **T-005**, **T-007**, **T-009**. _(Preview invokes [`layoutDocument`](../../src/index.ts#L56) and now calls [`render()`](../../src/renderer/index.ts#L42) with skin data derived via [`skinSettingsFromGlobals()`](../../src/renderer/skin.ts#L178) / [`resolveSkinTokens()`](../../src/renderer/skin.ts#L166) so style globals toggle clean vs sketch output.)_
- Supports **T-008**, **T-013**, **T-014**, **T-018**.

### Risks & Mitigations
- **Risk**: React re-render thrash. **Mitigation**: isolate heavy work in workers/hooks, memoize expensive results.
- **Risk**: Zoom/responsive issues. **Mitigation**: rely on CSS transforms + viewBox adjustments.

### Rollback Strategy
- Provide simple static SVG render without controls, or revert to prior implementation if new features break stability.

### References
- [PRD.md §7 User Experience Flow](../prd/PRD.md#7-user-experience)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
