**ID**: T-001
**Title**: Finalize Loom DSL & Style Spec v1
**Type**: doc
**Priority**: P0
**Estimate**: 0.5 day
**Status**: ✅ Done
**Completed**: 2025-11-13

### Summary
Capture the authoritative Loom DSL and Style v1 specification (grammar, components, props, selectors, tokens) in a single, reviewable document so every downstream implementation shares the same contract.

### Why (Goal / outcome)
Reduce churn in parser, renderer, and docs by giving engineers and doc writers an agreed-upon source of truth for syntax, semantics, and defaults before coding begins.

### Scope
- **In scope**:
  - Grammar definitions for layout keywords, components, placement tokens, and props.
  - Style block structure, selector taxonomy, variables, and bundled skins.
  - Performance targets and constraints that affect the language (e.g., node limits).
- **Out of scope**:
  - Implementation of parser, renderer, or UI.
  - Future roadmap items (only v1 MVP scope goes in spec).

### Requirements
- Single markdown doc stored alongside PRD/DEV PLAN with stable anchors for sections referenced by other teams.
- Includes examples that compile plus error exemplars for invalid constructs.
- Explicit table for tokens (gap, pad, tone, etc.) and selector precedence.
- Changelog block noting spec version/date.

### Acceptance Criteria
- ✅ **Given the Loom repo, when I open the spec doc, then I can find grammar, component catalog, and style rules with examples that match PRD §6 must-haves.**
  - Complete: docs/spec/DSL_SPEC_V1.md contains all grammar (placement, alignment, property tokens), 14 components with full property matrices, style system with selector precedence, 4 valid examples + 8 error examples
- ✅ **Given a future change request, when I compare to the spec, then I can see whether it is in or out of scope for v1.**
  - Complete: Spec includes explicit "Scope" section defining in-scope (v1 MVP) vs out-of-scope (future versions) features

### Implementation Steps
1. Consolidate grammar/style content from PRD appendix and DEV PLAN §17 into one markdown outline.
2. Fill gaps (selector precedence, error messaging expectations) and add canonical examples + diagrams.
3. Circulate with parser/rendering owners for async review; address comments; tag version v1.0 in doc header.

### Test/Validation Plan
- Manual doc review checklist ensuring every must-have requirement from PRD §6 is represented.
- Markdown lint (optional) to ensure anchors render correctly.

### Observability
- Track spec version in doc header; reference in downstream tickets to detect drift.
- Record decision log in the doc for future audits of language changes.

### Dependencies / Related Tickets
- None (root artifact).

### Risks & Mitigations
- **Risk**: Spec churn delays implementation. **Mitigation**: time-box review to <1 day and log open questions for follow-up.
- **Risk**: Ambiguous wording. **Mitigation**: add positive/negative examples for every rule.

### Rollback Strategy
- Revert the spec file changes if the direction is rejected; no runtime impact.

### What Changed
- ✅ Created comprehensive DSL & Style Specification v1.0 (1540 lines, 36KB)
  - **File**: [docs/spec/DSL_SPEC_V1.md](../spec/DSL_SPEC_V1.md)
- ✅ Documented complete DSL grammar with token tables
  - Placement tokens: `@c`, `s`, `r`, `rs` for grid positioning
  - Alignment tokens: `at:<h>/<v>` for content alignment
  - Property tokens: `gap`, `pad`, `tone`, `radius`, `w`, `h`, etc.
- ✅ Component catalog: 14 components with full property matrices
  - Containers: grid, hstack, vstack, zstack, section, card
  - UI Elements: text, input, button, image, icon, spacer, list, tabs
- ✅ Style system specification
  - Selector taxonomy: default, type, class, ID
  - Precedence rules: ID (100) > Class (10) > Type (1) > Default (0)
  - Variables, two built-in skins (clean, sketch)
- ✅ Examples: 4 valid examples + 8 error examples covering syntax, semantic, layout, and style errors
- ✅ Performance constraints: <200ms parse+layout+render for ≤300 nodes
- ✅ AST data model reference for implementation teams
- ✅ Decision log documenting 10 key design decisions
- 🔄 **Commit**: (Pending - file created but not yet committed)

### Artifacts
- **Primary Deliverable**: [DSL_SPEC_V1.md](../spec/DSL_SPEC_V1.md)
  - [Grammar Specification](../spec/DSL_SPEC_V1.md#dsl-grammar)
  - [Component Catalog](../spec/DSL_SPEC_V1.md#component-catalog)
  - [Style System](../spec/DSL_SPEC_V1.md#style-system)
  - [Performance Constraints](../spec/DSL_SPEC_V1.md#performance-constraints)
  - [Complete Examples](../spec/DSL_SPEC_V1.md#complete-examples)
  - [AST Data Model](../spec/DSL_SPEC_V1.md#ast-data-model)
  - [Error Handling](../spec/DSL_SPEC_V1.md#error-handling)
  - [Decision Log](../spec/DSL_SPEC_V1.md#decision-log)

### References
- [PRD.md §6 Requirements](../prd/PRD.md#6-requirements)
- [DEV_PLAN.md §17 Week-by-Week Timeline](../dev-plan/DEV_PLAN.md#17-week-by-week-timeline)
