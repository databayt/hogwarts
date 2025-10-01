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

# E2E Testing
pnpm test:e2e           # Run Playwright E2E tests
pnpm test:e2e:ui        # Run E2E tests with UI
pnpm test:e2e:debug     # Debug E2E tests
pnpm test:e2e:report    # Show E2E test report
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.4 (App Router) with React 19.1.0
- **Styling**: Tailwind CSS 4 with shadcn/ui components (New York style)
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.13.0
- **Auth**: NextAuth v5 (Auth.js 5.0.0-beta.29) with JWT strategy
- **State**: Server actions, SWR for client-side fetching
- **Forms**: react-hook-form 7.61.1 with Zod 4.0.14 validation
- **Testing**: Vitest 2.0.6 + React Testing Library + Playwright 1.55.0
- **Package Manager**: pnpm 9.x (required for Vercel deployments)

### Key Libraries & Tools
- **UI Components**: Radix UI primitives + shadcn/ui
- **Data Tables**: @tanstack/react-table 8.21.3
- **Drag & Drop**: @dnd-kit 6.3.1 and react-dnd 16.0.1
- **Charts**: Recharts 2.15.4
- **Date Handling**: date-fns 4.1.0
- **Email**: Resend 4.7.0 with @react-email/components
- **Monitoring**: Sentry 10.12.0 + Vercel Analytics
- **Payments**: Stripe 18.4.0
- **i18n**: Custom implementation with @formatjs/intl-localematcher

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
- **auth.prisma**: User, Account, Session, VerificationToken
- **school.prisma**: School, SchoolYear, Period, Term, YearLevel
- **staff.prisma**: Teacher, Department, TeacherDepartment
- **students.prisma**: Student, Guardian, StudentGuardian, StudentYearLevel
- **subjects.prisma**: Subject, Class, StudentClass, ScoreRange
- **classrooms.prisma**: Classroom, ClassroomType
- **assessments.prisma**: Assignment, AssignmentSubmission
- **attendance.prisma**: Attendance records
- **announcements.prisma**: Announcement system
- All business models include required `schoolId` field for multi-tenancy
- Relations use `@@index` for performance

### Authentication Flow

NextAuth v5 configuration:
- JWT strategy with 24-hour sessions
- Extended session includes: schoolId, role, isPlatformAdmin
- Callbacks in `src/auth.config.ts` handle JWT/session shape
- Middleware (`src/middleware.ts`) enforces auth on protected routes

User roles (8 total):
- **DEVELOPER**: Platform admin (no schoolId, access all schools)
- **ADMIN**: School administrator
- **TEACHER**: Teaching staff
- **STUDENT**: Enrolled students
- **GUARDIAN**: Student parents/guardians
- **ACCOUNTANT**: School finance staff
- **STAFF**: General school staff
- **USER**: Default role for new users

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
- `@/hooks/*` - Custom React hooks

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
11. **Follow typography pattern** - use semantic HTML, never hardcode text-*/font-* classes

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

## Internationalization (i18n)

The platform supports full multi-language with RTL/LTR:
- **Languages**: Arabic (RTL) and English (LTR)
- **Routing**: `[lang]` dynamic segment (e.g., `/en/dashboard`, `/ar/dashboard`)
- **Fonts**: Rubik (Arabic), Inter (English)
- **Translation Keys**: 800+ keys covering all features
- **Dictionary Files**: `src/components/internationalization/dictionaries.ts`
- **Config**: `src/components/internationalization/config.ts`
- **Language Switcher**: `src/components/internationalization/language-switcher.tsx`

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

## Typography System

The project follows a strict typography pattern for consistency and maintainability:

### Typography Rules
- **Never use hardcoded typography**: No `text-*` or `font-*` classes directly
- **Use semantic HTML**: h1-h6 for headings, p for paragraphs, small for fine print
- **Theme-aware colors**: Use `text-foreground` for headings, `text-muted-foreground` for secondary text
- **Typography scale**: Defined in `src/styles/typography.css`
- **Documentation**: Full guide at `src/app/[lang]/docs/typography/page.mdx`

### Typography Mapping
| Hardcoded Classes | Semantic Element |
|-------------------|------------------|
| `text-3xl font-bold` | `<h2>` |
| `text-2xl font-semibold` | `<h3>` |
| `text-xl font-semibold` | `<h4>` |
| `text-lg font-semibold` | `<h5>` |
| `text-base font-semibold` | `<h6>` |
| `text-sm text-muted-foreground` | `<p className="muted">` |
| `text-xl` | `<p className="lead">` |
| `text-xs` | `<small>` |

### Typography Refactoring Agent
Use the `typography-refactor` agent to automatically convert hardcoded typography to semantic HTML.

### Typography Validation
- **Test files**: `src/lib/typography-validator.test.ts`
- **Validator**: `src/lib/typography-validator.ts`
- Validates semantic HTML usage, theme colors, RTL support, and accessibility

## Common Gotchas

1. **Vercel Build Failures**: Run `pnpm install` locally to update lockfile before pushing
2. **OAuth Redirects**: Check `auth.ts` redirect callback for URL handling logic
3. **Location Form**: Uses simplified inputs (no Mapbox), stores concatenated address string
4. **Capacity Form**: Auto-saves on change, no explicit submit button
5. **Price Page**: Uses empty title/subtitle to maintain two-column layout consistency
6. **TypeScript Errors**: Prisma client may need regeneration: `pnpm prisma generate`
7. **Multi-Tenant Queries**: Always include schoolId - missing it breaks tenant isolation
8. **Typography Violations**: Never use `<div>` for text content - use semantic HTML

## Git Workflow

**IMPORTANT**: Always automatically push changes to GitHub after making code modifications. Use `git push` to ensure all changes are synced to the remote repository.

## Performance Optimizations

The codebase includes several performance optimizations:
- **Turbopack**: Enabled for faster development and production builds
- **Code Splitting**: Automatic with Next.js 15 App Router
- **Image Optimization**: Next/Image with WebP/AVIF formats
- **Bundle Optimization**: `optimizePackageImports` configured in next.config.ts
- **Console Removal**: Production builds remove console.log (keep error/warn)
- **Service Worker**: Offline support and caching strategies
- **Database Indexes**: All foreign keys and frequently queried fields indexed

## Key Project Information

- **Platform Description**: Hogwarts is a school automation platform that manages students, faculty, and academic processes with an intuitive interface
- **Documentation**: Full documentation available at https://ed.databayt.org/docs
- **License**: MIT License
- **Test Coverage**: 174+ test files with 419+ test cases
- **MVP Status**: 100% complete, production-ready