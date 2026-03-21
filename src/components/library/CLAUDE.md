# Library Block

## Context

School library management system (43 files, 95% complete). Global-first architecture: all schools see the same CatalogBook catalog out of the box. Schools can hide books or request new ones. Borrowing is school-scoped via lazy-provisioned Book records.

## Before You Start

1. Read `README.md` here for routes, file structure, and data flow
2. Read `ISSUE.md` here for P0/P1/P2 priorities and MVP checklist
3. Read `authorization.ts` for RBAC permission matrix
4. Read `config.ts` for library constants (borrow limits, pagination)

## Key Decisions

- **Global-first catalog**: `CatalogBook` (no schoolId) is the source of truth. All schools see all published/approved books by default -- zero setup required.
- **Hide mechanism**: `SchoolBookSelection` with `isActive: false` hides a book for a specific school. No selection record = book is visible.
- **Lazy Book creation**: School-scoped `Book` records are created on-demand when a user first visits a book detail page. This bridges the global catalog with school-scoped borrow/return tracking.
- **Catalog-linked only**: `createBook` action rejects standalone book creation -- every Book must link to a CatalogBook via `catalogBookId`.
- **Borrow flow**: BorrowRecord references a school-scoped Book (not CatalogBook). The Book is lazily created from CatalogBook data on detail page load.
- **RBAC**: 8-role permission matrix in `authorization.ts`. DEVELOPER/ADMIN full access, TEACHER/STUDENT/GUARDIAN can read+borrow+return, STAFF/ACCOUNTANT read-only.

## Danger Zones

- **`content.tsx` queries CatalogBook directly** -- does NOT use school-scoped Book table for listing. Changes to the CatalogBook query shape affect the entire library homepage.
- **`book-detail/content.tsx` lazy-creates Book records** -- if the CatalogBook-to-Book field mapping gets out of sync, borrowing breaks silently.
- **`authorization.ts`** -- RBAC gate; incorrect changes expose data across roles.
- **`SchoolBookSelection.isActive`** -- the hide mechanism. `false` = hidden, no record = visible. Inverting this logic would show hidden books to all schools.
- **BorrowRecord references Book.id** (school-scoped), NOT CatalogBook.id. Mixing these up breaks borrow/return.

## Related Blocks

- [School Dashboard](../school-dashboard/CLAUDE.md) -- library lives under dashboard navigation
- [Auth](../auth/CLAUDE.md) -- session with schoolId and role for RBAC
- [Onboarding](../onboarding/CLAUDE.md) -- `setupLibraryForSchool()` exists in catalog-setup.ts for manual admin re-provisioning but is NOT wired to onboarding

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if routes, files, or data flow changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Run `pnpm vitest run src/components/library/` to verify tests pass (214 tests)
5. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000/en/library`
