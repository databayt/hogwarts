# Library Block

School library management system with global-first catalog, borrowing, admin tools, and community contributions.

## Architecture

```
CatalogBook (global, no schoolId)
    |
    |-- SchoolBookSelection (bridge: schoolId + catalogBookId)
    |       isActive: false = book hidden for this school
    |       No record = book visible (default)
    |
    |-- Book (school-scoped, lazy-created on detail page visit)
            |
            |-- BorrowRecord (school-scoped, tracks borrow/return)
```

**Global-first**: All schools see all published/approved CatalogBooks out of the box. No provisioning or onboarding wiring needed. Schools can hide individual books or groups via SchoolBookSelection.

**Lazy provisioning**: When a user visits a book detail page, a school-scoped Book record is auto-created from the CatalogBook. This Book is used for borrow/return tracking.

## Routes

| Route                      | Page                       | Component                         |
| -------------------------- | -------------------------- | --------------------------------- |
| `/library`                 | Library home (hero + rows) | `content.tsx`                     |
| `/library/books`           | All books (search/filter)  | `book-list/all-books-content.tsx` |
| `/library/books/[id]`      | Book detail + borrow       | `book-detail/content.tsx`         |
| `/library/catalog`         | Browse global catalog      | `catalog/content.tsx`             |
| `/library/admin`           | Admin dashboard            | `admin/content.tsx`               |
| `/library/admin/books`     | Manage books table         | `admin/books/content.tsx`         |
| `/library/admin/books/new` | Add book from catalog      | `admin/books/new-content.tsx`     |
| `/library/contribute`      | Submit a book contribution | `contribute/content.tsx`          |
| `/library/contributions`   | My contributions history   | `contribute/my-contributions.tsx` |
| `/library/my-profile`      | Borrow history + stats     | `my-profile/content.tsx`          |

## File Structure

```
library/
├── CLAUDE.md                   # Block context for Claude Code
├── README.md                   # This file
├── ISSUE.md                    # Production readiness tracker
├── content.tsx                 # Library home: queries CatalogBook (global)
├── hero.tsx                    # Hero section with featured book
├── collaborate-section.tsx     # Featured book CTA (dictionary-ized)
├── library-animation.tsx       # Decorative animation
├── book-cover.tsx              # Reusable cover with image/fallback
├── actions.ts                  # Server actions: CRUD, borrow, return, overdue
├── authorization.ts            # RBAC: 8 roles x 7 actions
├── validation.ts               # Zod schemas: book, borrow, return, update, delete
├── types.ts                    # Book, BookListItem, BorrowRecord, enums
├── config.ts                   # Constants: borrow limits, genres, grade levels
├── styles.css                  # Library-specific styles
│
├── book-list/                  # Book browsing
│   ├── content.tsx             # BookList: horizontal scroll row (accepts BookListItem[])
│   ├── all-books-content.tsx   # All books: queries CatalogBook with search/filter
│   ├── book-card.tsx           # Card component (accepts BookListItem)
│   └── books-toolbar.tsx       # Search/filter toolbar (client)
│
├── book-detail/                # Single book view
│   ├── content.tsx             # Loads CatalogBook + lazy-creates school Book for borrow
│   ├── book-video.tsx          # Embedded video player
│   ├── star-rating.tsx         # Rating display (stars)
│   └── borrow-book.tsx         # Borrow/return action button (client)
│
├── catalog/                    # Global book catalog (admin)
│   ├── content.tsx             # Catalog browser
│   ├── book-picker.tsx         # Pick books from catalog to add
│   ├── actions.ts              # select/deselect/toggle/update selection
│   └── __tests__/
│       └── actions.test.ts     # 33 tests
│
├── admin/                      # Admin management
│   ├── content.tsx             # Admin dashboard
│   └── books/
│       ├── content.tsx         # Books management table
│       ├── new-content.tsx     # Add book page
│       ├── book-form.tsx       # Book create/edit form
│       ├── book-table-actions.tsx  # Table row actions
│       ├── file-upload.tsx     # Cover image upload
│       └── color-picker.tsx    # Cover color picker
│
├── contribute/                 # Community contributions
│   ├── content.tsx             # Contribution form
│   ├── my-contributions.tsx    # User's contribution history
│   ├── actions.ts              # Submit/manage contributions
│   └── __tests__/
│       └── actions.test.ts     # Contribution tests
│
├── my-profile/                 # User library profile
│   └── content.tsx             # Borrow history, reading stats
│
└── __tests__/                  # Comprehensive test suites
    ├── actions.test.ts         # 39 tests: all 6 server actions
    ├── authorization.test.ts   # 35 tests: 8 roles x 7 actions + edge cases
    └── validation.test.ts      # 46 tests: all Zod schemas
```

