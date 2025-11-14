# Loom Ticket Index

| ID | Title | Type | Priority | Estimate | Status | Dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | Finalize Loom DSL & Style Spec v1 | doc | P0 | 0.5 day | ✅ Complete (2025-11-13) | - |
| T-002 | Implement DSL Lexer & Core AST Types | feature | P0 | 1 day | ✅ Complete (2025-11-13) | T-001 |
| T-003 | Build Parser With Incremental Diagnostics | feature | P0 | 1 day | ✅ Complete (2025-11-13) | T-002 |
| T-004 | Implement Layout Engine for Grid & Stacks | feature | P0 | 1 day | ✅ Done (2025-02-14) | T-003 |
| T-005 | Build SVG Renderer With Clean Skin Defaults | feature | P0 | 1 day | ✅ Done (2025-02-14) | T-004 |
| T-006 | Implement Style Block Parser & Selector Engine | feature | P0 | 1 day | ✅ Done (2025-02-14) | T-003 |
| T-007 | Deliver Skin System & Sketch Variant | feature | P1 | 0.5 day | ✅ Done (2025-02-15) | T-005, T-006 |
| T-008 | Implement Breakpoint & Conditional Blocks | feature | P1 | 0.5 day | ✅ Done (2025-02-15) | T-003, T-004, T-011 |
| T-009 | Scaffold Next.js App Shell & Routing | feature | P0 | 0.5 day | ✅ Done (2025-11-14) | - |
| T-010 | Build Editor Panel With Live Diagnostics | feature | P0 | 1 day | ✅ Done (2025-02-15) | T-003, T-009 |
| T-011 | Implement Preview Panel & Render Loop | feature | P0 | 1 day | Not Started | T-004, T-005, T-007, T-009 |
| T-012 | Add Autosave & Zustand State Management | chore | P1 | 0.5 day | Not Started | T-010, T-009 |
| T-013 | Implement Exporter for SVG & .loom Files | feature | P1 | 0.5 day | Not Started | T-011, T-010 |
| T-014 | Build Template Gallery With 5 Bundled Samples | feature | P1 | 1 day | Not Started | T-009, T-011, T-012 |
| T-015 | Author Docs Site for Grammar, Style, Templates | doc | P1 | 1 day | Not Started | T-001, T-009 |
| T-016 | Implement URL Hash Share & Import Flow | feature | P2 | 0.5 day | Not Started | T-012, T-010, T-011 |
| T-017 | Establish Testing & CI Harness | chore | P0 | 1 day | Not Started | T-002, T-003, T-004, T-005 |
| T-018 | Build Performance Benchmarks & Instrumentation | chore | P1 | 0.5 day | Not Started | T-003, T-004, T-005, T-011 |
| T-019 | Implement SVG/Text Sanitization & CSP Hardening | bug | P1 | 0.5 day | Not Started | T-005, T-009 |
