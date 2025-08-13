## Settings (School profile, locale, timezone) — Readiness Checklist

Scope: Basic settings route and actions; requires polish for full MVP.

### Evidence

- Route: `/(platform)/settings/page.tsx` with actions in `/(platform)/settings/actions.ts`.
- Docs: multiple references to school profile, locale (ar/en), timezone.

### Ship checklist

- [ ] Form with fields: name, logo, timezone (Africa/Khartoum default), locale (ar/en)
- [ ] Zod validation + server parse
- [ ] Persist to `School` model by `schoolId`
- [ ] Revalidate/redirect on success; toasts
- [ ] i18n strings
- [ ] Minimal test for action and tenant scoping

### Decision

- Status: PARTIAL — Ship after form polish



