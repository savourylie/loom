**ID**: T-009
**Title**: Scaffold Next.js App Shell & Routing
**Type**: feature
**Priority**: P0
**Estimate**: 0.5 day

### Summary
Create the Next.js 15 app router project with base layout, global styles, shared providers, and routes for `/play`, `/docs`, `/examples` per DEV PLAN.

### Why (Goal / outcome)
Provides the UI frame where editor, preview, docs, and templates live, enabling incremental feature integration.

### Scope
- **In scope**:
  - Initialize Next.js (App Router) project with shadcn/ui, Tailwind config, fonts, and global CSS.
  - Define shared layout (AppShell) with header, theme toggle placeholder, responsive split container.
  - Stub pages for `/play`, `/docs`, `/examples` with placeholder content.
- **Out of scope**:
  - Editor/Preview functionality (T-010/T-011).
  - Docs content (T-015).

### Requirements
- Build passes lint/typecheck; base layout responsive (stack on small screens, split on desktop).
- Include shared providers (Zustand context, theme) even if empty initially.
- Navigation header includes links to play/docs/examples and export button placeholder.

### Acceptance Criteria
- Given local dev server, when I visit `/play`, `/docs`, `/examples`, then each route renders using the shared AppShell layout without errors.
- Given viewport <768px, when layout renders, then panels stack vertically per responsive spec.

### Implementation Steps
1. Bootstrap Next.js project (pnpm/yarn) with required dependencies (shadcn/ui, Tailwind, Hugeicons, Framer Motion).
2. Implement AppShell layout + navigation + responsive split container.
3. Add placeholder content for each route and commit baseline storybook/test harness if needed.

### Test/Validation Plan
- Run `next lint` + `next build` smoke tests.
- Manual responsive check via browser devtools.

### Observability
- Add basic console log on mount for page route + viewport width to validate layout decisions during early dev (remove before release if noisy).

### Dependencies / Related Tickets
- Independent but unblocks **T-010**, **T-011**, **T-015**, **T-014**.

### Risks & Mitigations
- **Risk**: Dependency churn. **Mitigation**: lock versions via `package-lock`/`pnpm-lock` and document setup in README.
- **Risk**: Layout clashes later. **Mitigation**: keep AppShell minimal with slots for future injection.

### Rollback Strategy
- Revert Next.js scaffolding commit and re-bootstrap if necessary.

### References
- [PRD.md §7 User Experience](../prd/PRD.md#7-user-experience)
- [DEV_PLAN.md §2 Architecture Design](../dev-plan/DEV_PLAN.md#2-architecture-design)
