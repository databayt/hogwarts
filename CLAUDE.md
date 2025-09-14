# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development
pnpm dev            # Start Next.js with Turbopack
pnpm build          # Build for production (includes Prisma generation)
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm test           # Run Vitest tests

# Database
pnpm db:seed        # Seed database with test data
pnpm prisma generate # Generate Prisma client
pnpm prisma migrate dev # Run database migrations

# Testing specific files
pnpm test src/components/platform/operator/**/*.test.tsx
pnpm test path/to/specific/test.tsx  # Run specific test file
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Auth**: NextAuth v5 (Auth.js) with JWT strategy
- **State**: Server actions, SWR for client-side fetching
- **Forms**: react-hook-form with Zod validation

### Directory Structure Pattern

The codebase follows a strict mirroring pattern between routes and components:

```
src/
  app/<feature>/         # Route definition
    page.tsx            # Imports {FeatureName}Content from components
    layout.tsx          # Route-specific layout
  components/<feature>/  # Feature implementation
    content.tsx         # Main UI composition
    actions.ts          # Server actions ("use server")
    validation.ts       # Zod schemas
    type.ts            # TypeScript types
    form.tsx           # Form components
    column.tsx         # Data table columns
    use-<feature>.ts   # Client hooks
```

### Component Hierarchy

Build components from bottom up:
1. **UI** (`src/components/ui/*`) - shadcn/ui primitives
2. **Atoms** (`src/components/atom/*`) - Compose 2+ UI primitives
3. **Features** (`src/components/<feature>/*`) - Business logic + UI
4. **Pages** (`src/app/<route>/page.tsx`) - Import feature content

### Multi-Tenant Architecture

**Critical**: Every database operation MUST be scoped by `schoolId`:
- All business tables include `schoolId` field
- Queries must include `{ where: { schoolId } }`
- Subdomain determines tenant context
- Session includes schoolId via Auth.js callbacks

### Server Actions Pattern

Server actions MUST follow this pattern for security and consistency:

```typescript
// In actions.ts
"use server"

export async function createItem(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // 1. Parse and validate with Zod (validate twice - client UX, server security)
  const validated = schema.parse(Object.fromEntries(data))

  // 2. Execute with schoolId scope (CRITICAL for multi-tenant safety)
  await db.model.create({
    data: { ...validated, schoolId }
  })

  // 3. Revalidate or redirect (never return without this)
  revalidatePath('/items')
}
```

**Key requirements:**
- Start with "use server" directive
- Include schoolId from session/subdomain in ALL queries
- Return typed results, handle errors gracefully
- Call `revalidatePath()` or `redirect()` on success
- Keep actions small and pure

### Form & Validation Pattern

Co-locate validation with forms:
```typescript
// validation.ts
export const itemSchema = z.object({
  name: z.string().min(1),
  // ...
})

// form.tsx - client component
import { itemSchema } from './validation'
const form = useForm({ resolver: zodResolver(itemSchema) })
```

### Key Utilities

- **cn()** (`src/lib/utils.ts`) - Merge Tailwind classes
- **auth()** (`src/auth.ts`) - Get session with extended user data
- **db** (`src/lib/db.ts`) - Prisma client instance

### Prisma Models

Models are split across files in `prisma/models/*.prisma`:
- Auth models: User, Account, Session
- School models include required `schoolId` field
- Relations use `@@index` for performance

### Authentication Flow

NextAuth v5 configuration:
- JWT strategy with 24-hour sessions
- Extended session includes: schoolId, role, isPlatformAdmin
- Callbacks in `src/auth.config.ts` handle JWT/session shape
- Middleware (`src/middleware.ts`) enforces auth on protected routes

### Testing

Tests use Vitest with React Testing Library:
- Test files: `*.test.{ts,tsx}`
- Coverage focus: operator, platform, table components
- Run specific: `pnpm test path/to/test`

### Import Aliases

