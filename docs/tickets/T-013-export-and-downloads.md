**ID**: T-013
**Title**: Implement Exporter for SVG & .loom Files
**Type**: feature
**Priority**: P1
**Estimate**: 0.5 day

### Summary
Add client-side export/download flows for rendered SVG output and raw `.loom` source (text file) with proper filenames and offline support.

### Why (Goal / outcome)
Exporting artifacts is a core PRD requirement enabling authors to share diagrams without the playground.

### Scope
- **In scope**:
  - Export dialog (shadcn Dialog) with options: Download SVG, Download `.loom`, Copy SVG to clipboard.
  - Blob generation + download triggers, respecting browser limitations.
  - Basic filename scheme (`loom-playground-<timestamp>.svg` / `.loom`).
- **Out of scope**:
  - PNG export (future nice-to-have).
  - URL sharing (T-016).

### Requirements
- Works fully offline (no network calls) and handles large SVG strings safely.
- Validates that the SVG reflects last-good render; warns if diagnostics present.
- Includes keyboard shortcut (Cmd/Ctrl+S) to open export dialog.

### Acceptance Criteria
- Given a rendered document, when I click "Download SVG", then a file downloads locally and matches the previewed SVG.
- Given editing content, when errors exist, then export dialog warns and allows download of last-good render.

### Implementation Steps
1. Build ExportDialog component (UI) hooked to Preview state for latest SVG + source text.
2. Implement Blob creation + `a` element click trick; add copy-to-clipboard fallback with error toast.
3. Wire hotkey + button in toolbar; write basic tests for dialog state.

### Test/Validation Plan
- Cypress/Playwright automation verifying downloads triggered.
- Manual offline test (turn off network) to ensure exports still function.

### Observability
- Log export type usage counts (SVG vs Loom) to console; capture average SVG size for perf tuning.

### Dependencies / Related Tickets
- Depends on **T-011** for render data (Preview must expose the latest [`render()`](../../src/renderer/index.ts#L42) result) and **T-010** for source text.

### Risks & Mitigations
- **Risk**: Large Blob stalls UI. **Mitigation**: generate Blob lazily and release references after download.
- **Risk**: Clipboard API permissions. **Mitigation**: detect support and show fallback instructions.

### Rollback Strategy
- Hide export dialog entry point and revert module if downloads misbehave.

### References
- [PRD.md §6 Requirements – Export](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §5 API Design](../dev-plan/DEV_PLAN.md#5-api-design)
