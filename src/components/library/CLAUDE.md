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
- **Hero is a shared object, not a local one**: `hero.tsx` is deliberately the same banner as `school-dashboard/live/landing/status-hero.tsx` -- same green ground, geometry, type and pills. The two landing pages are siblings in the school dashboard, and they were drifting. Change one, change the other.
- **`collaborate-section.tsx`'s book is resolved by an exact RAW title match** -- `content.tsx`'s `FEATURED_BOOK_TITLE` constant against `catalogBooks[].title` BEFORE `localize()` runs, never against the localized `books[].title`. Matching the localized field returns nothing on /ar. The section renders nothing (not a fallback card) when the match misses -- a renamed or hidden edition silently removes the section rather than showing invented content. The title is pinned to that constant because the PHOTOGRAPH beside it is pinned too: swap in a different book and the picture no longer matches the words.
- **That photograph is a FILM STILL, not cover art** -- `asset("/photos/harry-potter.png")`, kept deliberately. `saas-marketing/CLAUDE.md` rules the same frame out of the marketing site ("never ship that frame on the marketing site"), so treat it as in-app decoration and raise it before reusing it anywhere customer-facing.
- **The book detail page is an Apple Books layout, and its full-bleed is borrowed, not invented** -- `book-detail/hero.tsx` carries the escape-margin string copied term for term from `lumos/dashboard/lesson/content.tsx`, and `data-immersive` sits on the page ROOT in `book-detail/content.tsx`. The school-dashboard layout reads that marker to unpin the header and stop the container clipping; without BOTH, the negative margins are cut at the container edge and no arithmetic reaches the page edge. Above `sm` only the inline-END side escapes -- the sidebar is on the start side, and a negative start margin runs the colour under it. `books/[id]/loading.tsx` repeats the same margins on purpose, or the layout jumps sideways when the data lands.
- **`coverColor` is arbitrary and white text on it is not safe** -- the hero paints the raw colour and lays a black gradient scrim over it, which is what the live room's title card does with its own `color` prop. Do not swap the scrim for a lighter overlay or drop it because one book looked fine.
- **The hero sets no font family, deliberately** -- the reference is serif and Arabic already reads that way, because `--font-sans` under `ar` is the Thmanyah text face. Adding `font-serif` hands Arabic Georgia, which carries no Arabic glyphs.
- **`line-clamp` needs a single text element** -- `about.tsx` renders ONE `<p>` with the paragraphs joined by blank lines and `whitespace-pre-line`. Clamping a wrapper `<div>` around several `<p>`s measured nothing and truncated nothing, silently: `-webkit-box` only counts line boxes it owns directly.

- **Never let a `dictionary.school.library.*` fallback go unverified again** -- `collaborate-section.tsx` shipped for a long stretch reading `featuredBookTitle`/`featuredBookAuthor`/`featuredBookDescription`/`getBook`, none of which existed in `school-{en,ar}.json`, so its hardcoded English "or" fallback was the only thing that ever rendered, on every school, in both languages, and a completed checklist item in `ISSUE.md` said otherwise. Grep the actual JSON for a key before trusting a `lib?.key || "fallback"` read.

## Danger Zones

- **`content.tsx` queries CatalogBook directly** -- does NOT use school-scoped Book table for listing. Changes to the CatalogBook query shape affect the entire library homepage.
- **`book-detail/content.tsx` lazy-creates Book records** -- if the CatalogBook-to-Book field mapping gets out of sync, borrowing breaks silently.
- **`authorization.ts`** -- RBAC gate; incorrect changes expose data across roles.
- **`SchoolBookSelection.isActive`** -- the hide mechanism. `false` = hidden, no record = visible. Inverting this logic would show hidden books to all schools.
- **BorrowRecord references Book.id** (school-scoped), NOT CatalogBook.id. Mixing these up breaks borrow/return.
- **The banner's colours are pinned literals, never tokens** -- `#00bc6d` ground, `#050505` ink. White on this green measures about 2.5:1 and is unreadable, and `primary-foreground` is white in light mode and black in dark, which is exactly backwards on this ground. The banner does not invert.
- **The headline's two rows are width-matched, and the tatweels are the knob** -- `library.hero.title` renders 333px over 333px in Arabic, 320px over 312px in English. A tatweel deleted as a typo, or a literal translation of either line, un-matches them and wraps to three rows. Measure the line boxes in a browser after any edit; do not eyeball it. The two languages are transcreated, not word-for-word, for that reason.
- **`public/anthropic/category-04-alpha.svg` is DERIVED** -- regenerate it with `sed 's/#F1E6D0/#9FE5B1/g' public/anthropic/category-04.svg > public/anthropic/category-04-alpha.svg`, never by hand.

## Related Blocks

- [School Dashboard](../school-dashboard/CLAUDE.md) -- library lives under dashboard navigation
- [Auth](../auth/CLAUDE.md) -- session with schoolId and role for RBAC
- [Onboarding](../onboarding/CLAUDE.md) -- `setupLibraryForSchool()` exists in catalog-setup.ts for manual admin re-provisioning but is NOT wired to onboarding

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if routes, files, or data flow changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Run `pnpm vitest run src/components/library/` to verify tests pass (214 tests)
5. Test: `admin@balqalam.com` (pw: 1234) on `demo.localhost:3000/en/library`
