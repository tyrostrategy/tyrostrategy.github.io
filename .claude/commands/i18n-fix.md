Run the i18n validation pipeline and fix any issues:

1. Run `npm run i18n:check` to find mismatched keys between tr.json and en.json
2. Run `npm run i18n:scan` to find hardcoded Turkish strings in TSX files
3. For each hardcoded string found:
   - Create an appropriate i18n key following the naming convention in `.claude/rules/i18n.md`
   - Add the Turkish value to `src/locales/tr.json`
   - Add the English translation to `src/locales/en.json`
   - Replace the hardcoded string with `t("key")` in the component
4. For each missing key (in one locale but not the other):
   - Add the missing key with an appropriate translation
5. Re-run both checks to verify everything passes
6. Report a summary of what was fixed
