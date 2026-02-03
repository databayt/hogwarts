# Platform Page Pattern - Best Practices

## Overview

This document outlines the recommended pattern for platform pages to avoid redundant data fetching and maximize performance.

## Key Principles

### 1. **Don't Fetch School Data in Pages**

The school data is already fetched once in the platform layout and provided via `SchoolProvider`. Pages should NOT fetch it again.

### 2. **Use Context in Client Components**

When you need school data in client components, use the `useSchool` hook:

```tsx
"use client"

import { useSchool } from "@/components/school-dashboard/context/school-context"

export function MyClientComponent() {
  const { school } = useSchool()
  return <div>{school.name}</div>
}
```

### 3. **Remove Debug Logging**

Remove all `console.log` statements before production. Use proper error tracking (Sentry) instead.

### 4. **Add Metadata for SEO**

Every page should export a `generateMetadata` function for dynamic metadata:

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.pageTitle,
    description: dictionary.school.pageDescription,
  }
}
```

## Recommended Page Structure

```tsx
import { Metadata } from "next";
import PageContent from "@/components/school-dashboard/[feature]/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.[feature].title,
    description: dictionary.school.[feature].description,
  };
}

// Minimal page component - just passes dictionary
export default async function FeaturePage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  // Don't fetch school data here - it's already in context!
  return <PageContent dictionary={dictionary.school} />;
}
```

## Content Component Pattern

### Server Component (when possible)

```tsx
// content.tsx - Server Component
import { currentUser } from "@/components/auth/auth"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary?: Dictionary["school"]
}

export default async function FeatureContent({ dictionary }: Props) {
  const user = await currentUser()

  if (!user) {
    return <LoginPrompt />
  }

  // Fetch feature-specific data here
  const data = await fetchFeatureData()

  return (
    <div>
      <FeatureHeader dictionary={dictionary} />
      <FeatureBody data={data} />
      {/* Use client components when school context is needed */}
      <SchoolInfoClient />
    </div>
  )
}
```

### Client Component (when school context needed)

```tsx
// school-info-client.tsx - Client Component
"use client"

import { useSchool } from "@/components/school-dashboard/context/school-context"

export function SchoolInfoClient() {
  const { school } = useSchool()

  return (
    <div>
      <h2>{school.name}</h2>
      <p>Domain: {school.domain}</p>
    </div>
  )
}
```

## Anti-Patterns to Avoid

### ❌ Don't do this:

```tsx
// Bad: Fetching school data in every page
export default async function Page({ params }: Props) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain) // ❌ Redundant!

  if (!result.success) {
    notFound()
  }

  return <Content school={result.data} />
}
```

### ✅ Do this instead:

```tsx
// Good: Rely on SchoolProvider from layout
export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <Content dictionary={dictionary.school} />
}
```

## Benefits of This Pattern

1. **Performance**: School data is fetched only once per request
2. **Consistency**: All components share the same school context
3. **Maintainability**: Simpler pages with less boilerplate
4. **Type Safety**: TypeScript types flow naturally through context
5. **SEO**: Proper metadata for search engines
6. **i18n**: Dictionary passed consistently

## Migration Checklist

When updating existing pages:

- [ ] Remove redundant `getSchoolBySubdomain` calls
- [ ] Remove all `console.log` statements
- [ ] Add `generateMetadata` function
- [ ] Simplify page component to just pass dictionary
- [ ] Update content component to use school context when needed
- [ ] Create client components for parts that need school context
- [ ] Test that school data is still accessible where needed
