# Mobile Repository Hierarchy

The Hogwarts platform spans three repositories. This doc is the canonical reference for how they relate.

## The hierarchy

```
┌──────────────────────────────────────────┐
│  databayt/hogwarts  (THIS REPO)          │
│  Source of truth: web app, API, schema,  │
│  multi-tenant rules, business logic      │
│  Stack: Next.js 16 · Prisma · TypeScript │
└──────────────┬───────────────────────────┘
               │
               │ consumes API
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│ android-app  │  │  ios-app     │
│ LEAD MOBILE  │──▶ MIRRORS      │
│ Kotlin +     │  │ Swift 6 +    │
│ Compose      │  │ SwiftUI      │
└──────────────┘  └──────────────┘
```

| Repo | Role | Stack |
|---|---|---|
| [`databayt/hogwarts`](https://github.com/databayt/hogwarts) | **Source of truth** — web app, API contract, Prisma schema, multi-tenant rules, billing | Next.js 16 · Prisma · TypeScript |
| [`databayt/android-app`](https://github.com/databayt/android-app) | **Lead mobile reference** — feature patterns are set here first | Kotlin · Jetpack Compose |
| [`databayt/ios-app`](https://github.com/databayt/ios-app) | **Mirrors android-app** — re-implements android features in SwiftUI | Swift 6 · SwiftUI |

## The rules

### 1. Hogwarts web is the source of truth

- The Prisma schema lives in this repo. Any new entity or column starts here.
- The mobile-facing API surface lives under `src/app/api/mobile/*`. Mobile apps consume only those routes.
- Multi-tenant isolation (`schoolId` scoping) is enforced server-side. Mobile apps pass `schoolId` in every request but the source-of-truth check is here.
- Localization keys live here; mobile apps reference them.

### 2. Android leads, iOS mirrors

- New features land in `android-app` first (Kotlin + Jetpack Compose).
- Once an Android feature is stable, it gets ported to `ios-app` against the **same API contract**.
- The iOS port should preserve the Android feature's domain model and screen flow as closely as the platform allows. SwiftUI idioms are fine; functional drift is not.
- If iOS discovers an API gap or a missing localization key, fix it **in hogwarts (web) first**, not in the mobile repos.

### 3. Both mobile apps reference the web

- Both apps consume `https://hogwarts.databayt.org/api/mobile/*`.
- Both apps speak the same data shapes (defined by Prisma schema → exposed as JSON).
- Both apps respect the same tenant rules — passing `schoolId`, paginating where the web does, etc.

## When you're contributing

| You're working on | Open PRs in | Reference |
|---|---|---|
| New API endpoint or schema change | `hogwarts` | This repo's CLAUDE.md |
| New Android feature | `android-app` | Android Kotlin/Compose conventions |
| Port an Android feature to iOS | `ios-app` | Both `android-app/feature/<name>/` AND `hogwarts/src/app/api/mobile/<name>/*` |
| Bug in shared API contract | `hogwarts` first, then mobile apps | API contract change is the hogwarts PR |

## Why this hierarchy

- **Web as truth** because business logic, billing, schema migrations, and multi-tenant guarantees belong with the database.
- **Android as lead mobile** because Compose + Kotlin moves faster for prototyping, and the team has more Android velocity right now. Locking iOS to mirror Android prevents UX drift across platforms.
- **iOS as mirror** rather than peer means feature parity is a single direction (android → ios), so reviewers don't have to compare in both directions.

This is reversible — if a feature genuinely makes more sense to design on iOS first (e.g. an iPad-specific layout), prototype on iOS, then port to Android. Just note that explicitly in the PR.

## Cross-links

- iOS README: https://github.com/databayt/ios-app#sibling-repositories
- Android README: https://github.com/databayt/android-app#sibling-repositories
