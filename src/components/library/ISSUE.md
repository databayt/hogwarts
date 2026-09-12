# Library Block -- Issue Tracker

**Status:** PRODUCTION READY
**Completion:** 95%
**Last Updated:** 2026-09-09

---

## MVP Checklist

### Architecture

- [x] Global-first CatalogBook queries (all schools see books out of the box)
- [x] SchoolBookSelection hide mechanism (isActive: false)
- [x] Lazy Book provisioning on detail page visit
- [x] BookListItem lightweight type for list/card display
- [x] Multi-tenant scoping (`getTenantContext()` + `schoolId`)
- [x] Catalog-linked book creation only (no standalone)

### Public Views

- [x] Library home page (hero + book rows by category)
- [x] Hero section: the green brand banner shared with /live
- [x] Book list with horizontal scroll cards
- [x] Book list toolbar (search/filter by genre, grade level)
- [x] All books page with pagination
- [x] Book detail page, laid out the way Apple Books lays out a book (2026-09-09)
- [x] Borrow/return actions from detail page
- [x] Collaborate section (dictionary-ized, no hardcoded strings)
- [x] Related books: "More by Author" and "Similar Books" (from CatalogBook)

### Admin

- [x] Admin dashboard
- [x] Books management table
- [x] Add new book page (from catalog)
- [x] Book form (create/edit)
- [x] Table row actions (edit, delete)
- [x] File upload for covers
- [x] Color picker for cover color

### Catalog

- [x] Global catalog browser
- [x] Book picker (add from catalog to school)
- [x] Select/deselect/toggle/update selection actions
- [x] Catalog must be used for book creation

### Contributions

- [x] Contribution form page
- [x] User contribution history
- [x] Submit/manage contribution actions

### User Profile

- [x] Borrow history and reading stats

### Server Actions

- [x] `createBook` (catalog-linked only)
- [x] `updateBook` (partial updates)
- [x] `deleteBook` (blocks when active borrows exist)
- [x] `borrowBook` (checks availability, transaction-based)
- [x] `returnBook` (validates ownership, transaction-based)
- [x] `markOverdueBooks` (batch status transition)

### Authorization

- [x] RBAC permission checks (`authorization.ts`)
- [x] All 8 roles covered: DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, STAFF, ACCOUNTANT, USER
- [x] Cross-school denial
- [x] `getAuthContext` + `getAllowedActions` helpers

### Validation

- [x] `bookSchema` (title, author, genre, rating 0-5, coverUrl, coverColor hex, etc.)
- [x] `borrowBookSchema` (bookId, userId, schoolId, dueDate must be future)
- [x] `returnBookSchema` (borrowRecordId, schoolId)
- [x] `updateBookSchema` / `deleteBookSchema`

### Testing

- [x] Server action tests (39 tests -- all 6 actions)
- [x] Authorization tests (35 tests -- 8 roles x 7 actions + edge cases)
- [x] Validation tests (46 tests -- all Zod schemas)
- [x] Catalog action tests (33 tests -- select/deselect/toggle/update)
- [x] Contribution action tests (7 tests)
- [x] `setupLibraryForSchool` tests in catalog-setup (5 tests)

---

## Known Issues

### P1 -- High

- [ ] **Admin books table still queries school-scoped Book**: `admin/books/content.tsx` uses `db.book.findMany({ where: { schoolId } })`. Works fine for schools that have visited book detail pages (which lazy-creates Books), but new schools with no Book records will see an empty admin table even though the catalog has books. Admin should either query CatalogBook or show a prompt to browse the catalog.
- [ ] **Admin "Add New Book" form non-functional**: `book-form.tsx` calls `createBook()` without `catalogBookId`, so it always fails with "Books must be added from the catalog". The `/library/admin/books/new` route should redirect to `/library/catalog` or the form should include a catalog book selector.

### P2 -- Medium

- [ ] **No overdue book notifications**: `BorrowStatus.OVERDUE` exists but there is no cron job or scheduled action to transition BORROWED records past their due date to OVERDUE status, or to send email reminders.
- [ ] **Borrow due date not server-enforced**: `borrowBookSchema` validates `dueDate > now()` but the default borrow duration from `config.ts` (14 days) is not enforced server-side. A client could submit any future date.
- [ ] **No copy count management UI for admins**: SchoolBookSelection has `totalCopies`/`availableCopies` but there's no admin interface to adjust copy counts per school. Currently uses DEFAULT_COPIES (3) from lazy provisioning.
- [ ] **Static assets in component directory**: `books-row-01.png` and `books-row-02.png` are stored alongside components rather than in `public/`. Works but unconventional for Next.js.

### P3 -- Low

