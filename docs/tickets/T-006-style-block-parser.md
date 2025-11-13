**ID**: T-006
**Title**: Implement Style Block Parser & Selector Engine
**Type**: feature
**Priority**: P0
**Estimate**: 1 day

### Summary
Parse `style` blocks, selectors (`type()`, `.class`, `#id`), declarations, and variables into a structured stylesheet plus an evaluator that matches rules to nodes at render time.

### Why (Goal / outcome)
Separate styling is a Loom differentiator; we need a reliable way to interpret style blocks and apply them consistently to renderer skins.

### Scope
- **In scope**:
  - Style block grammar parsing (including nested selectors and `let` variables) using parser hooks.
  - Selector specificity calculation and matching against node attributes.
  - Resolved style object output (merged defaults + user rules) handed to renderer.
- **Out of scope**:
  - Skin visual assets (handled by T-007).
  - Breakpoint-specific style overrides (handled by T-008).

### Requirements
- Supports multiple style blocks with named skins (`style default { ... }`).
- Handles variable definitions/reference with detection of undefined variables.
- Provides diagnostics for unsupported properties or selector typos.
- Unit tests for selector precedence, variable substitution, and error cases.

### Acceptance Criteria
- Given a document with `style default` and `.primary` selectors, when parsed/evaluated, then renderer receives merged tokens reflecting overrides.
- Given an undefined variable reference, when parsing, then diagnostics flag the line/col and default values remain unchanged.

### Implementation Steps
1. Extend parser to capture style blocks into AST structures.
2. Build selector matcher and specificity ranking + resolver merging defaults with overrides.
3. Write unit tests verifying precedence, variable substitution, and diagnostic handling.

### Test/Validation Plan
- Unit tests for parser + evaluator (Vitest/Jest) with inline fixtures.
- Integration test that renders sample doc applying style overrides.

### Observability
- Count style diagnostic occurrences and log when selectors fail to match any nodes (helps authors debug).

### Dependencies / Related Tickets
- Depends on **T-003**.
- Enables **T-007**, **T-015**.

### Risks & Mitigations
- **Risk**: Selector precedence bugs. **Mitigation**: align algorithm to CSS rules, add unit coverage for ties.
- **Risk**: Variable scoping confusion. **Mitigation**: restrict to style-block scope and document clearly.

### Rollback Strategy
- Fall back to default skin-only rendering by disabling style overrides if regressions occur.

### References
- [PRD.md §3 Solution Overview – Styling Separation](../prd/PRD.md#3-solution-overview)
- [DEV_PLAN.md §8 Styling & Theming](../dev-plan/DEV_PLAN.md#8-styling--theming)
