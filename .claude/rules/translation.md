---
paths:
  - "src/components/**"
  - "src/app/**"
---

# Translation Rules (CRITICAL)

## Single-Language Storage

All content is stored in ONE language with a `lang` field. NEVER use bilingual field names (`titleEn`/`titleAr`, `nameAr`/`nameEn`). Use generic field names: `title`, `body`, `name`, `description`.

## Two Translation Systems

### 1. Static UI (Dictionary System)

For labels, buttons, headings, placeholders, error messages, toast messages, select options:

- Server: `const dictionary = await getDictionary(lang)` from `@/components/internationalization/dictionaries`
- Client: receive `dictionary` as props from server component
- Helpers: `ValidationHelper`, `ToastHelper`, `ErrorHelper` from `@/components/internationalization/helpers`
- Factory: `createI18nHelpers(dictionary.messages)` or `useI18nMessages(dictionary)`

### 2. Dynamic Content (On-Demand Translation)

For user-generated DB content (announcements, subjects, student names, etc.).
**PREFERRED — batched APIs (one DB resolution per render, never per row):**

- **Lists of a registered model** (see `registry.ts` TRANSLATABLE map):
  `localize(model, rows, { schoolId, lang })` from `@/components/translation/localize` — ONE findMany for N rows.
- **Single row of a registered model**: `localizeOne(model, row, { schoolId, lang })`.
- **Person names**: `getNames(rows, accessor, lang, schoolId)` from `@/components/translation/person` — batched, transliteration fallback when the API is down.
- **Arbitrary short strings / unregistered fields**: `getLabels(values, lang, schoolId)` — batched, deduped, returns `Map<source, translated>`.
- **Write actions (create AND update)**: `after(() => prewarm(model, row, { schoolId }))` from `@/components/translation/prewarm` — pre-fills the cache so the first reader in the other language never waits.

**Single-value only** (acceptable for one genuinely single value — NEVER inside `.map()`/loops):

- `getText(text, contentLang, displayLang, schoolId)` from `@/components/translation/display` (LRU-backed)
- `getFields(entity, fields, contentLang, displayLang, schoolId)` — one entity, many fields

**Always:**

- `withLang(data, lang)` when writing to DB -- adds the `lang` field. When the locale isn't trustworthy, `detectScript(text)` keys off the actual script (the right choice for names).
- Bilingual search: `search(term, fields, schoolId, storageLang, displayLang)` from `@/components/translation/search` -- cache-only, no API cost.
- Mobile: `POST /api/mobile/translate` reuses the same cache.
- `Translation` model handles caching -- same text never translated twice. Manual overrides (`provider:"manual"`) are never overwritten or pruned.

**Fallback semantics (deliberate):** on Google failure, body text renders in its SOURCE language (logged, throttled); person names transliterate ar→Latin. Renders never block or throw.

> Full reference: [Translation Guide](/docs/translation-guide) and `src/components/translation/README.md`.

## NEVER Do These

- Hardcode English strings in JSX: `<FormLabel>First Name</FormLabel>`
- Hardcode toast messages: `toast.success("Student created")`
- Hardcode error messages: `return { error: "Not authenticated" }`
- Hardcode select labels: `{ value: "male", label: "Male" }`
- Hardcode button text: `<Button>Save</Button>`
- Hardcode validation messages: `z.string().min(1, "Required")`
- Use bilingual field names: `titleAr`, `nameEn`, `descriptionAr`
- Hardcode placeholder text: `<Input placeholder="Enter name" />`

## ALWAYS Do These

- Use dictionary keys for ALL UI text: `<FormLabel>{d.form.firstName}</FormLabel>`
- Use dictionary for buttons: `<Button>{dictionary.common.save}</Button>`
- Use ToastHelper: `const { toast: t } = createI18nHelpers(dictionary.messages); toast.success(t.success.created())`
- Use ValidationHelper for Zod: `z.string().min(1, v.required())`
- Use ErrorHelper or error codes in server actions: `return { success: false, errorCode: "NOT_AUTHENTICATED" }`
- Pass `lang` (current locale) when creating/updating content: `withLang(data, lang)`
- Use `getText()` when displaying DB content that may be in a different language
- Use dictionary for placeholders: `<Input placeholder={d.form.namePlaceholder} />`
- Include `lang` field in Prisma creates for content models

## Pattern: Server Action Errors (Error Code Pattern)

```typescript
// actions.ts -- return error codes, NOT hardcoded strings
return { success: false, errorCode: "NOT_AUTHENTICATED" }
return { success: false, errorCode: "MISSING_SCHOOL_CONTEXT" }

// form.tsx -- translate on client using ErrorHelper
const { error: e } = useI18nMessages(dictionary)
const ERROR_MAP: Record<string, string> = {
  NOT_AUTHENTICATED: e.auth.notAuthenticated(),
  MISSING_SCHOOL_CONTEXT: e.tenant.missingSchoolContext(),
}
toast.error(ERROR_MAP[result.errorCode] ?? e.server.internalError())
```

## Pattern: Form with Dictionary

```typescript
// content.tsx (server)
const dictionary = await getDictionary(lang)
return <StudentForm dictionary={dictionary} />

// form.tsx (client)
const { validation: v, toast: t } = useMemo(
  () => createI18nHelpers(dictionary.messages), [dictionary]
)
const schema = createStudentSchema(v) // Zod factory
```

## Pattern: Config Select Options

```typescript
// config.ts -- export factory function
export const getGenderOptions = (d: Dictionary["school"]) => [
  { value: "male", label: d.students.gender.male },
  { value: "female", label: d.students.gender.female },
]
```

## Key Files

| File                                                   | Purpose                                        |
| ------------------------------------------------------ | ---------------------------------------------- |
| `src/components/translation/display.ts`                | `getText()`, `getFields()`                     |
| `src/components/translation/person.ts`                 | `getName()`, `getNames()`, `getLabels()`       |
| `src/components/translation/actions.ts`                | `translate()`, `translateFields()`             |
| `src/components/translation/util.ts`                   | `withLang()`, `detectScript()`, `detectLang()` |
| `src/components/translation/search.ts`                 | `search()` — bilingual, cache-only             |
| `src/components/internationalization/dictionaries.ts`  | Dictionary loaders                             |
| `src/components/internationalization/helpers/index.ts` | ValidationHelper, ToastHelper, ErrorHelper     |
| `src/components/internationalization/school-en.json`   | English dictionary                             |
| `src/components/internationalization/school-ar.json`   | Arabic dictionary                              |