- [ ] **setupLibraryForSchool exists but unused**: The function in `catalog-setup.ts` is tested and working but not wired anywhere. Kept for potential future use (SaaS admin manual re-provisioning). Could be removed if global-first approach is permanent.
- [ ] **Hero art is fixed**: `hero.tsx` shows one marginalia illustration for every school. Could vary by collection size or season, but it must stay a transparent line drawing on the green -- a photograph or a card would break the banner it shares with /live.

---

## Completed (Recent)

- [x] Collaborate section reads a REAL book (2026-09-03): the single-book spotlight and its original photograph both stay -- `asset("/photos/harry-potter.png")`, a film still, kept at Abdout's request and decorative only. What changed is the text beside it. Correcting the entry below: the section's dictionary keys (`featuredBookTitle`, `featuredBookAuthor`, `featuredBookDescription`, `getBook`) never existed in `dictionary.school.library`, so the hardcoded English fallback rendered on every school in both languages the whole time. Title and author now come from the real `Book` row (`content.tsx` resolves it -- see `FEATURED_BOOK_TITLE`), the labels read the `by` and `viewBook` keys that do exist, and the CTA opens that book's own `/library/books/[id]` instead of the generic list. The component went back to being a server component with the remote cover.
- [x] Hero rebuilt as the /live green brand banner (2026-09-03): same ground `#00bc6d`, geometry, thmanyah-sans headline with a weighted `{mark}` phrase, two pills and marginalia art on the green. Replaced a 7xl `Revelio` wordmark beside a CDN-fetched Lottie; the component is now a server component and `library-animation.tsx` is gone. Copy lives in `dictionaries/{ar,en}/library.json` under `hero` -- `title`, `titleMark`, `explore`, `favorites`.
- [x] Headline rows width-matched (2026-09-03): measured in the browser at 1440px, Arabic renders 333px over 333px and English 320px over 312px, against /live's 331/333. The tatweels in the Arabic string are what does it. Re-measure both line boxes after any edit to the headline keys.
- [x] Grade-level English labels standardized to US terms (2026-07-12): PRIMARY→Elementary, INTERMEDIATE→Middle, SECONDARY→High in contribute, all-books, and book-detail (raw enum badge now labeled via `BOOK_GRADE_LEVEL_LABELS` in `config.ts`). Enum values unchanged; Arabic labels unchanged.
- [x] Fixed related book links in book-detail (relative → absolute `/${lang}/library/books/${id}`)
- [x] Fixed my-profile links to use `catalogBookId` instead of school Book.id (was causing 404s)
- [x] Fixed my-profile Image crash on empty coverUrl (added fallback cover)
- [x] Fixed error message mismatch in borrow-book, book-table-actions, book-form (`result.error` → `result.message`)
- [x] Fixed createBook action dropping `catalogBookId` (Zod parse was stripping it)
- [x] Added MAX_BOOKS_PER_USER (5) enforcement in borrowBook action
- [x] Fixed admin dashboard overdue count to include both OVERDUE status and BORROWED past-due
- [x] Refactored library home to query CatalogBook directly (global-first)
- [x] Refactored all-books page to query CatalogBook with search/filter
- [x] Refactored book detail to load CatalogBook + lazy-create school Book
- [x] Added BookListItem type for lightweight list/card display
- [x] Updated BookList and BookCard to accept BookListItem
- [x] ~~Dictionary-ized collaborate-section.tsx (removed hardcoded strings)~~ -- WRONG when this was first checked off: the keys it named never existed in the dictionary, so the hardcoded fallback was the only thing that ever rendered. See the 2026-09-03 entry above for the actual fix.
- [x] Removed library provisioning from onboarding (not needed with global-first)
- [x] Added comprehensive test suites (160 library tests total)
- [x] Empty state with admin CTA to browse catalog

---

## Enhancements (Post-MVP)

- Overdue detection cron + email notifications via Resend
- Book reservation / waitlist when all copies borrowed
- Reading progress tracking
- Book recommendations based on borrow history
- Barcode/QR scanning for physical book check-in/out
- Book request workflow (school requests book -> SaaS admin approves -> added to catalog)
- Category/group-level hide (hide all Science books, all KG books, etc.)
- Digital book reading (PDF/EPUB viewer for `digitalFileUrl`)
- Move static assets to `public/library/`

---

**Last Review:** 2026-03-22

---

## Book detail, redrawn as Apple Books (2026-09-09)

The page was a 192px cover beside a column of badges in a `max-w-2xl` box, with
five headed sections stacked below it in one weight. It is now two halves: a
full-bleed panel in the book's own `coverColor` holding cover, grade, title,
author, rating and the borrow card, then an ordinary column of rule-divided
sections — About, Information, shelves.

- `content.tsx` keeps every query it had and now composes `hero`, `about`,
  `info-list` and `book-shelf`. The lazy `schoolBook.create` is untouched.
