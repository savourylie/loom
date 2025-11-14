**ID**: T-015
**Title**: Author Docs Site for Grammar, Style, Templates
**Type**: doc
**Priority**: P1
**Estimate**: 1 day

### Summary
Build the `/docs` MDX site detailing Loom DSL grammar, style system, tokens, and how-to guides, plus cross-links to templates and spec.

### Why (Goal / outcome)
Documentation ensures users can self-serve learning the language; aligns with DEV PLAN §18.

### Scope
- **In scope**:
  - MDX pages for Overview, Grammar Reference, Style Reference, Templates Guide, Contribution Guide.
  - Navigation sidebar, search (client filter), code samples with syntax highlighting.
  - Links back to spec (T-001) and interactive code snippets (copy button).
- **Out of scope**:
  - External doc hosting (use same Next.js app).
  - Localization.

### Requirements
- Docs route uses server components where possible for fast loads.
- Each page includes runnable snippet (copy/paste) validated against parser tests.
- Include accessibility pass (heading order, skip links) per PRD §13.

### Acceptance Criteria
- Given `/docs`, when navigated, then sidebar lists sections and content renders with live code samples.
- Given grammar change, when doc is updated, then references link back to spec anchors and lints pass.

### Implementation Steps
1. Set up MDX support in Next.js with remark/rehype plugins for code titles and autolink headers.
2. Populate pages with content derived from spec + templates, ensuring examples compile.
3. Add sidebar navigation + search filter; run accessibility and link checks.

### Test/Validation Plan
- Automated link checker and MDX lint.
- Manual QA for copy buttons and keyboard navigation.

### Observability
- Log doc page views + search queries to console (dev builds) to gauge interest; can be replaced later with analytics.

### Dependencies / Related Tickets
- Depends on **T-001** and **T-009**.
  - ✅ **T-001 Complete (2025-11-13)**: DSL specification available as source material at [docs/spec/DSL_SPEC_V1.md](../spec/DSL_SPEC_V1.md)
  - **Content to integrate into docs site**:
    - Overview & introduction: [Introduction](../spec/DSL_SPEC_V1.md#introduction)
    - Grammar reference: [DSL Grammar](../spec/DSL_SPEC_V1.md#dsl-grammar) with all tokens
    - Component reference: [Component Catalog](../spec/DSL_SPEC_V1.md#component-catalog) with 14 components
    - Style system guide: [Style System](../spec/DSL_SPEC_V1.md#style-system) including selectors, variables, skins
    - Complete examples: [Examples Section](../spec/DSL_SPEC_V1.md#complete-examples) (4 valid + 8 error examples)
    - Error reference: [Error Handling](../spec/DSL_SPEC_V1.md#error-handling) with error codes
- Related to **T-014** for template docs.
  - ✅ **T-009 Done (2025-11-14)**: `/docs` now routes through [apps/web/app/docs/page.tsx](../../apps/web/app/docs/page.tsx) and shared [AppShell](../../apps/web/components/app-shell.tsx); this ticket replaces the placeholders with MDX content + server components while keeping AppShell header intact.

### Risks & Mitigations
- **Risk**: Docs drift from implementation. **Mitigation**: include snippet tests referencing parser to keep examples valid.
- **Risk**: MDX bundler increases build time. **Mitigation**: leverage RSC for static content and memoize heavy components.

### Rollback Strategy
- Revert MDX integration and fall back to static markdown pages if blocking issues occur.

### References
- [PRD.md §18 Documentation](../prd/PRD.md#18-documentation)
- [DEV_PLAN.md §18 Documentation](../dev-plan/DEV_PLAN.md#18-documentation)
