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

For user-generated DB content (announcements, subjects, student names, etc.):

- `getDisplayText(text, contentLang, displayLang, schoolId)` from `@/components/translation/display`
- `getDisplayFields(entity, fields, contentLang, displayLang, schoolId)` for batch
- `prepareContentData(data, lang)` when writing to DB -- adds the `lang` field
- `TranslationCache` model handles caching -- same text never translated twice

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
- Pass `lang` (current locale) when creating/updating content: `prepareContentData(data, lang)`
- Use `getDisplayText()` when displaying DB content that may be in a different language
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

| File                                                   | Purpose                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| `src/components/translation/display.ts`                | `getDisplayText()`, `getDisplayFields()`    |
| `src/components/translation/actions.ts`                | `translateWithCache()`, `translateFields()` |
| `src/components/translation/util.ts`                   | `prepareContentData()`, `detectLanguage()`  |
| `src/components/internationalization/dictionaries.ts`  | Dictionary loaders                          |
| `src/components/internationalization/helpers/index.ts` | ValidationHelper, ToastHelper, ErrorHelper  |
| `src/components/internationalization/school-en.json`   | English dictionary                          |
| `src/components/internationalization/school-ar.json`   | Arabic dictionary                           |
