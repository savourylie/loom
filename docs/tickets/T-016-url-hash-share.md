**ID**: T-016
**Title**: Implement URL Hash Share & Import Flow
**Type**: feature
**Priority**: P2
**Estimate**: 0.5 day

### Summary
Allow users to encode current Loom document into the URL hash using compression (LZ-string or similar) so they can share playground state without backend storage.

### Why (Goal / outcome)
Provides lightweight sharing (a "Should-have" requirement) while keeping the product backend-free.

### Scope
- **In scope**:
  - Serialize DSL + style + skin metadata into compressed string appended to URL hash on demand (Share button).
  - Parse hash on load to populate editor/preview if data present.
  - Handle errors (invalid hash) gracefully with toast + fallback to templates/autosave.
- **Out of scope**:
  - Persisted server URLs or analytics.

### Requirements
- Compression ratio sufficient for ~10KB docs without exceeding URL limits (<2KB zipped ideally).
- Manual opt-in (Share button) to avoid URL churn while typing.
- Includes copy-to-clipboard of generated link.

### Acceptance Criteria
- Given I click "Share link", when dialog opens, then URL containing `#loom=<encoded>` is generated and copying it allows another user to load same state when visiting.
- Given corrupted hash, when page loads, then user gets toast warning and default template loads without crashing.

### Implementation Steps
1. Add encoder/decoder utilities using LZ-string (or pako) with JSON payload {dsl, style, skin}.
2. Build Share dialog hooking into autosave/Zustand state; update URL hash when requested.
3. Handle hash parsing on app init + listen for hashchange events; integrate with history API.

### Test/Validation Plan
- Unit tests for encode/decode utilities verifying round-trip accuracy.
- Cypress test covering share flow: generate link, open in new tab, confirm state match.

### Observability
- Log share generation events + payload byte size to console for performance tracking.

### Dependencies / Related Tickets
- Depends on **T-012**, **T-010**, **T-011**.

### Risks & Mitigations
- **Risk**: Links exceed browser URL length. **Mitigation**: compress aggressively; warn when payload too large.
- **Risk**: Hash collisions. **Mitigation**: include version + checksum to validate payload.

### Rollback Strategy
- Hide share button and ignore hashes until issue resolved; existing links will revert to default behavior.

### References
- [PRD.md §6 Requirements – URL-based Share](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §5 API Design](../dev-plan/DEV_PLAN.md#5-api-design)
