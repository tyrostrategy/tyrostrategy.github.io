# TYRO Strategy App

Enterprise strategic planning SaaS application built with React + TypeScript + HeroUI.

## Quick Reference

| Topic | Rule File |
|-------|-----------|
| Tech stack, folder structure, naming | [architecture.md](.claude/rules/architecture.md) |
| UI rules, fonts, buttons, panels, forms | [ui-guidelines.md](.claude/rules/ui-guidelines.md) + [UI_RULES.md](UI_RULES.md) |
| Translations, casing, locale workflow | [i18n.md](.claude/rules/i18n.md) |
| TypeScript, React patterns, no-any, perf | [code-style.md](.claude/rules/code-style.md) |
| Error handling, toasts, Supabase sync | [error-handling.md](.claude/rules/error-handling.md) |
| Test framework, conventions, when to test | [testing-rules.md](.claude/rules/testing-rules.md) |

## Critical Rules (Always Apply)

1. **i18n first:** Every user-visible string uses `t("key")`. Add to both `tr.json` + `en.json` before writing the component. Run `npm run i18n:check` after. Sentence case everywhere.
2. **HeroUI, not shadcn:** All base components from `@heroui/react`. Never raw `<button>` elements.
3. **TYRO design tokens:** Use `--tyro-navy`, `--tyro-gold`, etc. Never arbitrary hex values.
4. **No `any`:** Use proper types or `unknown`. No `@ts-ignore` without explanation.
5. **No hardcoded data:** User names from auth context, filter options from API/store, constants named.
6. **Form footer:** Always has Cancel + Submit buttons. Primary action on the right.
7. **Errors to user:** No silent `console.error` — all failures show toast notification.
8. **Tests for shared code:** New components in `shared/`, hooks, and stores need unit tests.

## Slash Commands

| Command | Description |
|---------|-------------|
| `/project:i18n-fix` | Scan, fix, and sync all translation issues |
| `/project:review` | Review recent changes against all TYRO standards |
| `/project:ui-audit` | Audit a component for UI_RULES.md compliance |

## Dev Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run test         # Run Vitest
npm run i18n:check   # Validate TR/EN key sync
npm run i18n:scan    # Find hardcoded Turkish strings in TSX
```

## Design System

Full design system is defined in `tyro-saas-skill/` with modular references:
- `references/foundation.md` — Color tokens, typography, glassmorphism (READ FIRST)
- `references/dashboard.md` — KPI cards, charts, metrics
- `references/crud.md` — Tables, forms, data entry
- `references/animations.md` — Micro-interactions, hover effects
- `references/auth.md` — MSAL, Azure AD login
- `references/responsive.md` — Mobile/tablet breakpoints
- `references/search-filter.md` — Command palette, filters
- `references/project-management.md` — Gantt, Kanban, tree view
