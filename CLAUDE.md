# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TYRO Strategy — enterprise strategic project + action management SaaS for Tiryaki Agro. React 19 + TypeScript + Vite + Supabase + MSAL (Azure AD). Production at `https://tyrostrategy.ttech.business/`. Two GitHub remotes: `origin` (tyrostrategy/tyrostrategy.github.io) + `tyroai` (TYROAIHUB/tyrostrategy) — both deploy to GitHub Pages, push to both on every change.

## Detailed rule files

| Topic | File |
|-------|------|
| Tech stack, folder structure, naming | `.claude/rules/architecture.md` |
| UI rules, fonts, buttons, panels, forms | `.claude/rules/ui-guidelines.md` + `UI_RULES.md` |
| Mobile UI, liquid glass, touch targets | `.claude/rules/mobile-ui.md` |
| Translations, casing, locale workflow | `.claude/rules/i18n.md` |
| TypeScript, React patterns, perf | `.claude/rules/code-style.md` |
| Error handling, toasts, Supabase sync | `.claude/rules/error-handling.md` |
| Test framework, conventions | `.claude/rules/testing-rules.md` |

## Dev commands

```bash
npm run dev               # Vite dev server (port 5173)
npm run build             # production build
npm run preview           # preview the build
npm run test              # vitest run
npm run test:watch        # vitest watch
npm run i18n:check        # validate TR/EN key sync
npm run i18n:scan         # find hardcoded TR strings in TSX
npm run smoke             # end-to-end CRUD smoke test on LIVE Supabase (≈47 steps, ~10s)
npm run hooks:install     # install repo-shared git hooks into .git/hooks
```

Single test: `npx vitest run src/path/to/file.test.ts -t "test name"`.

## Data layer architecture

Mode is selected at boot via `VITE_DATA_PROVIDER` (`mock` | `supabase`). `src/lib/supabaseMode.ts` exposes `isSupabaseMode`. Mock mode keeps cascade-data seeds; Supabase mode starts with empty arrays and fetches on bootstrap.

Three layers, top → bottom:

1. **`src/stores/dataStore.ts` (Zustand)** — single source of truth for the UI. Optimistic CRUD: `addX/updateX/deleteX` mutate local state synchronously, then fire-and-forget through `syncToSupabase(...)`. State is persisted to `localStorage` so a hard refresh shows the last-known data while the new fetch is in flight.
2. **`src/lib/data/supabaseAdapter.ts`** — REST adapter over `@supabase/supabase-js`. Encapsulates the DB ↔ App shape mapping (snake_case ↔ camelCase, link tables for participants/tags). **Adapter contract: every mutation must `throw` on error** — `return null` / `return !error` is forbidden because it bypasses `syncToSupabase`'s retry + toast pipeline. `fetchX` may degrade to `[]` (UI shows empty state). Also: `createAksiyon` / `createProje` no longer send the `id` field — the DB trigger assigns it (see *ID generation*) and `RETURNING *` returns the real one; the dataStore drift fix swaps that ID into zustand.
3. **PostgREST + Postgres + RLS** — `supabase/migrations/NNN_*.sql` are numeric, append-only, idempotent (CREATE OR REPLACE / DROP IF EXISTS). Migrations are NEVER mutated retroactively — fix mistakes by adding a new migration that supersedes.

### `syncToSupabase` contract (`dataStore.ts`)

- Returns `Promise<unknown>` so callers (e.g. wizards) can await chained creates.
- Retry schedule: ~2s, ~5s with ±30% jitter (anti-thundering-herd for the 50-user cohort). Total ≤ ~7s.
- **Permanent errors fast-path** — `42501` (RLS deny), `23xxx` (constraint), `22xxx` (data exception), `42P01/42P17` (table/recursion) skip retry and toast immediately.
- Caller passes a `SyncContext` (`{ entity, action, label }`) so the toast shows `Aksiyon "Canlı Geçiş" oluşturma başarısız: yetkiniz yok. Tekrar deneyin.` instead of a generic message.
- Internal `_pendingCreates` Map exposes `waitForPendingSync(id)` for parent→child create races (used by `ProjeAksiyonWizard`).

### ID generation (proje + aksiyon)

- Adapter mutations **do NOT send `id`**. INSERT goes id-less; the `BEFORE INSERT` trigger (migration 026, `app.assign_aksiyon_id` / `app.assign_proje_id`) uses `pg_advisory_xact_lock` to serialize parallel inserts and assign `NEW.id` atomically — wizard's "1 proje + 4 aksiyon" flow gets distinct sequential IDs even under burst load.
- Format: `A{YY}-{NNNN}` (aksiyon, prefix from `current_date`) / `P{YY}-{NNNN}` (proje, prefix from `start_date`). Counter resets to `0001` on year rollover (next insert in 2027 → `A27-0001`). Above 9999 the function widens past 4 digits instead of truncating.
- Defense-in-depth: migration 027 `CHECK (id ~ '^[A][0-9]{2}-[0-9]+$')` (and `^[P]` for projeler) blocks malformed IDs at the table level — even if the trigger were dropped, corruption can't slip in.
- The trigger short-circuits when `NEW.id` is already set, preserving backward compatibility for data imports / `scripts/smoke-test-crud.cjs` (which uses `P26-9991` / `A26-9991`).
- `dataStore.addAksiyon` writes a temporary client-side ID (`generateSystematicId`) to zustand for the optimistic render, then **swaps** it for the DB-returned ID once the adapter resolves. In mock mode the swap is short-circuited, so the client-side ID stays.
- Migration 024's RPCs (`app.next_aksiyon_id`, `app.next_proje_id`) still exist in the DB but the adapter no longer calls them — kept around for any legacy caller.

