**ID**: T-005
**Title**: Build SVG Renderer With Clean Skin Defaults
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Render layout boxes into SVG markup that reflects Loom's clean skin defaults (colors, radius, typography) and supports core components (card, text, input, button, image, icon, spacer, list, tabs).

### Why (Goal / outcome)
Users must see polished, modern wireframes instantly; the renderer is the user-facing proof of the DSL.

### Scope
- **In scope**:
  - Mapping layout box tree to SVG elements with accessibility attributes.
  - Component rendering primitives (shapes, text, placeholder icons) consistent with spec defaults.
  - Skin token application for colors, radii, shadows, strokes.
  - Export-friendly IDs/classnames to support style overrides.
- **Out of scope**:
  - Sketch skin variants (T-007).
  - Breakpoint logic (T-008) beyond reading resolved layout tree.

### Requirements
- Produces SVG strings under 16ms for 300 nodes on modern hardware.
- Supports focus/hover states via CSS classes for future animation (but static in MVP).
- Integrates with Preview panel via simple API: `render(layoutTree, skinSettings)`.
- Includes sanitization for text nodes (escape HTML entities) per security section.

### Acceptance Criteria
- Given layout boxes for sample templates, when rendered, then SVG output visually matches design tokens defined in spec (verified via snapshot/comparison tests).
- Given text with `<script>` characters, when rendered, then output is escaped so the SVG stays safe per PRD §12.

### Implementation Steps
1. Define renderer module + component-specific renderers (card/text/etc.) using shared shape utilities.
2. Implement skin token resolver for clean defaults (color palette, radii, shadows).
3. Wire renderer into utility consumed by Preview/Exporter and add snapshot tests for fixtures.

### Test/Validation Plan
- Integration snapshot tests comparing generated SVG strings for canonical templates.
- Visual regression spot-check via Storybook/Chromatic (optional) or manual review in Preview.

### Observability
- Log render durations and node counts to console for perf monitoring; expose counters for sanitized text occurrences to catch potential injection abuse.

### Dependencies / Related Tickets
- Depends on **T-004** for layout boxes via [`layoutDocument`](../../src/index.ts#L56) / [`LayoutBox`](../../src/layout/types.ts); renderer consumes this normalized tree directly.
- Required by **T-011**, **T-013**, **T-014**, **T-018**.

### Risks & Mitigations
- **Risk**: Large SVG output slows preview. **Mitigation**: reuse defs, avoid redundant gradients, prefer CSS classes.
- **Risk**: Styling drift between renderer and future style system. **Mitigation**: centralize tokens so T-007 reuses same resolver.

### Rollback Strategy
- Revert renderer module; preview can display placeholder boxes until fixed.

### References
- [PRD.md §3 Solution Overview](../prd/PRD.md#3-solution-overview)
- [DEV_PLAN.md §3 Component Architecture](../dev-plan/DEV_PLAN.md#3-component-architecture)
