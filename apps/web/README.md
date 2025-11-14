# Loom App Shell (`apps/web`)

Scaffolded with Next.js 15 (App Router) and Tailwind so we can host the Loom DSL playground, docs, and template gallery inside a single responsive shell.

## Available routes

- `/play` – editor/preview split view placeholder with DSL sample.
- `/docs` – server-friendly docs layout stub.
- `/examples` – template gallery cards wired for future state hydration.

## Commands

```bash
npm run dev     # start local server on http://localhost:3000
npm run lint    # Next.js lint (includes type-aware rules)
npm run build   # smoke build to ensure the app router compiles
```

## Implementation notes

- Shared providers (`next-themes` + Zustand) live in `app/providers.tsx`.
- `AppShell` owns the navigation header and responsive split container—panels stack below `768px`, and a console log records the current route + viewport width for debugging.
- UI primitives borrow the shadcn/ui pattern (`components/ui`) with Hugeicons for visual flourishes.
- Tailwind tokens + CSS variables live in `app/globals.css`; update `tailwind.config.js` when adding new component directories.
