Review the recent code changes against TYRO project standards:

1. Run `git diff` to see current uncommitted changes (or `git diff HEAD~1` for last commit)
2. Check each changed file against these rules:
   - **i18n:** No hardcoded Turkish/English strings. All UI text uses `t("key")`.
   - **UI Rules:** Font sizes, button styles, colors match `UI_RULES.md`. No 10px fonts, no opacity on muted text.
   - **Architecture:** Files in correct directories per `.claude/rules/architecture.md`. Correct naming patterns.
   - **Error handling:** No empty catch blocks, errors go through toast store.
   - **TypeScript:** No `any` types, no `@ts-ignore` without explanation.
3. Run `npm run i18n:check` and `npm run i18n:scan`
4. Run `npm run test` if test files were changed
5. Report findings with file:line references and suggested fixes
