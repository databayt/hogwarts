# Contributing

Thanks for your interest in contributing to hogwarts. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to reach out to the maintainers on [Discord](https://discord.gg/uPa4gGG62c).

## About this repository

Hogwarts is a **feature-based Next.js application** for multi-tenant school management and automation.

**Tech Stack:**

- **Next.js 15.4.4** with App Router and Turbopack (dev + production)
- **React 19.1.0** with Server Components and concurrent features
- **pnpm 9.x** for package management (required for Vercel deployments)
- **Prisma 6.14.0** with PostgreSQL and multi-file schema architecture
- **shadcn/ui** component library (New York style with Radix UI primitives)
- **NextAuth v5** (Auth.js) for authentication with JWT strategy
- **TypeScript 5.x** with strict mode enabled
- **Vitest 2.0.6** for unit testing
- **Playwright 1.55.0** for end-to-end testing

**Architecture:**

- Feature-based structure with mirror pattern (URL ↔ directory)
- Multi-tenant with subdomain-based routing
- Bilingual support (Arabic RTL + English LTR)
- Custom Node.js server with WebSocket integration
- 38 Prisma model files organized by domain

## Structure

This repository is structured as follows:

```text
src/
├── app/                         # Next.js App Router (Routing & Layouts)
│   ├── (auth)/                  # Authentication routes
│   ├── (marketing)/             # Marketing/Site routes
│   ├── (platform)/              # App features (e.g., dashboard, attendance)
│   ├── (site)/                  # Public site pages
│   ├── docs/                    # Documentation site (top-level reference)
│   └── table/                   # Data-table area (top-level reference)
│
├── components/                  # Component logic (mirrors `app` by feature)
│   ├── auth/                    # Authentication components
│   ├── marketing/               # Marketing components
│   ├── platform/                # Feature components (dashboard, attendance, …)
│   ├── site/                    # Site components
│   ├── docs/                    # Docs components (top-level reference)
│   ├── table/                   # Data-table components (top-level reference)
│   └── ui/                      # Shared UI (shadcn/ui)
│
├── lib/                         # Shared utilities (db, utils, etc.)
├── hooks/                       # Shared React hooks
├── prisma/
│   ├── models/                  # Multi-file schema (38 domain models)
│   └── generator/               # Database seed scripts
├── .claude/                     # AI automation config (33 agents, 22 commands)
├── server.js                    # Custom Node.js server with WebSocket
└── public/                      # Static assets
```

| Path                                | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| `src/app`                           | Next.js application (routes/layouts).             |
| `src/components`                    | React components organized by feature.            |
| `src/app/docs`                      | Documentation app (top-level reference).          |
| `src/components/docs`               | Documentation components (top-level).             |
| `src/app/table`                     | Data-table area (top-level reference).            |
| `src/components/table`              | Data-table components (top-level).                |
| `src/app/(platform)/dashboard`      | Dashboard area (top-level reference).             |
| `src/components/platform/dashboard` | Dashboard components (top-level).                 |
| `src/lib`                           | Utilities and database helpers.                   |
| `src/hooks`                         | Shared React hooks.                               |
| `prisma/models`                     | Multi-file Prisma schema (38 model files).        |
| `prisma/generator`                  | Database seed scripts.                            |
| `.claude/`                          | AI automation (33 agents, 22 commands, 7 skills). |
| `server.js`                         | Custom Node.js server with WebSocket.             |
| `public`                            | Static assets.                                    |

### Mirror pattern: URL ↔ directory

If you can see a URL, you should know where to find its code.

```text
URL: /feature-x

src/app/feature-x/        # Next.js route files
src/components/feature-x/ # Component logic for that route
```

### Standardized file patterns (deeper layers)

For deeper feature directories (e.g., under `src/components/platform/dashboard`), follow the standardized file pattern inspired by our documentation (`src/app/docs/architecture/page.mdx`) and its reference table (`src/app/docs/architecture/standardized-file-patterns.tsx`):

| File            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ | --- |
| `content.tsx`   | Compose feature/page UI: headings, sections, layout orchestration. |
| `action.ts`     | Server actions & API calls: validate, scope tenant, mutate.        |
| `config.ts`     | Enums, option lists, labels, defaults for the feature.             |
| `validation.ts` | Zod schemas & refinements; parse and infer types.                  | \   |
| `types.ts`      | Domain and UI types; generic helpers for forms/tables.             |
| `form.tsx`      | Typed forms (RHF) with resolvers and submit handling.              |
| `card.tsx`      | Card components for KPIs, summaries, quick actions.                |
| `all.tsx`       | List view with table, filters, pagination.                         |
| `featured.tsx`  | Curated feature list showcasing selections.                        |
| `detail.tsx`    | Detail view with sections, relations, actions.                     |
| `util.ts`       | Pure utilities and mappers used in the feature.                    |
| `column.tsx`    | Typed table column builders and cell renderers.                    |
| `use-abc.ts`    | Feature hooks: fetching, mutations, derived state.                 |
| `README.md`     | Feature README: purpose, APIs, decisions.                          |
| `ISSUE.md`      | Known issues and follow-ups for the feature.                       |

Use these names consistently across features to keep the codebase discoverable and composable.

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top-right of the GitHub page.

### Clone on your local machine

```bash
git clone <your-fork-url>
```

### Navigate to project directory

```bash
cd hogwarts
```

### Create a new branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
pnpm install
```

### Configure environment

Create `.env` file with required variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers, email, storage, etc.
```

See deployment documentation at [ed.databayt.org/docs](https://ed.databayt.org/docs) for the full environment variable list.

### Set up the database

1. Generate Prisma client:

```bash
pnpm prisma generate
```

Note: This runs automatically after `pnpm install` via the postinstall script. Hogwarts uses a **multi-file Prisma schema**. All `.prisma` files in `prisma/models/` are automatically included.

2. Run database migrations:

```bash
pnpm prisma migrate dev
```

3. Seed the database (choose one):

```bash
pnpm db:seed              # Default seed
pnpm db:seed:demo         # Demo data (recommended for development)
pnpm db:seed:portsudan    # Port Sudan school data
pnpm db:seed:community    # Community data
```

### Running development servers

**Standard development (with WebSocket support):**

```bash
pnpm dev
```

This runs the custom `server.js` with WebSocket integration for real-time features.

**Next.js development only (no WebSocket):**

```bash
pnpm dev:next
```

Use this for faster HMR when WebSocket features are not needed.

**Access the application:**

- Main app: `http://localhost:3000`
- With subdomain: `http://subdomain.localhost:3000`

### Build for production

**Before building, always validate TypeScript:**

```bash
pnpm tsc --noEmit
```

This is **critical** to prevent build hangs. The build process will hang at "Environments: .env" if TypeScript errors exist.

**Standard build:**

```bash
pnpm build
```

**Smart build with validation (recommended):**

```bash
/build
```

The `/build` command provides 4-phase validation with comprehensive error detection. See the [Build System](#build-system) section for details.

Open `http://localhost:3000` with your browser to see the result.

## CLI Tools & Commands

Hogwarts includes powerful CLI commands for development automation:

### Component Generation

```bash
/component <name>        # Generate React component with tests
/page <path>             # Create Next.js page with mirror pattern
/api <method> <path>     # Create server action with validation
```

### Quality Assurance

```bash
/review                  # Comprehensive code review
/test <file>             # Generate and run tests
/security-scan           # OWASP vulnerability audit
/fix-all                 # Auto-fix all issues
```

### Build & Validation

```bash
/build                   # Smart build with 4-phase validation
/scan-errors [pattern]   # Detect 204+ error patterns (7s)
/fix-build [type]        # Auto-fix build errors (95%+ success, 7s vs 3h manual)
/validate-prisma <file>  # Validate Prisma queries
```

### Performance & Optimization

```bash
/optimize <file>         # Performance optimization
/benchmark [target]      # Performance benchmarking
```

### Database

```bash
/migration <name>        # Generate Prisma migration
```

### Deployment

```bash
/ship <env>              # Deploy with validation pipeline (staging/production)
```

See `.claude/commands/` for all 22 available commands.

## Architecture Patterns

### Multi-Tenant Architecture

Hogwarts uses subdomain-based multi-tenancy with strict tenant isolation:

**URL Structure:**

- Production: `school.databayt.org`
- Preview: `tenant---branch.vercel.app`
- Development: `school.localhost:3000`

**CRITICAL RULE:** ALL database queries MUST include `schoolId` for tenant isolation:

```typescript
// ✅ CORRECT - includes schoolId
await db.student.findMany({
  where: { schoolId, yearLevel: "10" },
})

await db.class.create({
  data: { name: "Math 101", schoolId },
})

// ❌ WRONG - missing schoolId (breaks tenant isolation)
await db.student.findMany({
  where: { yearLevel: "10" },
})
```

**Getting tenant context:**

```typescript
// In server components

// In server actions
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"

const { schoolId, subdomain } = await getTenantContext()

const session = await auth()
const schoolId = session?.user?.schoolId
```

See the [Multi-Tenant Documentation](https://ed.databayt.org/docs/multi-tenant) for comprehensive details.

### Server Actions Pattern

**CRITICAL:** All server actions must follow this pattern for security:

```typescript
// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { itemSchema } from "./validation"

export async function createItem(data: FormData) {
  // 1. Authenticate and get schoolId
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) throw new Error("Unauthorized")

  // 2. Parse and validate (validate twice: client UX, server security)
  const validated = itemSchema.parse(Object.fromEntries(data))

  // 3. Execute with schoolId scope (CRITICAL for multi-tenant safety)
  const item = await db.item.create({
    data: { ...validated, schoolId },
  })

  // 4. Revalidate or redirect (never return without this)
  revalidatePath(`/items`)

  return { success: true, item }
}
```

**Requirements:**

- Start with `"use server"` directive
- Include `schoolId` from session in ALL queries
- Validate with Zod on both client (UX) and server (security)
- Call `revalidatePath()` or `redirect()` after mutations
- Return typed results, handle errors gracefully

## Component Development

We use shadcn/ui as our component foundation with a **strict mirror pattern**.

When adding or modifying components:

1. **Follow the Mirror Pattern**
   - Route at `app/[lang]/s/[subdomain]/(platform)/students/page.tsx`
   - Component at `components/platform/students/content.tsx`
   - Always maintain URL ↔ directory correspondence

2. **Use Standardized File Patterns**
   Follow the file naming conventions in the table above for consistent structure.

3. **Server vs Client Components**
   - Default to server components for better performance
   - Use `"use client"` only when needed (interactivity, hooks, browser APIs)
   - **NEVER** call column functions with hooks from server components
   - Pass props to client components instead of calling hook-based functions

4. **Typography Rules**
   - Use semantic HTML (`h1`-`h6`, `p`, `small`)
   - **NEVER** hardcode `text-*` or `font-*` classes
   - Use predefined styles from `src/styles/typography.css`

   | Instead of                                        | Use                     |
   | ------------------------------------------------- | ----------------------- |
   | `<div className="text-3xl font-bold">`            | `<h2>`                  |
   | `<div className="text-sm text-muted-foreground">` | `<p className="muted">` |

5. **Multi-Tenant Safety**
   - Always include `schoolId` in database queries
   - Use `getTenantContext()` in server components
   - Use `session.user.schoolId` in server actions
   - Never hard-code tenant-specific values

6. **Validation**
   - Define Zod schemas in `validation.ts`
   - Validate on both client (UX feedback) and server (security)
   - Use `zodResolver` with react-hook-form
   - Export inferred types: `export type FormData = z.infer<typeof schema>`

7. **Import Aliases**

   ```typescript
   import { auth } from "@/auth"

   import { db } from "@/lib/db"
   import { useFeature } from "@/hooks/use-feature"
   import { Button } from "@/components/ui/button"
   ```

8. **Testing**
   - Generate tests: `/test <file>`
   - Maintain 95%+ coverage target
   - Run tests: `pnpm test`

See the [Architecture Documentation](https://ed.databayt.org/docs/architecture) for comprehensive guidelines.

## Internationalization

The platform supports **Arabic (RTL, default)** and **English (LTR)**:

**Route Structure:**

- `/ar/...` - Arabic routes (right-to-left)
- `/en/...` - English routes (left-to-right)

**Adding Translations:**

1. Add translation keys to `src/components/internationalization/dictionaries.ts`:

```typescript
export const dictionaries = {
  en: {
    feature: {
      title: "Feature Title",
      description: "Feature description",
    },
  },
  ar: {
    feature: {
      title: "عنوان الميزة",
      description: "وصف الميزة",
    },
  },
}
```

2. Validate translation completeness:

```bash
/i18n-check
```

3. Test both RTL and LTR layouts in your browser.

**Font System:**

- **Arabic:** Tajawal
- **English:** Inter

**Current Status:** 800+ translation keys maintained across all features.

See the [i18n Documentation](https://ed.databayt.org/docs/i18n) for detailed guidelines.

## Testing

### Unit Tests (Vitest)

Run all tests:

```bash
pnpm test
```

Run specific tests:

```bash
pnpm test src/components/platform/students/**/*.test.tsx
```

Run in watch mode:

```bash
pnpm test -- --watch
```

### E2E Tests (Playwright)

Run all E2E tests:

```bash
pnpm test:e2e
```

Run with UI mode (interactive):

```bash
pnpm test:e2e:ui
```

Run in debug mode:

```bash
pnpm test:e2e:debug
```

View test report:

```bash
pnpm test:e2e:report
```

### Test Requirements

- All pull requests must have passing tests
- New features must include appropriate tests
- **Target:** 95%+ code coverage
- Use `/test <file>` to automatically generate tests with proper patterns

## Build System

### Smart Build Command

Use the enhanced build command for comprehensive validation:

```bash
/build
```

**4-Phase Process:**

1. **Pre-Build Validation** (~15s)
   - TypeScript compilation check
   - Prisma client sync verification
   - Error pattern detection (204+ patterns)
   - Process check and cleanup

2. **Execute Build** (~28s)
   - Production build with Turbopack
   - Real-time progress indicators
   - Automatic optimization

3. **Post-Build Analysis** (~2s)
   - Performance metrics
   - Route-level bundle analysis
   - Build warnings detection

4. **Recommendations**
   - Code-splitting opportunities
   - Bundle optimization suggestions
   - Caching improvements

**Total time:** ~45s (vs potential 3+ hours of debugging)

### Pre-Build Validation

**CRITICAL:** Always run TypeScript validation before building:

```bash
pnpm tsc --noEmit
```

This prevents build hangs and silent failures. The build process will hang at "Environments: .env" if TypeScript errors exist.

### Manual Build

```bash
pnpm build                   # Standard production build
ANALYZE=true pnpm build      # With bundle analysis
pnpm build --profile         # With build profiling
```

### Error Prevention

Scan for common errors before building:

```bash
/scan-errors    # Detect 204+ error patterns (7s)
```

**Detects:**

- Dictionary property errors (173+ patterns)
- Prisma field type errors (13+ patterns)
- Enum completeness issues (2+ patterns)
- Multi-tenant safety violations

Auto-fix detected errors:

```bash
/fix-build      # Auto-fix with 95%+ success rate (7s vs 3h manual)
```

**Best practice workflow:**

```bash
/scan-errors && /fix-build && pnpm tsc --noEmit && pnpm build
```

See the [Build Documentation](https://ed.databayt.org/docs/build) for troubleshooting and advanced topics.

## Pre-Commit Validation

Hogwarts includes automated pre-commit validation configured in `.claude/settings.json`:

**Runs automatically on commit:**

- TypeScript compilation (`pnpm tsc --noEmit`)
- Prisma client sync (if schema changed)
- ESLint validation
- Tests for changed files

**Branch-aware validation:**

- **Protected branches** (main/master/production): STRICT blocking on errors
- **Feature branches**: Warning with override option

**Override (not recommended):**

```bash
git commit --no-verify
```

This automated validation prevents 99% of build failures in CI/CD.

## AI Automation

Hogwarts includes **33 specialized AI agents** for development assistance:

### Quick Commands

```bash
/component StudentCard    # Generate component with tests
/page students/profile    # Create page with mirror pattern
/review                   # Comprehensive code review
/security-scan            # OWASP vulnerability audit
/build                    # Smart build with validation
```

### Specialized Agents

```bash
/agents/react             # React component optimization
/agents/nextjs            # Next.js routing and pages
/agents/prisma            # Database queries and optimization
/agents/typescript        # Type safety enforcement
/agents/tailwind          # CSS utility patterns
/agents/orchestrate       # Complex multi-step features
```

**Full list:** 33 agents, 22 commands, 7 reusable skills

See `.claude/README.md` and the [Agent Reference](https://ed.databayt.org/docs/claude-code/agent-reference) for complete documentation.

## Commit convention

Before creating a Pull Request, ensure your commits follow this convention:

`category(scope or module): message`

Categories:

- `feat / feature`: new features
- `fix`: bug fixes (reference an issue if possible)
- `refactor`: code changes that are not fixes or features
- `docs`: documentation changes
- `build`: build/dependency changes
- `test`: tests (add/change)
- `ci`: continuous integration configuration
- `chore`: repository chores

**Examples:**

- `feat(students): add bulk enrollment feature`
- `fix(attendance): correct geofence validation`
- `refactor(finance): optimize invoice queries`
- `docs(readme): update setup instructions`

See [Conventional Commits](https://www.conventionalcommits.org/) or the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines) for details.

## Requests for new features

If you have a request for a new feature, please open a discussion on GitHub. We'll be happy to help you out.

## Additional Resources

- **Documentation:** [ed.databayt.org/docs](https://ed.databayt.org/docs)
- **Discord Community:** [discord.gg/uPa4gGG62c](https://discord.gg/uPa4gGG62c)
- **Architecture Guide:** [/docs/architecture](https://ed.databayt.org/docs/architecture)
- **Build System:** [/docs/build](https://ed.databayt.org/docs/build)
- **Multi-Tenant Guide:** [/docs/multi-tenant](https://ed.databayt.org/docs/multi-tenant)
- **Internationalization:** [/docs/i18n](https://ed.databayt.org/docs/i18n)
- **Component Library:** [/docs/components](https://ed.databayt.org/docs/components)
- **Agent Reference:** [/docs/claude-code/agent-reference](https://ed.databayt.org/docs/claude-code/agent-reference)

## License

Licensed under the MIT license.
