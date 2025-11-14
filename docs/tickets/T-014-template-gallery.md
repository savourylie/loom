**ID**: T-014
**Title**: Build Template Gallery With 5 Bundled Samples
**Type**: feature
**Priority**: P1
**Estimate**: 1 day

### Summary
Create the `/examples` experience and in-editor template picker providing at least five curated Loom templates (login, dashboard, settings, detail, form) with preview cards and copy-to-editor actions.

### Why (Goal / outcome)
Templates accelerate onboarding and satisfy PRD success criteria for zero-config first runs.

### Scope
- **In scope**:
  - Template data structure (id, title, thumbnail SVG, DSL source, description).
  - Gallery page with cards (image, description, "Load in editor" CTA) using TemplateCard molecule.
  - Editor template switcher dropdown hooking into store to replace current document (with confirm dialog if unsaved changes).
- **Out of scope**:
  - Community template upload (future).

### Requirements
- Minimum five templates covering PRD scenarios with clean + sketch skin compatibility.
- Thumbnails generated via renderer to avoid drift; cache as static assets or data URIs.
- Loading a template resets undo history and logs analytics event (console for now).

### Acceptance Criteria
- Given I visit `/examples`, when I click a template card, then the DSL loads into `/play` editor and preview updates accordingly.
- Given I have unsaved edits, when I pick a new template, then a confirmation modal prevents accidental overwrite.

### Implementation Steps
1. Author template DSL files + metadata; generate thumbnail SVGs via renderer script.
2. Build TemplateGallery page and TemplateCard component with responsive grid + skeleton states.
3. Wire gallery + editor dropdown to load templates through Zustand store, including confirm dialog + analytics hook.

### Test/Validation Plan
- Component tests for TemplateCard and confirm modal.
- Manual QA loading each template, verifying preview consistency in clean/sketch skins.

### Observability
- Log template load events (template id, source route: gallery or dropdown) to console to understand popularity.

### Dependencies / Related Tickets
- Depends on **T-009**, **T-011**, **T-012**. _(Template previews call [`render()`](../../src/renderer/index.ts#L42) with `skinSettingsFromGlobals()` data so each sample can advertise both clean + sketch skins without hand-tuned SVGs.)_

### Risks & Mitigations
- **Risk**: Thumbnail drift vs renderer updates. **Mitigation**: generate thumbnails via script tied to renderer commit hash.
- **Risk**: Overwriting user work. **Mitigation**: confirm modal + autosave snapshot before replace.

### Rollback Strategy
- Disable gallery navigation and dropdown until issues fixed; revert templates dataset if corrupt.

### References
- [PRD.md §6 Requirements – Templates](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §3 Component Architecture – Molecules & Organisms](../dev-plan/DEV_PLAN.md#3-component-architecture)
