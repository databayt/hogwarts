---
name: i18n-check
description: Scan files for hardcoded English strings and report translation gaps
---

Audit the specified files (or `src/components/school-dashboard/` by default) for hardcoded English strings that should use dictionary keys or i18n helpers.

$ARGUMENTS

## Scan Process

1. Run these grep patterns across target files:
   - `<FormLabel>[A-Za-z][^{<]+</FormLabel>` — hardcoded form labels
   - `toast\.(success|error|warning|info)\(["'][A-Za-z]` — hardcoded toasts
   - `<Button[^>]*>[A-Za-z][^{<]+</Button>` — hardcoded buttons
   - `error:\s*["'][A-Z]` — hardcoded error returns
   - `label:\s*["'][A-Z]` — hardcoded select labels
   - `\.(min|max|email|url|regex|refine)\([^)]*["'][A-Z]` — hardcoded Zod messages
   - `(title|name|description|label|body)(Ar|En|Arabic|English)\b` — bilingual field names
   - `placeholder=["'][A-Z][^"'{]+["']` — hardcoded placeholders

2. Skip files in `dictionaries/`, `__tests__/`, `.test.`, `.spec.`

3. Report results grouped by anti-pattern type with file:line references

4. Output summary with counts per type and total

## Fix Reference

See `.claude/rules/translation.md` for correct patterns. Key helpers:

- `ValidationHelper` from `@/components/internationalization/helpers`
- `ToastHelper` from `@/components/internationalization/helpers`
- `ErrorHelper` from `@/components/internationalization/helpers`
- `createI18nHelpers(dictionary.messages)` returns all three
