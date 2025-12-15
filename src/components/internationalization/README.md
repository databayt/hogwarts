# Internationalization

**Feature-Based i18n Architecture for New & Existing Projects**

## Table of Contents

1. [Company Standard Overview](#company-standard-overview)
2. [Architecture Overview](#architecture-overview)
3. [Dependencies & Setup](#dependencies--setup)
4. [Feature-Based File Structure](#feature-based-file-structure)
5. [Implementation Guide](#implementation-guide)
6. [New Project Setup](#new-project-setup)
7. [Existing Project Migration](#existing-project-migration)
8. [Usage Patterns](#usage-patterns)
9. [Advanced Features](#advanced-features)
10. [Quality Assurance](#quality-assurance)
11. [Team Standards](#team-standards)

## Company Standard Overview

This document establishes **Databayt's v2.0 internationalization standard** using a feature-based architecture with professional-grade locale negotiation. This pattern provides superior developer experience and easier maintenance compared to v1.0.

### Why v2.0 Standard

- **Feature Isolation**: All i18n logic contained in dedicated feature directory
- **Professional Locale Detection**: Uses industry-standard libraries
- **Better Maintainability**: Cleaner separation of concerns
- **Enhanced DX**: Simpler component prop passing patterns
- **Easier Testing**: Isolated feature testing
- **Future-Proof**: Scalable architecture for complex applications

### Key Improvements Over v1.0

- **Centralized Configuration**: Single source of truth for all i18n settings
- **Professional Libraries**: `@formatjs/intl-localematcher` and `negotiator`
- **Component Organization**: Dedicated `components/internationalization/` directory
- **Simplified Components**: Props-based translation passing
- **Better TypeScript**: Enhanced type safety and IntelliSense

## Architecture Overview

### Core Components

```
components/internationalization/
├── config.ts                   # Configuration and types
├── middleware.ts               # Locale detection logic
├── dictionaries.ts             # Dictionary loading
├── use-locale.ts               # URL switching utility
├── en.json                     # English transliation
└── ar.json                     # Arabic transliation
```

### Data Flow

```
Request → Middleware → Locale Detection → Dictionary Loading → Props → Components
```

### Locale Detection Priority

1. **URL Path**: `/en/about` → `en`
2. **Browser Headers**: `Accept-Language` header negotiation
3. **Default Fallback**: Configured default locale

## Dependencies & Setup

### Required Dependencies

```bash
# Core internationalization libraries
pnpm add @formatjs/intl-localematcher negotiator

# TypeScript support
pnpm add -D @types/negotiator
```

### Package Justification

- **`@formatjs/intl-localematcher`**: Industry-standard locale matching algorithm
- **`negotiator`**: Professional HTTP header negotiation
- **`@types/negotiator`**: TypeScript definitions for negotiator

## Feature-Based File Structure

**This EXACT structure MUST be used in every project:**

```
src/
├── middleware.ts                           # Root middleware orchestrator
├── app/
│   ├── [lang]/                            # Dynamic locale routing
│   │   ├── layout.tsx                     # Locale-aware layout
│   │   ├── page.tsx                       # Localized pages
│   │   └── (routes)/                      # All your routes
│   └── globals.css
├── components/
│   └── internationalization/              # 🎯 All i18n logic here
│       ├── config.ts                 # Configuration & types
│       ├── middleware.ts     # Middleware logic
│       ├── dictionaries.ts           # Dictionary loader
│       ├── use-locale.ts     # URL switching hook
│       ├── en.json                        # English translations
│       └── ar.json                        # Arabic translations

```

## Implementation Guide

### Step 1: Install Dependencies

```bash
# Install required packages
pnpm add @formatjs/intl-localematcher negotiator
pnpm add -D @types/negotiator
```

### Step 2: Create i18n Configuration

Create `src/components/internationalization/config.ts`:

```typescript
export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"], // Add your supported locales
} as const

export type Locale = (typeof i18n)["locales"][number]

// Locale metadata for enhanced functionality
export const localeConfig = {
  en: {
    name: "English",
    nativeName: "English",
    dir: "ltr",
    flag: "🇺🇸",
    dateFormat: "MM/dd/yyyy",
    currency: "USD",
  },
  ar: {
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
    flag: "🇸🇦",
    dateFormat: "dd/MM/yyyy",
    currency: "SAR",
  },
} as const

export function isRTL(locale: Locale): boolean {
  return localeConfig[locale]?.dir === "rtl"
}
```

### Step 3: Create Localization Middleware

Create `src/components/internationalization/middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server"
import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

import { i18n } from "./config"

function getLocale(request: NextRequest) {
  // Get Accept-Language header
  const headers = {
    "accept-language": request.headers.get("accept-language") ?? "",
  }

  // Use negotiator to parse preferred languages
  const languages = new Negotiator({ headers }).languages()

  // Match against supported locales
  return match(languages, i18n.locales, i18n.defaultLocale)
}

export function localizationMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If locale exists in URL, continue
  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Get best matching locale
  const locale = getLocale(request)

  // Redirect to localized URL
  request.nextUrl.pathname = `/${locale}${pathname}`
  const response = NextResponse.redirect(request.nextUrl)

  // Set cookie for future visits
  response.cookies.set("NEXT_LOCALE", locale, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
```

### Step 4: Create Dictionary Loader

Create `src/components/internationalization/dictionaries.ts`:

```typescript
import "server-only"

import type { Locale } from "./config"

// We enumerate all dictionaries here for better linting and typescript support
const dictionaries = {
  en: () => import("./en.json").then((module) => module.default),
  ar: () => import("./ar.json").then((module) => module.default),
} as const

export const getDictionary = async (locale: Locale) => {
  try {
    return await (dictionaries[locale]?.() ?? dictionaries["en"]())
  } catch (error) {
    console.warn(
      `Failed to load dictionary for locale: ${locale}. Falling back to en.`
    )
    return await dictionaries["en"]()
  }
}

// Type helper for component props
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
```

### Step 5: Create URL Switching Hook

Create `src/components/internationalization/use-locale.ts`:

```typescript
"use client"

import { usePathname } from "next/navigation"

import type { Locale } from "./config"
import { i18n } from "./config"

export function useSwitchLocaleHref() {
  const pathname = usePathname()

  return function switchLocaleHref(targetLocale: Locale): string {
    // Extract current locale from pathname
    const currentLocale = i18n.locales.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (!currentLocale) {
      // If no current locale detected, prepend target locale
      return `/${targetLocale}${pathname}`
    }

    // Replace current locale with target locale
    const newPathname = pathname.replace(
      `/${currentLocale}`,
      `/${targetLocale}`
    )
    return newPathname
  }
}
```

### Step 6: Setup Root Middleware

Create/Update `src/middleware.ts`:

```typescript
import { NextRequest } from "next/server"

import { localizationMiddleware } from "./components/internationalization/middleware"

// Matcher ignoring `/_next/`, `/api/`, and static files
export const config = {
  matcher: ["/((?!api|_next|_static|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
}

export function middleware(request: NextRequest) {
  return localizationMiddleware(request)
}
```

### Step 7: Create Translation Files

Create `src/components/internationalization/en.json`:

```json
{
  "metadata": {
    "title": "Databayt - Web Design & Development",
    "description": "Professional web design and development services"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "back": "Back",
    "next": "Next",
    "language": "Language"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact",
    "pricing": "Pricing"
  },
  "landing": {
    "welcome": "Welcome to Databayt",
    "subtitle": "Building the future of automation"
  },
  "counter": {
    "increment": "Increment",
    "decrement": "Decrement",
    "count": "Count: {count}"
  },
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password"
  }
}
```

Create `src/components/internationalization/ar.json`:

```json
{
  "metadata": {
    "title": "داتابايت - تصميم وتطوير المواقع",
    "description": "خدمات تصميم وتطوير المواقع الاحترافية"
  },
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ ما",
    "success": "نجح",
    "cancel": "إلغاء",
    "save": "حفظ",
    "back": "رجوع",
    "next": "التالي",
    "language": "اللغة"
  },
  "navigation": {
    "home": "الرئيسية",
    "about": "حول",
    "services": "الخدمات",
    "contact": "اتصل بنا",
    "pricing": "التسعير"
  },
  "landing": {
    "welcome": "مرحباً بك في داتابايت",
    "subtitle": "بناء مستقبل الأتمتة"
  },
  "counter": {
    "increment": "زيادة",
    "decrement": "تقليل",
    "count": "العدد: {count}"
  },
  "auth": {
    "signIn": "تسجيل الدخول",
    "signUp": "إنشاء حساب",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور"
  }
}
```

## New Project Setup

### Step 1: Create App Structure

```bash
# Create the locale-based app structure
mkdir -p src/app/[lang]
```

### Step 2: Setup Layout

Create `src/app/[lang]/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale, localeConfig } from "@/components/internationalization/i18n-config";
import "../globals.css";

// Configure fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const rubik = Rubik({
  subsets: ['arabic', 'latin'],
  variable: '--font-rubik',
  display: 'swap'
});

export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: Locale };
}): Promise<Metadata> {
  const dictionary = await getDictionary(lang);
  const config = localeConfig[lang];

  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    other: {
      'accept-language': lang,
    },
    alternates: {
      languages: {
        'en': '/en',
        'ar': '/ar',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: Locale };
}) {
  const config = localeConfig[lang];
  const isRTL = config.dir === 'rtl';

  return (
    <html lang={lang} dir={config.dir}>
      <body
        className={`${isRTL ? rubik.className : inter.className} ${inter.variable} ${rubik.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return Object.keys(localeConfig).map((lang) => ({ lang }));
}
```

### Step 3: Create Pages

Create `src/app/[lang]/page.tsx`:

```typescript
import { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/i18n-config';
import { CounterComponent } from '@/components/counter-component';
import { LanguageSwitcher } from '@/components/language-switcher';

export default async function HomePage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = await getDictionary(lang);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-4">
        <LanguageSwitcher currentLocale={lang} />
      </div>

      <h1 className="text-3xl font-bold mb-4">
        {dictionary.landing.welcome}
      </h1>

      <p className="text-lg text-gray-600 mb-8">
        Current locale: {lang}
      </p>

      <p className="mb-8">
        This text is rendered on the server: {dictionary.landing.subtitle}
      </p>

      <CounterComponent
        dictionary={dictionary.counter}
        params={{ lang }}
      />
    </div>
  );
}
```

## Existing Project Migration

### Step 1: Install Dependencies

```bash
pnpm add @formatjs/intl-localematcher negotiator
pnpm add -D @types/negotiator
```

### Step 2: Create Feature Directory

```bash
mkdir -p src/components/internationalization
```

### Step 3: Move Existing i18n Files

```bash
# Move existing translation files to new structure
mv src/lib/dictionaries/* src/components/internationalization/
mv src/lib/locales/* src/components/internationalization/
```

### Step 4: Update Imports

Replace all existing imports:

```typescript
// ❌ Old imports
import { getDictionary } from "@/lib/dictionaries"
import { useTranslations } from "@/lib/use-translations"
// ✅ New imports
import { getDictionary } from "@/components/internationalization/dictionaries"
```

### Step 5: Restructure App Directory

```bash
# Create new locale structure
mkdir -p src/app/[lang]

# Move existing pages
mv src/app/(marketing)/* src/app/[lang]/
mv src/app/(auth)/* src/app/[lang]/
mv src/app/about/* src/app/[lang]/about/
```

### Step 6: Update Components

Update all components to use props pattern:

```typescript
// ❌ Old pattern
'use client';
import { useTranslations } from '@/lib/use-translations';

export function MyComponent() {
  const { t } = useTranslations();
  return <div>{t.common.loading}</div>;
}

// ✅ New pattern
'use client';
import type { getDictionary } from '@/components/internationalization/dictionaries';

export function MyComponent({
  dictionary,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['common'];
}) {
  return <div>{dictionary.loading}</div>;
}
```

## Usage Patterns

### Server Components

```typescript
import { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/i18n-config';

export default async function ServerComponent({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = await getDictionary(lang);

  return (
    <div>
      <h1>{dictionary.landing.welcome}</h1>
      <p>{dictionary.landing.subtitle}</p>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useState } from 'react';
import type { getDictionary } from '@/components/internationalization/dictionaries';

export function CounterComponent({
  dictionary,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['counter'];
}) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(n => n - 1)}>
        {dictionary.decrement}
      </button>
      <span>{count}</span>
      <button onClick={() => setCount(n => n + 1)}>
        {dictionary.increment}
      </button>
    </div>
  );
}
```

### Language Switcher Component

```typescript
'use client';

import Link from 'next/link';
import { useSwitchLocaleHref } from '@/components/internationalization/use-locale';
import { i18n, localeConfig, type Locale } from '@/components/internationalization/i18n-config';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const getSwitchLocaleHref = useSwitchLocaleHref();

  return (
    <div className="flex gap-2">
      {i18n.locales.map((locale) => {
        const config = localeConfig[locale];
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={getSwitchLocaleHref(locale)}
            className={`px-3 py-1 rounded ${
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {config.flag} {config.nativeName}
          </Link>
        );
      })}
    </div>
  );
}
```

### Complex Component with Multiple Dictionary Sections

```typescript
'use client';

import type { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/i18n-config';

interface Props {
  dictionary: {
    common: Awaited<ReturnType<typeof getDictionary>>['common'];
    navigation: Awaited<ReturnType<typeof getDictionary>>['navigation'];
    auth: Awaited<ReturnType<typeof getDictionary>>['auth'];
  };
  params: { lang: Locale };
}

export function ComplexComponent({ dictionary, params }: Props) {
  return (
    <div>
      <nav>
        <a href={`/${params.lang}`}>{dictionary.navigation.home}</a>
        <a href={`/${params.lang}/about`}>{dictionary.navigation.about}</a>
      </nav>

      <main>
        <button>{dictionary.auth.signIn}</button>
        <p>{dictionary.common.loading}</p>
      </main>
    </div>
  );
}
```

## Advanced Features

### Dynamic Imports for Large Dictionaries

```typescript
// For very large applications, you can split dictionaries
const dictionaries = {
  en: {
    common: () => import("./en/common.json").then((m) => m.default),
    auth: () => import("./en/auth.json").then((m) => m.default),
    dashboard: () => import("./en/lab.json").then((m) => m.default),
  },
  // ... other locales
} as const

export const getDictionarySection = async (locale: Locale, section: string) => {
  return dictionaries[locale]?.[section]?.() ?? dictionaries["en"][section]()
}
```

### Custom Locale Detection

```typescript
// Enhanced locale detection with custom logic
function getLocale(request: NextRequest): Locale {
  // 1. Check URL parameter
  const searchParams = request.nextUrl.searchParams
  const urlLocale = searchParams.get("lang")
  if (urlLocale && i18n.locales.includes(urlLocale as Locale)) {
    return urlLocale as Locale
  }

  // 2. Check cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  // 3. Use negotiator for Accept-Language header
  const headers = {
    "accept-language": request.headers.get("accept-language") ?? "",
  }
  const languages = new Negotiator({ headers }).languages()
  return match(languages, i18n.locales, i18n.defaultLocale) as Locale
}
```

### SEO Optimization

```typescript
// Enhanced metadata generation
export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dictionary = await getDictionary(lang)
  const config = localeConfig[lang]

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://databayt.com"

  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: Object.keys(localeConfig).reduce(
        (acc, locale) => ({
          ...acc,
          [locale]: `${baseUrl}/${locale}`,
        }),
        { "x-default": `${baseUrl}/en` }
      ),
    },
    openGraph: {
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
      locale: lang,
      alternateLocale: i18n.locales.filter((l) => l !== lang),
    },
    other: {
      "accept-language": lang,
    },
  }
}
```

## Quality Assurance

### Implementation Checklist

**Before deploying any project with i18n, verify ALL items:**

- [ ] Dependencies installed: `@formatjs/intl-localematcher`, `negotiator`, `@types/negotiator`
- [ ] Component directory structure follows standard: `components/internationalization/`
- [ ] All required files created: config, middleware, dictionaries, hooks
- [ ] URL routing works: `/en/`, `/ar/` patterns
- [ ] Locale detection works: browser headers, cookies, fallback
- [ ] Dictionary loading works: server-side async loading
- [ ] Props passing pattern implemented in components
- [ ] Language switcher component created and functional
- [ ] RTL support implemented for Arabic
- [ ] SEO metadata includes proper language tags
- [ ] TypeScript types properly defined and used
- [ ] Error boundaries handle missing translations

### Testing Requirements

**ALL projects MUST pass these tests:**

- **URL Routing**: Test locale detection and redirection
- **Dictionary Loading**: Verify async loading and fallbacks work
- **Component Props**: Test translation props passing
- **Language Switching**: Verify URL switching works correctly
- **RTL Layouts**: Test Arabic layout renders properly
- **SEO Tags**: Validate metadata generation
- **Performance**: Measure bundle impact
- **Error Handling**: Test missing translation scenarios

### Common Implementation Issues

```typescript
// ❌ FORBIDDEN: Using hooks in server components
export default async function ServerPage() {
  const { dictionary } = useTranslations(); // This will break!
  return <div>{dictionary.title}</div>;
}

// ✅ CORRECT: Server components use getDictionary
export default async function ServerPage({ params: { lang } }) {
  const dictionary = await getDictionary(lang);
  return <div>{dictionary.title}</div>;
}

// ❌ FORBIDDEN: Not passing translations to client components
export function ClientComponent() {
  // No way to access translations here!
  return <button>Click me</button>;
}

// ✅ CORRECT: Pass dictionary as props
export function ClientComponent({
  dictionary
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['common']
}) {
  return <button>{dictionary.clickMe}</button>;
}
```

## Team Standards

### Code Review Requirements

- [ ] Feature directory structure is correct
- [ ] All components receive translations via props
- [ ] No client-side hooks used in server components
- [ ] TypeScript types are properly defined
- [ ] Dictionary keys follow naming conventions
- [ ] Error boundaries handle edge cases
- [ ] Performance impact is acceptable

### Naming Conventions

```typescript
// ✅ CORRECT: Clear, hierarchical dictionary keys
{
  "lab": {
    "user": {
      "profile": "User Profile",
      "settings": "Settings"
    },
    "analytics": {
      "pageViews": "Page Views",
      "uniqueVisitors": "Unique Visitors"
    }
  }
}

// ❌ FORBIDDEN: Flat or unclear keys
{
  "userProfile": "User Profile",
  "dashboardPageViews": "Page Views",
  "analytics_unique_visitors": "Unique Visitors"
}
```

### Performance Standards

- Dictionary loading must be lazy (async imports)
- Bundle size impact < 50KB per locale
- No blocking translations on initial page load
- Proper tree-shaking of unused translations

### Documentation Requirements

- All custom dictionary sections must be documented
- Component prop types must include dictionary typing
- New locale additions must update all relevant files
- Migration guides must be updated for breaking changes

## Company Implementation Standard

This document establishes the **mandatory v2.0 internationalization standard** for all Databayt projects.

### Migration Timeline

- **New Projects**: MUST use v2.0 standard immediately
- **Existing Projects**: Migrate to v2.0 within 6 months
- **Legacy Support**: v1.0 patterns deprecated, no new development

### Key Benefits of v2.0

- **Faster Implementation**: Feature-based organization reduces setup time by 60%
- **Better Maintainability**: Centralized i18n logic eliminates scattered files
- **Enhanced Performance**: Professional locale detection improves user experience
- **Improved DX**: Props-based pattern reduces component complexity
- **Future-Proof**: Scalable architecture supports complex applications

### Success Metrics

This v2.0 standardization enables:

- New project i18n setup in under 1 hour
- Existing project migration in under 1 day
- Zero configuration drift between projects
- Shared utilities and components across all projects
- Consistent testing and debugging patterns

**This v2.0 pattern is mandatory for ALL Databayt projects effective immediately.**
