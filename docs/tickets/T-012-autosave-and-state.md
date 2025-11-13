**ID**: T-012
**Title**: Add Autosave & Zustand State Management
**Type**: chore
**Priority**: P1
**Estimate**: 0.5 day

### Summary
Introduce a centralized Zustand store for editor/playground UI state plus localStorage autosave/restore of the last Loom document and settings.

### Why (Goal / outcome)
Prevents data loss and enables coordinated UI behavior (skin toggles, zoom, template selection) without prop drilling.

### Scope
- **In scope**:
  - Zustand store slices for editor content, active template, skin, zoom level, guides toggle.
  - Persistence layer writing DSL + style + metadata to localStorage on debounce, reading on load.
  - Autosave status indicator in UI.
- **Out of scope**:
  - URL share encoding (T-016).
  - Cross-device sync (not in MVP).

### Requirements
- Saves state within 1s of idle; prevents autosave during parse errors unless explicitly set to allow.
- Hydrates state on load respecting `prefers-reduced-motion` (no jank) and handles schema migrations gracefully.
- Includes opt-out toggle (privacy) per PRD non-goals.

### Acceptance Criteria
- Given I type DSL and refresh the page, when app reloads, then my last code, style, and UI settings are restored.
- Given I toggle autosave off, when I edit, then no writes occur and indicator reflects disabled state.

### Implementation Steps
1. Define Zustand slices and selectors; wrap Provider in AppShell.
2. Implement autosave middleware (debounced) writing to localStorage with schema version.
3. Add UI indicator + opt-out toggle; write unit tests for persistence logic.

### Test/Validation Plan
- Unit tests for persistence middleware (mock localStorage).
- Manual QA toggling autosave, clearing storage, verifying migration fallback.

### Observability
- Log autosave write/read durations and failure counts (try/catch) to console; expose metric for disabled users to gauge feature usage.

### Dependencies / Related Tickets
- Depends on **T-010**, **T-009**.
- Supports **T-016**, **T-014**.

### Risks & Mitigations
- **Risk**: localStorage quota errors. **Mitigation**: cap payload size, compress if necessary.
- **Risk**: State shape drift. **Mitigation**: include schema version + migration function.

### Rollback Strategy
- Disable autosave middleware and clear stored keys if bugs appear; revert commit.

### References
- [PRD.md §6 Requirements – Export & Offline](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §6 State Management](../dev-plan/DEV_PLAN.md#6-state-management)