### Identity & RLS

- Auth: MSAL (Azure AD); the user's email is forwarded as `X-User-Email` on every supabase-js HTTP request via the `global.fetch` wrapper in `src/lib/supabase.ts`. `currentUserEmail` is seeded synchronously at module load by reading the MSAL `localStorage` cache so the first request after F5 already has the header — needed because MSAL `initialize()` is async.
- Server-side identity: `app.current_email()` reads the header GUC; `app.current_role()` joins on `users.email`; `app.has_perm(path)` resolves nested JSONB paths (`'pages.kullanicilar'` → `permissions #>> '{pages,kullanicilar}'`); `app.flag('viewOnlyOwn' | 'editOnlyOwn')` reads from role_permissions.
- Edit-permission rule (after migration 023): `editOnlyOwn=true` roles edit a project / its actions iff `app.is_member(proje_id)` is true (owner OR participant). Aksiyon's own `owner` field is **not** part of the edit decision.
- `users` UPDATE has `WITH CHECK (true)` — the strict "self can only change locale" rule is enforced by the BEFORE UPDATE trigger `app.guard_user_self_locale_only()` to avoid the WITH-CHECK-subquery → users-SELECT recursion that broke production once.

### Applying migrations

```bash
PGHOST='aws-1-eu-central-1.pooler.supabase.com' PGPORT='6543' \
PGUSER='postgres.edexisfpfksekeefmxwf' PGPASSWORD='...' \
node scripts/apply-migration-direct.cjs <NN>
```

The script runs the migration in a transaction, then automatically runs `npm run smoke` (set `SKIP_SMOKE=1` to bypass for seed migrations). If smoke fails the migration is flagged for rollback. The Supabase Dashboard SQL Editor is also available for manual application — but it does **not** trigger the post-migration smoke, so remember to run `npm run smoke` afterwards.

A third path: if the Supabase MCP server is connected, `mcp__supabase__apply_migration` applies the SQL directly **and** records it in `supabase_migrations.schema_migrations`. The `apply-migration-direct.cjs` script does **not** write to that table, so migrations applied via the script are invisible to MCP `list_migrations`. Pick one tool per migration to keep history coherent.

## Smart pre-push hook

`scripts/git-hooks/pre-push` (installed by `npm run hooks:install`) inspects the commits being pushed and runs `npm run smoke` only if any of these patterns changed:

```
src/lib/data/supabaseAdapter | src/stores/dataStore | src/lib/supabase.ts |
src/types/index | supabase/migrations/ | scripts/smoke-test-crud
```

Pure UI / i18n / styling commits are skipped — no wasted egress. Smoke fail aborts the push; emergency bypass: `git push --no-verify`. The hook is **per-clone**, run `npm run hooks:install` after fresh clone.

## Push workflow

Two remotes need to be pushed for every change:

```bash
git push origin main
git push tyroai main
```

GitHub Pages on TYROAIHUB occasionally races with the previous deployment ("in progress" lock) — re-run via `gh run rerun <run_id> -R TYROAIHUB/tyrostrategy --failed`, or push an empty commit to force a fresh SHA when the Pages deploy state is stuck.

## Critical rules

1. **i18n first** — every user-visible string uses `t("key")`; add to both `tr.json` + `en.json` before writing the component; run `npm run i18n:check` after. Sentence case everywhere.
2. **HeroUI, not shadcn** — base components from `@heroui/react`. Never raw `<button>`.
3. **TYRO design tokens** — `--tyro-navy`, `--tyro-gold`, etc. Never arbitrary hex.
4. **No `any`** — use proper types or `unknown`. No `@ts-ignore` without explanation.
5. **No silent errors** — every adapter mutation throws; every error reaches the user via `toast`. The phrase "Veri senkronizasyonu başarısız" alone is the legacy generic — new sync calls pass a `SyncContext` so the user sees which record + action.
6. **No hardcoded data** — user names from auth context, options from store/API, constants named.
7. **Form footer** — Cancel + Submit; primary action on the right.
8. **Tests for shared code** — components in `shared/`, hooks, and stores need unit tests. CRUD-touching changes also need to keep `npm run smoke` green.

## Slash commands

| Command | Description |
|---------|-------------|
| `/project:i18n-fix` | Scan, fix, and sync all translation issues |
| `/project:review` | Review recent changes against TYRO standards |
| `/project:ui-audit` | Audit a component for `UI_RULES.md` compliance |

## Design system

`tyro-saas-skill/references/` holds the modular design system (read `foundation.md` first for tokens; `dashboard.md`, `crud.md`, `animations.md`, `auth.md`, `responsive.md`, `search-filter.md`, `project-management.md` for component-class patterns).
