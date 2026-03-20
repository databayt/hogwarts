---
paths:
  - "src/app/**/s/[subdomain]/**"
  - "src/components/school-dashboard/**"
  - "src/components/school-marketing/**"
  - "src/components/stream/**"
  - "src/components/internal-onboarding/**"
  - "src/components/template/platform-sidebar/**"
---

# Subdomain URL Rule (CRITICAL)

NEVER use `/s/${subdomain}` in client-facing URLs (Link href, redirect(), router.push/replace).

The `/s/[subdomain]` segment is an INTERNAL file-system routing convention. The middleware
rewrites clean URLs to include it. Client-facing code must use clean paths:

WRONG: redirect(`/${lang}/s/${subdomain}/dashboard`)
WRONG: href={`/${locale}/s/${subdomain}/students`}
WRONG: router.push(`/${locale}/s/${subdomain}/join/personal`)

RIGHT: redirect(`/${lang}/dashboard`)
RIGHT: href={`/${locale}/students`}
RIGHT: router.push(`/${locale}/join/personal`)

The ONLY places that should reference `/s/[subdomain]`:

- `revalidatePath()` calls (server-internal, references file-system routes)
- `proxy.ts` middleware (the rewrite itself)
- File-system route directories (`src/app/[lang]/s/[subdomain]/...`)

When the browser is on `kingfahd.localhost:3000`, the middleware automatically
maps `/${locale}/dashboard` → `/${locale}/s/kingfahd/dashboard` internally.
