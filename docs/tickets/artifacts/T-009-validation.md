# T-009 Validation Log

- `npm run lint --prefix apps/web` → ✅ ESLint 8.57.1 passes with `next/core-web-vitals` config.
- `npm run build --prefix apps/web` → ✅ Next.js 15.5.6 production build + static export succeeds (routes: `/`, `/play`, `/docs`, `/examples`).
- Manual responsive spot-check (browser devtools) confirms AppShell stacks below `768px` and logs `[app-shell] route=<path> viewport=<width>px`.