## Data Flow

### Library Home (`content.tsx`)

1. `getTenantContext()` for schoolId
2. Query `SchoolBookSelection` where `isActive: false` to get hidden book IDs
3. Query `CatalogBook` (published + approved + public/school visibility), excluding hidden
4. Map to `BookListItem[]` (lightweight type) for BookList/BookCard

### Book Detail (`book-detail/content.tsx`)

1. Load `CatalogBook` by ID (global lookup)
2. Check if school has hidden this book via `SchoolBookSelection`
3. Find or create school-scoped `Book` from CatalogBook data (lazy provisioning)
4. Load borrow status from school-scoped `BorrowRecord`
5. Load related books from `CatalogBook` (same author, same genre)

### All Books (`book-list/all-books-content.tsx`)

1. Same global CatalogBook query as homepage
2. Adds search, genre filter, grade level filter
3. Server-side pagination

### Borrow/Return (`actions.ts`)

1. `borrowBook`: Validates school Book exists, checks availability, creates BorrowRecord in transaction
2. `returnBook`: Validates BorrowRecord belongs to school, updates status + copies in transaction

## Authorization (RBAC)

| Role       | read | create | update | delete | borrow | return | manage |
| ---------- | ---- | ------ | ------ | ------ | ------ | ------ | ------ |
| DEVELOPER  | Y    | Y      | Y      | Y      | Y      | Y      | Y      |
| ADMIN      | Y    | Y      | Y      | Y      | Y      | Y      | Y      |
| TEACHER    | Y    | -      | -      | -      | Y      | Y      | -      |
| STUDENT    | Y    | -      | -      | -      | Y      | Y      | -      |
| GUARDIAN   | Y    | -      | -      | -      | Y      | Y      | -      |
| STAFF      | Y    | -      | -      | -      | -      | -      | -      |
| ACCOUNTANT | Y    | -      | -      | -      | -      | -      | -      |
| USER       | -    | -      | -      | -      | -      | -      | -      |

## Types

- `BookListItem` -- lightweight display type (id, title, author, genre, coverUrl, coverColor, rating, createdAt). Used by BookList and BookCard. Compatible with both CatalogBook and Book shapes.
- `Book` -- full school-scoped type with description, copies, summary, gradeLevel, ISBN, etc.
- `BorrowRecord` -- tracks who borrowed what, with status (BORROWED/RETURNED/OVERDUE).

## Testing

```bash
# Run all library tests (160 tests)
pnpm vitest run src/components/library/ --reporter=verbose

# Run catalog-setup tests including setupLibraryForSchool (54 tests)
pnpm vitest run src/lib/__tests__/catalog-setup.tests.ts --reporter=verbose
```

| Suite                                  | Tests | Coverage                         |
| -------------------------------------- | ----- | -------------------------------- |
| `__tests__/actions.test.ts`            | 39    | All 6 server actions             |
| `__tests__/authorization.test.ts`      | 35    | 8 roles x 7 actions + edge cases |
| `__tests__/validation.test.ts`         | 46    | All Zod schemas                  |
| `catalog/__tests__/actions.test.ts`    | 33    | 4 catalog actions                |
| `contribute/__tests__/actions.test.ts` | 7     | Contribution flow                |

## Status

**Completion:** 95% | **Blockers:** None
