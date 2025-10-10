# Contributing

Thanks for your interest in contributing to hogwarts. We're happy to have you here.

Please review this guide before submitting a pull request. Also check open issues/PRs to avoid duplicate work.

If you need any help, feel free to reach out to the maintainers.

## About this repository

This repository is a modern, multi-tenant school platform built with Next.js 15, TypeScript, and Prisma.

- We use [pnpm](https://pnpm.io) for package management.
- We use [Next.js 15](https://nextjs.org) with App Router for the frontend.
- We use [Prisma](https://prisma.io) for database management.
- We use [shadcn/ui](https://ui.shadcn.com) for our component library.
- We use [Auth.js](https://authjs.dev) for authentication.

## Structure

The codebase follows a mirror-pattern architecture: every URL under `src/app` has a corresponding feature directory under `src/components` for its component logic. For documentation and data-table features, we refer only to their top-level directories.

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
├── prisma/                      # Database schema and migrations
└── public/                      # Static assets
```

| Path              | Description                                   |
| ----------------- | --------------------------------------------- |
| `src/app`         | Next.js application (routes/layouts).         |
| `src/components`  | React components organized by feature.        |
| `src/app/docs`    | Documentation app (top-level reference).      |
| `src/components/docs` | Documentation components (top-level).    |
| `src/app/table`   | Data-table area (top-level reference).        |
| `src/components/table` | Data-table components (top-level).       |
| `src/app/(platform)/dashboard` | Dashboard area (top-level reference). |
| `src/components/platform/dashboard` | Dashboard components (top-level). |
| `src/lib`         | Utilities and database helpers.               |
| `prisma`          | Prisma schema and migrations.                 |
| `public`          | Static assets.                                |

### Mirror pattern: URL ↔ directory

If you can see a URL, you should know where to find its code.

```text
URL: /feature-x

src/app/feature-x/        # Next.js route files
src/components/feature-x/ # Component logic for that route
```

### Standardized file patterns (deeper layers)

For deeper feature directories (e.g., under `src/components/platform/dashboard`), follow the standardized file pattern inspired by our documentation (`src/app/docs/architecture/page.mdx`) and its reference table (`src/app/docs/architecture/standardized-file-patterns.tsx`):

| File                    | Purpose                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| `content.tsx`           | Compose feature/page UI: headings, sections, layout orchestration. |
| `action.ts`             | Server actions & API calls: validate, scope tenant, mutate.        |
| `config.ts`             | Enums, option lists, labels, defaults for the feature.             |
| `validation.ts`         | Zod schemas & refinements; parse and infer types.                  |
| `types.ts`              | Domain and UI types; generic helpers for forms/tables.             |
| `form.tsx`              | Typed forms (RHF) with resolvers and submit handling.              |
| `card.tsx`              | Card components for KPIs, summaries, quick actions.                |
| `all.tsx`               | List view with table, filters, pagination.                         |
| `featured.tsx`          | Curated feature list showcasing selections.                        |
| `detail.tsx`            | Detail view with sections, relations, actions.                     |
| `util.ts`               | Pure utilities and mappers used in the feature.                    |
| `column.tsx`            | Typed table column builders and cell renderers.                    |
| `use-abc.ts`            | Feature hooks: fetching, mutations, derived state.                 |
| `README.md`             | Feature README: purpose, APIs, decisions.                          |
| `ISSUE.md`              | Known issues and follow-ups for the feature.                       |

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

### Set up the database

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Configure your database and update `DATABASE_URL` in `.env.local`.

3. Run database migrations:

```bash
pnpm prisma migrate dev
```

4. Seed the database:

```bash
pnpm seed
```

### Run the development server

```bash
pnpm dev
```

### Build for production

```bash
pnpm build
```

Open `http://localhost:3000` with your browser to see the result.

## Components

We use shadcn/ui as our component foundation. You can find the component configuration in `components.json`.

When adding or modifying components:

1. Follow shadcn/ui patterns and naming conventions (keep components minimal and composable).
2. Maintain consistency with existing components, colocating logic under the mirrored `src/components/<feature>` path.
3. Add proper TypeScript types.
4. Include validation using Zod when handling inputs.
5. Test components and flows thoroughly.

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

Example: `feat(dashboard): add KPI cards`

See `https://www.conventionalcommits.org/` or the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines) for details.

## Requests for new features

If you have a request for a new feature, please open a discussion on GitHub.

## Testing

Tests are written using [Vitest](https://vitest.dev). Run all tests from the repository root:

```bash
pnpm test
```

Ensure tests pass before submitting a PR. When adding features, include appropriate tests.