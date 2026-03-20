## Internationalization — Feature-Based i18n System

### Overview

Databayt v2.0 internationalization standard using a feature-based architecture with professional-grade locale negotiation. Supports Arabic (RTL) and English (LTR) with props-based translation passing, dynamic dictionary loading, and URL-based locale routing under `[lang]/` segments. Includes domain-scoped dictionaries for SaaS marketing, school marketing, school dashboard, operator, and stream contexts.

### File Structure

```
src/components/internationalization/
├── config.ts                       # i18n configuration, Locale type, localeConfig
├── middleware.ts                   # Locale detection and URL rewriting logic
├── dictionaries.ts                 # Dictionary loader (server-only, async)
├── get-dictionary-client.ts        # Client-side dictionary access
├── use-locale.ts                   # URL switching hook (useSwitchLocaleHref)
├── use-dictionary.ts               # Dictionary hook for client components
├── language-switcher.tsx           # Language toggle component
├── actions.ts                      # Server actions for locale operations
├── helpers/
│   └── index.ts                    # i18n helper utilities
├── __tests__/
│   └── middleware.test.ts          # Middleware unit tests
├── en.json                         # English - SaaS marketing dictionary
├── ar.json                         # Arabic - SaaS marketing dictionary
├── school-en.json                  # English - School context dictionary
├── school-ar.json                  # Arabic - School context dictionary
├── operator-en.json                # English - Operator context dictionary
├── operator-ar.json                # Arabic - Operator context dictionary
├── stream-en.json                  # English - Stream/LMS dictionary
├── stream-ar.json                  # Arabic - Stream/LMS dictionary
└── dictionaries/                   # Feature-specific dictionaries
    ├── en/
    │   ├── admin.json
    │   ├── attendance.json
    │   ├── banking.json
    │   ├── finance.json
    │   ├── generate.json
    │   ├── lab.json
    │   ├── library.json
    │   ├── marking.json
    │   ├── messages.json
    │   ├── messaging.json
    │   ├── notifications.json
    │   ├── profile.json
    │   ├── results.json
    │   └── sales.json
    └── ar/
        └── (mirrors en/ structure)
```

### Status

**Completion:** 95% | **Blockers:** None

All core infrastructure is production-ready. Feature dictionaries are added incrementally as features are built.

### Integration Points

- **Root Middleware**: `src/middleware.ts` delegates to `localizationMiddleware()`
- **Layout**: `src/app/[lang]/layout.tsx` loads dictionary via `getDictionary(lang)`
- **Server Components**: `const dict = await getDictionary(lang)` then pass to children
- **Client Components**: Receive dictionary sections as props
- **Locale Switching**: `useSwitchLocaleHref()` hook for language toggle links
