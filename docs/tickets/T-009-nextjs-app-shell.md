**ID**: T-009
**Title**: Scaffold Next.js App Shell & Routing
**Type**: feature
**Priority**: P0
**Estimate**: 0.5 day
**Status**: ✅ Done (2025-11-14)

### Summary
Create the Next.js 15 app router project with base layout, global styles, shared providers, and routes for `/play`, `/docs`, `/examples` per DEV PLAN.

### What Changed
- [[commit](https://github.com/example/loom/commit/t009-app-shell)] Added `apps/web` Next.js 15 workspace with Tailwind/globals, scripts (`npm run dev|lint|build`) and workspace README.
- [[commit](https://github.com/example/loom/commit/t009-app-shell-layout)] Implemented shared `AppShell` layout with responsive panels, navigation, theme toggle, and placeholder CTA wiring for `/play`, `/docs`, `/examples`.
- [[commit](https://github.com/example/loom/commit/t009-app-shell-providers)] Introduced shared providers (`AppProviders`, `StoreProvider`, `ThemeProvider`) plus Zustand store + diagnostics hook so downstream tickets can tap into layout state.
- [[commit](https://github.com/example/loom/commit/t009-app-shell-validation)] Recorded lint/build validation artifacts and root-level npm scripts to run the Next.js shell from repo root.

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
- ✅ Given local dev server, when I visit `/play`, `/docs`, `/examples`, then each route renders using the shared AppShell layout without errors. _Verified via `npm run dev` + manual nav and confirmed `npm run build` succeeds._
- ✅ Given viewport <768px, when layout renders, then panels stack vertically per responsive spec. _Confirmed via responsive devtools + console diagnostics showing arrangement flips to `stacked` below 768px._

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
- Independent but unblocks downstream tickets:
  - **T-010** now mounts inside the [AppShell primary panel](../../apps/web/components/app-shell.tsx) and consumes shared layout state from [StoreProvider](../../apps/web/providers/store-provider.tsx).
  - **T-011** relies on the [AppShell secondary panel](../../apps/web/components/app-shell.tsx) and the same Zustand store for preview sizing plus global theming via [AppProviders](../../apps/web/app/providers.tsx).
  - **T-014** extends the `/examples` stub page at [apps/web/app/examples/page.tsx](../../apps/web/app/examples/page.tsx) to hydrate templates into the editor.
  - **T-015** replaces the `/docs` placeholder [apps/web/app/docs/page.tsx](../../apps/web/app/docs/page.tsx) with MDX-driven content inside the shared shell.

### Risks & Mitigations
- **Risk**: Dependency churn. **Mitigation**: lock versions via `package-lock`/`pnpm-lock` and document setup in README.
- **Risk**: Layout clashes later. **Mitigation**: keep AppShell minimal with slots for future injection.

### Rollback Strategy
- Revert Next.js scaffolding commit and re-bootstrap if necessary.

### References
- [PRD.md §7 User Experience](../prd/PRD.md#7-user-experience)
- [DEV_PLAN.md §2 Architecture Design](../dev-plan/DEV_PLAN.md#2-architecture-design)

### Engineer Notes (2025-11-14)
- Assuming the Next.js experience can live inside `apps/web` as a standalone npm workspace that does not yet integrate with the root DSL build tooling. This keeps the change reversible while we validate the shell before wiring it to the compiler packages.

### Artifacts
- [apps/web/README.md](../../apps/web/README.md) – workspace usage, routes, and command reference.
- [T-009 validation log](./artifacts/T-009-validation.md) – lint/build outcomes and responsive spot checks.
