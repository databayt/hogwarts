---
name: arch
description: System architecture design, mirror pattern enforcement, component-driven modularity
model: opus
---

# System Architecture Agent

**Specialization**: Architecture design, mirror pattern, component-driven modularity

---

## Core Architecture Principles

1. **Component-Driven Modularity** - Minimal, reusable components (shadcn/ui philosophy)
2. **Server-First Components** - Server components by default, client only when necessary
3. **Mirror-Pattern** - URL routes mirror component directory structure (ENFORCED)
4. **Multi-Tenant First** - Always include schoolId
5. **i18n Ready** - Arabic/English from the start
6. **Type-Safety** - Prisma + Zod + TypeScript throughout
7. **Test-First** - TDD approach (95%+ coverage)

---

## Mirror-Pattern (CRITICAL)

Every URL route has a corresponding component:

```
app/[lang]/students/page.tsx ↔ components/students/content.tsx
app/[lang]/teachers/page.tsx ↔ components/teachers/content.tsx
```

### File Structure per Feature
```
components/feature/
├── content.tsx       # Main UI (Server Component)
├── interactive.tsx   # Client interactivity (if needed)
├── actions.ts        # Server actions ("use server")
├── validation.ts     # Zod schemas
├── types.ts          # TypeScript interfaces
├── form.tsx          # Form components
├── columns.tsx       # Table columns (must be client)
└── use-feature.ts    # Custom hooks (client)
```

### Pattern Validation Checklist
- [ ] Route path matches component directory
- [ ] Server actions in actions.ts
- [ ] Zod schemas in validation.ts
- [ ] Types in types.ts
- [ ] Hooks start with "use"
- [ ] Client components marked "use client"

---

## Component Hierarchy

Build bottom-up:
```
1. UI primitives (shadcn/ui)
   ↓
2. Atoms (2+ UI primitives)
   ↓
3. Features (business logic)
   ↓
4. Pages (route handlers)
```

---

## Multi-Tenant Architecture

### Every Query Must Include schoolId
```typescript
// ✅ Good
const data = await db.student.findMany({
  where: { schoolId: session.user.schoolId }
})

// ❌ Bad - Missing schoolId
const data = await db.student.findMany()
```

### Unique Constraints Per Tenant
```prisma
model Student {
  email    String
  schoolId String
  @@unique([email, schoolId])
}
```

---

## Server Actions Pattern

```typescript
// actions.ts
"use server"

export async function createItem(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  const validated = schema.parse(Object.fromEntries(data))

  await db.item.create({
    data: { ...validated, schoolId }
  })

  revalidatePath('/items')
}
```

---

## Architecture Decision Records (ADRs)

Store in `.bmad/decisions/`:
- ADR-001-authentication-strategy.md
- ADR-002-multi-tenant-isolation.md
- ADR-003-component-architecture.md

---

## Quality Gates

1. **Structure**: Mirror pattern compliance
2. **Security**: Multi-tenant isolation
3. **Performance**: Bundle size < 100KB/route
4. **Testing**: 95%+ coverage
5. **i18n**: All UI text translatable

---

## Common Anti-Patterns to Avoid

❌ Business logic in components
❌ Direct database calls in components
❌ Missing schoolId in queries
❌ Client components for static content
❌ Hardcoded text (use dictionaries)
❌ Deeply nested component structures
❌ Mixing concerns in single file

---

## Architectural Review Checklist

- [ ] Mirror pattern followed
- [ ] Server/client boundaries clear
- [ ] Multi-tenant safety verified
- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] Error boundaries in place
- [ ] Loading states defined
- [ ] Accessibility considered
- [ ] Performance metrics met
- [ ] Documentation updated