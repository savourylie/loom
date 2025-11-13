# DEV_PLAN.md — Loom Development Plan (No-Backend MVP)

## 1. Technical Overview
- **Pattern**: Parser–Layout–Renderer modules, UI shell in Next.js 15. All client-side; zero backend.
- **Decisions**: shadcn/ui for UI chrome; Hugeicons for icons; Framer Motion for polish. TanStack Query **not used** in MVP.

```mermaid
graph TB
  subgraph Client (Next.js 15)
    E[Editor] --> P[Parser]
    P --> L[Layout Engine]
    L --> R[SVG Renderer]
    E --> X[Exporter]
  end
```

### Rationale
- Keeping the loop tight: no network, no auth. Instant feedback for language design.

## 2. Architecture Design
```mermaid
graph TB
  subgraph "Frontend - Next.js 15"
    A[App Router] --> B[Server Components (docs only)]
    A --> C[Client Components (editor/preview)] 
  end
  subgraph "State & Data"
    Z[Zustand]:::s -- UI state --> C
  end
classDef s fill:#EFF6FF,stroke:#60A5FA;
```

- **EditorPanel (client)**: code editor (textarea/Monaco), error gutter.
- **PreviewPanel (client)**: SVG canvas.
- **Docs (server)**: MDX pages for grammar/style.

## 3. Component Architecture (Atomic)
- **Atoms**: Button, Input, Textarea, Toggle, Tooltip, Dialog, Tabs, Icon.
- **Molecules**: SplitPane, Toolbar, ErrorToast, TemplateCard, StyleSwitcher.
- **Organisms**: EditorPanel, PreviewPanel, TemplateGallery, ExportDialog.
- **Templates**: AppShell (header, split), DocsLayout.
- **Pages**: `/play`, `/docs/*`, `/examples`.

### Reusable Components & Props (examples)
```ts
type EditorPanelProps = {
  value: string;
  onChange: (v: string) => void;
  errors: ParseError[];
};

type PreviewPanelProps = {
  ast: Ast;
  style: StyleSheet;
  skin: 'clean' | 'sketch';
};

type ExportDialogProps = {
  svg: string;
  onDownload: () => void;
};
```

## 4. Data Model
- **No database**. In-memory AST + optional localStorage autosave.
- **Core Types**
```ts
type Node = {
  type: string;
  id?: string;
  classes?: string[];
  label?: string;
  place?: { c?: number; s?: number; r?: number; rs?: number };
  props?: Record<string, string | number | boolean>;
  children?: Node[];
};

type StyleRule = {
  selector: string; // e.g., 'type(card)', '.primary', '#submit'
  decls: Record<string, string | number>;
};

type Document = { grid: { cols: number; gap: number; pad: number }; nodes: Node[]; styles: StyleRule[] };
```

## 5. API Design
- **None in MVP**. Export implemented purely client-side (Blob downloads). Optional URL hash share using compressed DSL (LZ-based).

## 6. State Management
- **Zustand** for UI state (panels, skin, template selection).
- **LocalStorage**: autosave last content and style.
- **URL Hash**: optional share; parse on load.

## 7. Routing & Navigation
- **/play** editor with split view.
- **/docs** MDX reference for grammar & style.
- **/examples** template chooser.

## 8. Styling & Theming
- Tailwind for app chrome. Renderer uses **Loom Style v1**:
  - **Defaults** (clean): surface #fff, stroke #D1D5DB, text #111827, radius card 12, ctrl 8, unit 8px, soft shadow.
  - **Tokens**: `color.brand`, `color.text`, `color.stroke`, `color.surface`, `radius.card`, `radius.ctrl`, `shadow.card`, `u`.
  - **Selectors**: `type()`, `.class`, `#id`.
  - **Declarations**: `fill`, `stroke`, `text`, `radius`, `shadow`, `tone`, `font`, `gap`, `pad`.
  - **Skins**: `clean`, `sketch` (dashed, jitter path).

## 9. Animation Strategy
- Framer Motion: subtle fades on render, toolbar micro-interactions.
- Respect `prefers-reduced-motion`.

## 10. Error Handling & Recovery
- Parser returns structured errors (`line`, `col`, `msg`); editor shows gutter markers.
- Fallback UI shows last good render on error with banner.

## 11. Performance Optimization
- Incremental parse/layout on changed lines (diff by ranges).
- Memoize node-to-box layout; avoid re-creating large SVG trees.
- RequestAnimationFrame batch; debounce input 120–160ms.

## 12. Testing Strategy
- **Unit**: grammar, tokenizer, parser, selector matching, layout math.
- **Integration**: render snapshot tests (SVG string compare with stable IDs).
- **E2E**: Playwright—edit→render→export flows.
- **Performance**: micro-bench for 50/300/1000 nodes.

## 13. Security
- Sanitize labels and text; escape HTML entities.
- Block external image loads by default; allow-list domains behind toggle.
- Strict CSP for the site.

## 14. Development Workflow
- GitHub Flow, PR checks (lint, typecheck, unit + E2E).
- Vercel deploy previews.
- Conventional commits; CHANGELOG generation.

## 15. Deployment & Infrastructure
- Vercel static hosting (no server functions).
- Environment variables: none required in MVP.

## 16. Release Strategy
- Public beta at v1.0.0 with DSL+Style v1.
- Feature flags not required; advanced features behind UI toggles.
- Provide migration notes between DSL versions in docs.

## 17. Week-by-Week Timeline
| Week | Sprint | Deliverables | Risks |
|------|--------|-------------|-------|
| 1 | Spec | DSL v1 & Style v1 spec, parser scaffolding | Spec churn |
| 2 | Core | Parser v1, layout v1 (grid/stack), renderer basics | Edge cases |
| 3 | UX  | Editor/Preview, error UI, default skin polish | SVG quirks |
| 4 | Style | Style blocks, selectors, variables, sketch skin | Complexity creep |
| 5 | Templates | 5 templates, docs site, examples | Scope creep |
| 6 | Polish | Breakpoints, URL share, perf pass, test hardening | Perf issues |

## 18. Documentation
- Grammar reference with examples.
- Style reference (tokens, selectors, skins).
- Templates gallery with copy-to-editor.
- Contribution guide for language proposals.

---
[See Product Requirements](./PRD.md#6-requirements)
