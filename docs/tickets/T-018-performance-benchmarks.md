**ID**: T-018
**Title**: Build Performance Benchmarks & Instrumentation
**Type**: chore
**Priority**: P1
**Estimate**: 0.5 day

### Summary
Create automated micro-benchmarks and runtime instrumentation to ensure parse→layout→render stays under 200ms P95 for ≤300 nodes as mandated in the PRD.

### Why (Goal / outcome)
Performance is a launch-critical KPI; benchmarks prevent regressions and guide optimizations.

### Scope
- **In scope**:
  - Benchmark scripts covering 50/300/1000 node documents (per DEV PLAN §12) measuring lexer, parser, layout, renderer times.
  - Preview instrumentation overlay (dev-only) showing timings + node counts.
  - CI job (optional) that fails if thresholds exceeded beyond tolerance.
- **Out of scope**:
  - Deep profiling/optimization (handled ad hoc when thresholds fail).

### Requirements
- Bench suite outputs JSON report with stage timings, GC stats (if accessible), passes/fails vs thresholds.
- Preview overlay toggled via keyboard (e.g., `Ctrl+Shift+P`).
- Stores historical results (simple CSV or Markdown) for manual comparison.

### Acceptance Criteria
- Given benchmark script, when run, then it reports stage timings and exits non-zero if P95 >200ms for 300-node case.
- Given dev overlay hotkey, when toggled, then preview displays parse/layout/render durations updated per render cycle.

### Implementation Steps
1. Create representative fixtures and script (Node/Bun) measuring each stage with high-resolution timers.
2. Integrate instrumentation hooks into parser/layout/renderer to emit timings to overlay.
3. Wire script into package.json + CI optional job; document interpretation of results.

### Test/Validation Plan
- Run benchmarks locally on target hardware; record baseline numbers.
- Smoke test overlay toggles and ensure disabled in production builds.

### Observability
- Benchmarks produce structured logs; overlay surfaces real-time metrics. Optionally log to console with `performance.mark` for browser devtools.

### Dependencies / Related Tickets
- Depends on **T-003** (✅ Complete 2025-11-13 - parser timing metrics available), **T-004**, **T-005**, **T-011**. _(Use `layoutDocument` metrics output (`layoutTimeMs`, `nodeCount` in [`LayoutResult`](../../src/layout/types.ts#L29-L55)) plus renderer timings from [`RenderMetrics`](../../src/renderer/index.ts#L6-L15) when logging overlay data.)_

### Risks & Mitigations
- **Risk**: Bench numbers noisy. **Mitigation**: run multiple iterations and average; allow tolerance window.
- **Risk**: Overlay leaks to production. **Mitigation**: guard behind `process.env.NODE_ENV !== 'production'`.

### Rollback Strategy
- Disable benchmark job and overlay if blocking release; keep manual perf checklist.

### References
- [PRD.md §4 Goals & Success Criteria](../prd/PRD.md#4-goals--non-goals)
- [DEV_PLAN.md §11 Performance Optimization](../dev-plan/DEV_PLAN.md#11-performance-optimization)
