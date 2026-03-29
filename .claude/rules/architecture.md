# Architecture

## Tech Stack
- **Framework:** React 18 + TypeScript (Vite)
- **Base UI:** HeroUI (NOT shadcn) — all buttons, inputs, modals, selects come from @heroui/react
- **State:** Zustand (stores/) + TanStack Query (server state)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v7 (pages/)
- **Styling:** Tailwind CSS v4 + TYRO design tokens (see tyro-saas-skill/references/foundation.md)
- **Auth:** MSAL (@azure/msal-browser + @azure/msal-react)
- **Database:** Supabase
- **i18n:** i18next + react-i18next (TR primary, EN secondary)
- **Animation:** Framer Motion
- **Charts:** Tremor + Recharts
- **DnD:** Pragmatic DnD (@atlaskit/pragmatic-drag-and-drop)

## Directory Structure
```
src/
  pages/           → Route-level page components (one per route)
  components/
    layout/        → Sidebar, Navbar, AppShell
    kokpit/        → Dashboard/cockpit components
    aksiyonlar/    → Action management components
    projeler/      → Project management components
    workspace/     → Workspace/my-work components
    dashboard/     → Dashboard widgets, report wizard
    pm/            → Project management (Gantt, Kanban, tree)
    crud/          → Generic CRUD table/form components
    wizard/        → Multi-step wizard components
    shared/        → Reusable components (ConfirmDialog, StatusBadge, etc.)
    ui/            → Low-level UI primitives
    __tests__/     → Component unit tests
  hooks/           → Custom React hooks (useXxx pattern)
  stores/          → Zustand stores (xxxStore.ts pattern)
  lib/             → Utility modules (i18n, supabase client, etc.)
  locales/         → tr.json + en.json translation files
  types/           → TypeScript type definitions
  config/          → App configuration (MSAL, routes, etc.)
  styles/          → Global CSS (globals.css with Tailwind)
```

## Conventions
- Path alias: `@/` maps to `src/`
- Components: PascalCase filenames, named exports preferred
- Hooks: `use` prefix, one hook per file in hooks/
- Stores: camelCase with `Store` suffix (e.g., `filterStore.ts`)
- Pages: PascalCase, matching route name
- Never import from `node_modules` directly when an alias exists
