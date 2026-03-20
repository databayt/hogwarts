## Library — School library management system

### Overview

The library block provides a complete library management system for schools. It includes a public-facing book catalog with hero, book list, and detail views, as well as an admin interface for managing books. Features include borrowing/returning books, a shared catalog with community contributions, book detail pages with ratings and video, and RBAC-based authorization. All data is scoped by `schoolId` for multi-tenant isolation.

### File Structure

```
library/
├── content.tsx                # Root library page (hero + book list + collaborate)
├── hero.tsx                   # Library hero section (featured book)
├── collaborate-section.tsx    # Community collaboration CTA
├── library-animation.tsx      # Decorative animation
├── book-cover.tsx             # Reusable book cover component
├── actions.ts                 # Server actions: CRUD books, borrow, return
├── authorization.ts           # RBAC permission checks (LibraryAction)
├── validation.ts              # Zod schemas: book, borrow, return, update, delete
├── types.ts                   # Book, BorrowRecord, BorrowStatus, ActionResponse
├── config.ts                  # Library constants (borrow duration, limits)
├── styles.css                 # Library-specific styles
├── books-row-01.png           # Static assets
├── books-row-02.png
│
├── book-list/                 # Book browsing
│   ├── content.tsx            # Book list server component
│   ├── all-books-content.tsx  # All books view
│   ├── book-card.tsx          # Individual book card
│   └── books-toolbar.tsx      # Search/filter toolbar
│
├── book-detail/               # Single book view
│   ├── content.tsx            # Book detail page
│   ├── book-cover.tsx         # Detail cover display
│   ├── book-video.tsx         # Embedded video player
│   ├── star-rating.tsx        # Rating display
│   └── borrow-book.tsx        # Borrow action button
│
├── catalog/                   # Shared book catalog (cross-school)
│   ├── content.tsx            # Catalog browser
│   ├── book-picker.tsx        # Pick books from catalog to add to school
│   ├── actions.ts             # Catalog search/add actions
│   └── __tests__/
│       └── actions.test.ts    # Catalog action tests
│
├── admin/                     # Admin book management
│   ├── content.tsx            # Admin dashboard
│   └── books/
│       ├── content.tsx        # Books management table
│       ├── new-content.tsx    # Add book page
│       ├── book-form.tsx      # Book create/edit form
│       ├── book-table-actions.tsx  # Table row actions (edit, delete)
│       ├── file-upload.tsx    # Cover image upload
│       └── color-picker.tsx   # Book cover color picker
│
├── contribute/                # Community book contributions
│   ├── content.tsx            # Contribution form page
│   ├── my-contributions.tsx   # User's contribution history
│   ├── actions.ts             # Submit/manage contribution actions
│   └── __tests__/
│       └── actions.test.ts    # Contribution action tests
│
└── my-profile/                # User library profile
    └── content.tsx            # Borrow history, reading stats
```

### Authorization (RBAC)

| Role                       | Permissions                    |
| -------------------------- | ------------------------------ |
| DEVELOPER                  | Full access across all schools |
| ADMIN                      | Full access within school      |
| TEACHER, STUDENT, GUARDIAN | Read + borrow + return         |
| STAFF, ACCOUNTANT          | Read-only                      |

### Key Validation Schemas

- `bookSchema` -- title, author, genre, rating (0-5), coverUrl, coverColor (hex), description, totalCopies, optional ISBN/publisher/year/language/pageCount
- `borrowBookSchema` -- bookId, userId, schoolId, dueDate (must be future)
- `returnBookSchema` -- borrowRecordId, schoolId
- `updateBookSchema` / `deleteBookSchema` -- partial updates and deletion

### Status

**Completion:** 80% | **Blockers:** None