- The icon-tile grid became the Information list. Borrowing counts fold into it
  instead of owning a section.
- Description and summary are one clamped block with a `More` toggle. The clamp
  is measured, so the button only appears when there is a fourth line.
- `star-rating.tsx` deleted — the reference shows `★ 4.2 · Genre` on one line,
  not five stars. `@/components/ui/star-rating` still serves the pages that
  want a row of stars.
- Full-bleed uses the lumos lesson's escape margins and `data-immersive`
  verbatim. Above `sm` only the inline-end side reaches the edge; the sidebar
  owns the other.

### Left open

- **The eyebrow and the genre render in English on `/ar`.**
  `BOOK_GRADE_LEVEL_LABELS` in `config.ts` is an English-only map, and `genre`
  is stored in English on the catalog row. Both predate this work and both need
  either dictionary keys or `localize()`, not a layout fix.
- **`[TENANT] Query without schoolId: Book.findFirst/findMany`** still logs on
  every visit. `Book` is the global catalog and genuinely has no `schoolId`;
  the warning is the tenant guard not knowing that. Pre-existing.

## The featured blurb, and translation on the detail page (2026-09-09)

- **The library home's featured book had lost its description.** The pass that
  deleted the invented `featuredBookDescription` key took the paragraph with
  it, leaving a title, a byline and a button. It reads from the `Book` row now
  and arrives translated. `description` stays out of the list `select`; the
  featured row is fetched on its own so `localize()` does not translate a
  paragraph for every book on the page.
- **The detail page localized nothing.** The listing has always run
  `localize("Book", …)` and this page never did, so a book opened from an
  Arabic shelf changed language on the way in. It now localizes the book and
  both shelves, after the related-book queries rather than before.

### Blocked on the provider, not on code

Neither is visibly Arabic on demo data right now. Google Translate answers
`403 User Rate Limit Exceeded`, its circuit breaker is open (5 min cooldown),
and the Groq fallback's breaker is open too. `localize()` falls back to the
source language by design and logs `[translation] DEGRADED`. The `Translation`
cache holds real en↔ar rows from earlier runs, so the read path is sound — the
first render after the quota clears will populate it.

## The featured book's own words, and a skeleton that had gone stale (2026-09-10)

- **The featured title read as a mistranslation on `/ar`.** Google returns
  "هاري بوتر والحجر الفلسفي" — a literal "philosophical stone" — where every
  Arabic edition of the novel says "هاري بوتر وحجر الفيلسوف". The fix is not in
  this block: `src/components/translation/canonical.ts` is a new map of
  hand-written renderings, consulted BEFORE the LRU and before the per-school
  `Translation` rows, because the machine's answer is already cached on
  localhost and in production and a later lookup would keep losing to it. The
  `القبس` tenant override that used to sit inline in `translate()` moved there
  too, so there is one place to look.
- **The blurb is the book's opening paragraph now**, not a one-line summary of
  it, and `line-clamp-4` is gone from `collaborate-section.tsx` — the paragraph
  is capped by the words, in the seed, rather than by CSS. Its Arabic is pinned
  by hand in the same map: machine-translating literary prose is what produced
  the title problem.
- **`LibrarySkeleton` had been drawing the PREVIOUS hero** — a 7xl wordmark
  beside a Lottie, in a two-column row — for as long as the green banner has
  shipped. It draws the banner now: real ground, real geometry, only the ink is
  a Skeleton. Its shimmer stops are tinted per surface (`ON_GREEN`, `ON_CREAM`)
  because `Skeleton` paints a gradient, so a `bg-*` utility on it is covered
  rather than applied, and the default near-white `accent` vanishes on cream.

### Carried, not fixed

- **Production still holds the old one-line description.** Deploys never seed
  here, and localhost and prod are different databases — the `Book` row needs
  the same update against prod before the paragraph appears there.
- **`/live`'s loading skeleton is the same object as this one** and was not
  checked in this pass. If it is equally stale, it is stale for the same reason.

## Books mirror blueprint (2026-09-11)

The book page is to become a measured mirror of the Apple Books store page; the
twenty-three iPhone captures in `public/books-app/` are the single source of truth.
The blueprint — every element's size, colour and type read off the 3x captures
with provenance tags, the deltas against the current render, the reference →
product action map, six decisions for Abdout (ground colour, tab bar, modal
chrome, schema for favourites and twins) and a phased plan — is at
`.claude/plans/books-app-mirror-blueprint.md`. Verify with
`node scripts/books-mirror-capture.mjs` + `python3 scripts/books-mirror-crops.py`
(renders at 390×844 @3x, crops both sides to the same rectangles).

Found while measuring, not yet fixed: `book-video.tsx` prints a hardcoded
"Book Preview" heading; the welcome dialog opens over the book page on a fresh
session and eats the first tap.
