**ID**: T-010
**Title**: Build Editor Panel With Live Diagnostics
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Implement the client-side EditorPanel (Monaco or textarea) with syntax highlighting, debounced parsing (120–160ms), and inline error gutters fed by parser diagnostics.

### Why (Goal / outcome)
Real-time authoring with actionable errors is core to Loom's value; the editor must feel responsive and informative.

### Scope
- **In scope**:
  - Editor component with controlled value, keyboard shortcuts (Cmd+Enter re-render, Cmd+S export placeholder).
  - Debounce pipeline hooking into parser service (T-003) and capturing diagnostics.
  - Error gutter markers + tooltip popovers.
  - Sample DSL templates switcher drop-down.
- **Out of scope**:
  - Preview rendering (T-011) beyond emitting events.
  - Autosave/localStorage (T-012).

### Requirements
- Debounce interval 120–160ms; parser invoked on change, render event emitted when AST valid.
- Diagnostics shown inline with severity colors, clicking jumps to line.
- Editor resizes with SplitPane and respects `prefers-reduced-motion` for caret animations.

### Acceptance Criteria
- Given I type valid DSL, when idle for >160ms, then AST event fires and preview updates without blocking typing.
- Given syntax error, when parser returns diagnostics, then gutter markers and tooltip appear with message and the last good render stays visible.

### Implementation Steps
1. Integrate Monaco (or CodeMirror) with custom Loom language config + theme.
2. Wire onChange handler to debounce and call parser worker (via web worker or async function) to receive AST + diagnostics.
3. Render diagnostics in gutter + hook keyboard shortcuts for template switching/run/export triggers.

### Test/Validation Plan
- Component tests (React Testing Library) verifying debounce + diagnostic rendering logic.
- Manual QA for keyboard shortcuts and template insertion.

### Observability
- Track editor parse duration, keystrokes per minute, and diagnostic counts via dev console metrics for perf tuning.

### Dependencies / Related Tickets
- Depends on **T-003** for structured diagnostics and editor integration.
  - ✅ **T-003 Complete (2025-11-13)**: Diagnostics ready for gutter annotations
  - **Available Diagnostic API**:
    - `Diagnostic` interface with code, severity, message, line, column, hint
    - Error codes: E011-E020 (syntax), E101-E199 (properties), E201-E299 (semantic), E301-E399 (layout), W501-W599 (performance)
    - Severity levels: error, warning, info (for color coding)
    - Position tracking: line/column for gutter placement
  - **Usage**:
    - `const result = parseDocument(dsl);`
    - `result.diagnostics` - Array of structured diagnostics
    - Each diagnostic includes hint for quick fixes
  - **See**: [T-003 Completion Notes](./T-003-parser-with-diagnostics.md#-completion-notes-2025-11-13)
- Depends on **T-009**.
  - ✅ **T-009 Done (2025-11-14)**: Editor mounts inside the [AppShell primary panel](../../apps/web/components/app-shell.tsx) and should reuse [StoreProvider/useAppStore](../../apps/web/providers/store-provider.tsx) plus [AppProviders](../../apps/web/app/providers.tsx) to publish run/format actions + layout arrangement signals.
- Connected to **T-012**, **T-011**.

### Risks & Mitigations
- **Risk**: Monaco bundle size/perf. **Mitigation**: lazy-load editor, strip unused languages.
- **Risk**: Debounce hides errors. **Mitigation**: run immediate parse on blur and manual run hotkey.

### Rollback Strategy
- Swap to simple textarea fallback if Monaco integration causes blockers; revert feature branch.

### References
- [PRD.md §7 User Journey](../prd/PRD.md#7-user-experience)
- [DEV_PLAN.md §3 Component Architecture – Organisms](../dev-plan/DEV_PLAN.md#3-component-architecture)
