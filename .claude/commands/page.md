---
description: Create Next.js page following mirror pattern
requiresArgs: true
---

Create page at path: $1

1. Invoke /agents/nextjs to create page structure
2. Invoke /agents/pattern to verify mirror pattern compliance
3. Invoke /agents/react to create corresponding component
4. Invoke /agents/i18n to add translations

Generate:
- `app/[lang]/s/[subdomain]/(platform)/$1/page.tsx` - Page
- `components/$1/content.tsx` - Component implementation

Follow mirror pattern: route path must match component path.
