**ID**: T-007
**Title**: Deliver Skin System & Sketch Variant
**Type**: feature
**Priority**: P1
**Estimate**: 0.5 day
**Status**: ✅ Done (2025-02-15)

### Summary
Layer a skin abstraction over renderer tokens to support both `clean` (default) and `sketch` appearances, exposing tone variables and token overrides from style blocks.

### What Changed
- Added typed skin descriptors plus a `skinSettingsFromGlobals` bridge so Preview + style systems can pass overrides straight into `render()` ([commit](https://example.com/commit/t007-skins)).
- Reworked the renderer to honor dashed strokes and jittered rectangles via deterministic sketch helpers, including usage metrics + logging ([commit](https://example.com/commit/t007-renderer)).
- Covered clean vs sketch SVG output with updated Vitest snapshots and a dedicated resolver unit test ([commit](https://example.com/commit/t007-tests)).

### Why (Goal / outcome)
Skins make Loom diagrams feel polished or hand-drawn without changing content, fulfilling a key differentiator from the PRD.

### Scope
- **In scope**:
  - Skin descriptor objects (palette, radii, stroke styles, jitter params).
  - `sketch` implementation (dashed strokes, jittered paths, hand-drawn corners) triggered via style block or UI toggle.
  - API for renderer to consume skin tokens + style overrides.
- **Out of scope**:
  - Additional skins beyond clean/sketch.
  - Style block parsing (T-006 handles).

### Assumptions
- Style globals (`style default { ... }`) are the single source of truth for skin selection until the UI toggle is wired later.
- Token overrides follow the documented prefixes (`color.*`, `radius.*`, `shadow.*`, `stroke.*`), so descriptor merging can key off those groups.

### Requirements
- Users can switch skins from UI (state wiring done later) and style blocks via `skin:` declaration.
- Renderer gracefully degrades if sketch skin lacks a token (falls back to clean default).
- Unit/integration tests verifying both skins render expected SVG attributes.

### Acceptance Criteria
- ✅ Given a document with `style default { skin: sketch }`, when rendered, then output uses dashed strokes/jitter per spec. _Covered by `renderer.test.ts` sketch snapshot comparing jittered paths._
- ✅ Given no skin specified, when rendered, then clean defaults apply with no console errors. _Default render snapshot + renderer logs confirm clean fallback._

### Implementation Steps
1. Define skin config objects + token resolver merging defaults with overrides.
2. Implement sketch-specific renderer helpers (dashed strokes, jitter transforms) and integrate selection logic.
3. Write snapshot tests comparing clean vs sketch renders for same template.

### Test/Validation Plan
- Renderer snapshot comparisons for both skins.
- Manual visual review toggling skins inside Preview panel once wired.

### Observability
- Log current skin + applied overrides for debugging; capture counts of sketch usage to gauge adoption (local metrics for now).

### Dependencies / Related Tickets
- Depends on **T-005** and **T-006**. T-006 now exposes `evaluateStyles` (`src/style/evaluator.ts`) whose merged globals feed into `skinSettingsFromGlobals()` so overrides like `skin: sketch` propagate correctly.
- Feeds into **T-011** (Preview now consumes `skinSettingsFromGlobals()` + `renderRectElement()` jittered paths) and **T-014** (Template gallery thumbnails must request both skins via the new resolver helpers).

### Artifacts
- Renderer snapshot + resolver tests: [`npm run test`](../../package.json) (Vitest run output archived in CI logs).

### Risks & Mitigations
- **Risk**: Sketch jitter hurts performance. **Mitigation**: precompute jitter offsets and reuse per node.
- **Risk**: Token mismatch between skins. **Mitigation**: shared schema validated via TypeScript interfaces.

### Rollback Strategy
- Disable sketch skin flag to fall back to clean-only rendering until fixed.

### References
- [PRD.md §3 Key Differentiators](../prd/PRD.md#3-solution-overview)
- [DEV_PLAN.md §8 Styling & Theming](../dev-plan/DEV_PLAN.md#8-styling--theming)
