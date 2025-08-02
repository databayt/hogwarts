# Contributing

Thanks for your interest in contributing to hogwarts. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to reach out to the maintainers.

## About this repository

This repository is a modern rental platform built with Next.js 15, TypeScript, and Prisma.

- We use [pnpm](https://pnpm.io) for package management.
- We use [Next.js 15](https://nextjs.org) with App Router for the frontend.
- We use [Prisma](https://prisma.io) for database management.
- We use [shadcn/ui](https://ui.shadcn.com) for our component library.
- We use [Auth.js](https://authjs.dev) for authentication.

## Structure

This repository is structured as follows:

```
src/
├── app/                     # Next.js App Router (Routing & Layouts)
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Dashboard routes
│   ├── (site)/              # Public site routes
│   ├── hosting/             # Property hosting routes
│   └── host/                # Property management routes
│
├── components/              # Component Logic (Mirrors `app` structure)
│   ├── auth/                # Authentication components
│   ├── host/                # Property hosting components
│   ├── listings/            # Property listing components
│   ├── property/            # Property management components
│   ├── application/         # Rental application components
│   └── ui/                  # Shared UI components
│
├── lib/                     # Shared utilities & functions
├── types/                   # Global TypeScript definitions
├── hooks/                   # Custom React hooks
└── state/                   # State management
```

| Path                  | Description                              |
| --------------------- | ---------------------------------------- |
| `src/app`             | The Next.js application routes and layouts. |
| `src/components`      | The React components organized by feature. |
| `src/lib`             | Shared utilities and database functions. |
| `src/types`           | TypeScript type definitions. |
| `prisma`              | Database schema and migrations. |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone https://github.com/your-username/mkan.git
```

### Navigate to project directory

```bash
cd mkan
```

### Create a new Branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
pnpm install
```

### Set up the database

1. Copy the environment variables:

```bash
cp .env.example .env.local
```

2. Set up your database and update the `DATABASE_URL` in `.env.local`

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Components

We use shadcn/ui as our component foundation. You can find the component configuration in `components.json`.

When adding or modifying components, please ensure that:

1. You follow the shadcn/ui patterns and conventions
2. You maintain consistency with existing components
3. You add proper TypeScript types
4. You include proper validation using Zod
5. You test the components thoroughly

## Commit Convention

Before you create a Pull Request, please check whether your commits comply with
the commit conventions used in this repository.

When you create a commit we kindly ask you to follow the convention
`category(scope or module): message` in your commit message while using one of
the following categories:

- `feat / feature`: all changes that introduce completely new code or new
  features
- `fix`: changes that fix a bug (ideally you will additionally reference an
  issue if present)
- `refactor`: any code related change that is not a fix nor a feature
- `docs`: changing existing or creating new documentation (i.e. README, docs for
  usage of a lib or cli usage)
- `build`: all changes regarding the build of the software, changes to
  dependencies or the addition of new dependencies
- `test`: all changes regarding tests (adding new tests or changing existing
  ones)
- `ci`: all changes regarding the configuration of continuous integration (i.e.
  github actions, ci system)
- `chore`: all changes to the repository that do not fit into any of the above
  categories

  e.g. `feat(property): add new property listing component`

If you are interested in the detailed specification you can visit
https://www.conventionalcommits.org/ or check out the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines).

## Requests for new features

If you have a request for a new feature, please open a discussion on GitHub. We'll be happy to help you out.

## Testing

Tests are written using [Vitest](https://vitest.dev). You can run all the tests from the root of the repository.

```bash
pnpm test
```

Please ensure that the tests are passing when submitting a pull request. If you're adding new features, please include tests.