Use these path aliases:
- `@/components/*` - Component imports
- `@/lib/*` - Utilities and helpers
- `@/app/*` - App directory imports

### Development Guidelines

1. **Always use pnpm** for package management
2. **Follow the mirror pattern** - routes mirror component folders (mandatory)
3. **Scope by tenant** - include schoolId in all queries (CRITICAL)
4. **Type everything** - no `any`, prefer explicit function signatures
5. **Use server actions** for mutations with "use server" directive
6. **Validate twice** - client (UX) and server (security)
7. **Style with Tailwind** - use cn() helper from @/lib/utils, avoid inline styles
8. **Co-locate validation** - keep validation.ts with form.tsx
9. **Build bottom-up** - UI → Atoms → Templates → Blocks → Micro → Apps
10. **Keep actions small and pure** - isolate DB code and schema definitions

### Additional Architecture Details

**Composition Hierarchy** (build from bottom up):
1. **UI** - shadcn/ui primitives (`@/components/ui/*`)
2. **Atoms** - Compose 2+ UI primitives (`@/components/atom/*`)
3. **Templates** - Reusable layouts/compositions
4. **Blocks** - Templates + client logic (hooks, validation)
5. **Micro** - Adds backend logic (actions, Prisma access)
6. **Apps** - Compose several Micro features

**Standardized Files per Feature**:
- `type.ts` - Shared TypeScript types
- `use-<feature>.ts` - Custom React hooks
- `column.tsx` - Data table columns (typed by model)
- `validation.ts` - Zod schemas (infer types)
- `actions.ts` - Server actions ("use server")
- `content.tsx` - Main UI composition
- `form.tsx` - Form components
- `card.tsx` - Card components
- `all.tsx` - All/list views
- `featured.tsx` - Featured list components
- `detail.tsx` - Detail view components
- `constant.ts` - Arrays, enums, static data
- `util.ts` - Utility functions

**Multi-Tenant Guardrails**:
- All business tables include `schoolId` field
- Uniqueness constraints are scoped within tenant (`schoolId`)
- Every read/write operation includes `{ schoolId }` from session/subdomain
- Log `requestId` and `schoolId` for traceability

## Environment & Deployment

- **Production**: https://ed.databayt.org (main domain)
- **Platform**: Vercel (automatic deployments from main branch)
- **Database**: PostgreSQL on Neon (connection string in DATABASE_URL)
- **Package Manager**: pnpm v9.x (lockfile must be up to date for Vercel)

## School Onboarding Flow

The onboarding follows this exact sequence (defined in `host-footer.tsx`):
1. about-school → 2. title → 3. description → 4. location → 5. stand-out → 
6. capacity → 7. branding → 8. import → 9. finish-setup → 10. join → 
11. visibility → 12. price → 13. discount → 14. legal

Navigation is handled by `HostFooter` component with context-aware validation.

## Authentication & OAuth

- OAuth providers: Google, Facebook
- Callback URL preservation: Uses httpOnly cookies (`auth-callback-url`)
- Login flow: Stores intended destination before OAuth redirect
- Logout: Redirects to home page (`/`) not dashboard

## Common Gotchas

1. **Vercel Build Failures**: Run `pnpm install` locally to update lockfile before pushing
2. **OAuth Redirects**: Check `auth.ts` redirect callback for URL handling logic
3. **Location Form**: Uses simplified inputs (no Mapbox), stores concatenated address string
4. **Capacity Form**: Auto-saves on change, no explicit submit button
5. **Price Page**: Uses empty title/subtitle to maintain two-column layout consistency

## Git Workflow

**IMPORTANT**: Always automatically push changes to GitHub after making code modifications. Use `git push` to ensure all changes are synced to the remote repository.

## Key Project Information

- **Platform Description**: Hogwarts is a school automation platform that manages students, faculty, and academic processes with an intuitive interface
- **Documentation**: Full documentation available at https://ed.databayt.org/docs
- **License**: MIT License 