**ID**: T-017
**Title**: Establish Testing & CI Harness
**Type**: chore
**Priority**: P0
**Estimate**: 1 day

### Summary
Set up unit, integration, and E2E testing pipelines plus CI workflows (lint, typecheck, unit, integration, E2E) aligned with DEV PLAN §12.

### Why (Goal / outcome)
Testing protects the DSL/renderer surface from regressions and enforces quality gates before PRs merge.

### Scope
- **In scope**:
  - Configure Jest/Vitest for lexer/parser/layout/renderer units with ts-jest/ts-node.
  - Add Playwright suite for edit→render→export flows (headless) and hook into CI.
  - GitHub Actions (or Vercel) workflow running lint, typecheck, unit, integration, E2E on PRs.
  - Snapshot management strategy (update scripts, review docs).
- **Out of scope**:
  - Perf benchmarking (T-018).

### Requirements
- CI must finish <10 min; caches dependencies for faster reruns.
- Test fixtures stored under `fixtures/` and shared across units/integration.
- Document how to add new tests in CONTRIBUTING.md.

### Acceptance Criteria
- Given a PR, when CI runs, then lint, typecheck, unit, integration, and Playwright suites execute successfully or block merge on failure.
- Given a new DSL fixture, when tests run, then snapshots update via approved script and reviewers can diff outputs easily.

### Implementation Steps
1. Configure testing libraries (Jest/Vitest) with tsconfig paths + coverage thresholds; add sample tests for lexer/parser.
2. Set up Playwright with scenario covering typing, error handling, export.
3. Create CI workflow YAML with caching + job matrix; update docs on running tests locally.

### Test/Validation Plan
- Run all local suites to ensure deterministic output.
- Force a CI failure to confirm blocking behavior, then fix and rerun.

### Observability
- Publish test duration + flake counts from CI logs; optionally add badge for coverage in README.

### Dependencies / Related Tickets
- Depends on foundational modules (**T-002**–**T-005**) being available.
- Supports all downstream work.

### Risks & Mitigations
- **Risk**: Snapshot churn causes flaky reviews. **Mitigation**: enforce reviewable diffs + scripts to prune noise.
- **Risk**: Playwright unstable in CI. **Mitigation**: use retry logic and deterministic fixtures.

### Rollback Strategy
- Temporarily disable failing job while investigating; maintain manual test checklist as fallback.

### References
- [PRD.md §10 Success Metrics](../prd/PRD.md#10-success-metrics)
- [DEV_PLAN.md §12 Testing Strategy](../dev-plan/DEV_PLAN.md#12-testing-strategy)
