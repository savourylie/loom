**ID**: T-019
**Title**: Implement SVG/Text Sanitization & CSP Hardening
**Type**: bug
**Priority**: P1
**Estimate**: 0.5 day

### Summary
Ensure all rendered text is sanitized, external images are blocked or allow-listed, and the playground ships with strict Content Security Policy (CSP) plus security linting per PRD §12.

### Why (Goal / outcome)
Even though Loom is client-only, untrusted content could embed scripts via SVG/text; we must prevent XSS vectors and honor privacy constraints.

### Scope
- **In scope**:
  - Escaping text labels, style strings, and template content before injecting into SVG.
  - Blocking external image URLs by default; allow-list Hugeicons assets only.
  - Configure CSP headers/meta for Next.js deployment (no inline scripts except hashed editor runtime).
  - Security tests ensuring sanitized outputs and CSP coverage.
- **Out of scope**:
  - Auth/access control (non-MVP).

### Requirements
- Centralized sanitizer utility with unit tests covering script tags, HTML entities, unicode escapes.
- Renderer refuses to load `<image>` nodes without allow-listed domain; shows placeholder + warning.
- Next.js config emits CSP meta tags and denies `connect-src` except `self` (no analytics in MVP).

### Acceptance Criteria
- Given text containing `<script>alert()</script>`, when rendered, then SVG shows literal text and DOM inspection reveals escaped characters.
- Given template referencing external image, when previewed, then placeholder renders and console warns about blocked source.
- Given production build, when inspected in browser devtools, then CSP meta/header matches documented policy and blocks inline eval.

### Implementation Steps
1. Implement sanitize utility + apply across renderer + exporter + templates ingestion.
2. Add image source validator; update docs to explain allow-list policy.
3. Configure Next.js `headers()` to emit CSP, test locally, and document security posture.

### Test/Validation Plan
- Unit tests for sanitizer and image validator.
- Playwright security test verifying blocked script injection.
- Manual CSP verification via browser security panel.

### Observability
- Log sanitized-entry counts and blocked image attempts (dev console) to detect misuse patterns.

### Dependencies / Related Tickets
- Depends on **T-005** (renderer) and **T-009** (Next.js shell).
- Related to **T-013** to ensure exported files remain sanitized.

### Risks & Mitigations
- **Risk**: Over-escaping affects formatting. **Mitigation**: whitelist safe tags (e.g., newline) and add regression tests.
- **Risk**: CSP breaks Monaco/editor. **Mitigation**: compute nonce/hashes for required inline scripts and document.

### Rollback Strategy
- Temporarily relax CSP and revert sanitizer changes if they block core flows, while keeping issue tracked.

### References
- [PRD.md §12 Security & Privacy](../prd/PRD.md#12-security--privacy)
- [DEV_PLAN.md §13 Security](../dev-plan/DEV_PLAN.md#13-security)
