# Library — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 80%
**Last Updated:** 2026-03-19

---

## MVP Checklist

### Public Views

- [x] Library content page (hero + book list + collaborate)
- [x] Hero section with featured book
- [x] Book list with cards
- [x] Book list toolbar (search/filter)
- [x] All books content view
- [x] Book detail page (cover, video, rating, description)
- [x] Borrow book action from detail page
- [x] Collaborate section CTA

### Admin

- [x] Admin dashboard content
- [x] Books management table
- [x] Add new book page
- [x] Book form (create/edit)
- [x] Table row actions (edit, delete)
- [x] File upload for covers
- [x] Color picker for cover color

### Catalog (Cross-School)

- [x] Catalog browser
- [x] Book picker (add from catalog to school library)
- [x] Catalog search/add actions
- [x] Catalog must be used for book creation (no standalone creation)

### Contributions

- [x] Contribution form page
- [x] User contribution history
- [x] Submit/manage contribution actions

### User Profile

- [x] Borrow history and reading stats

### Server Actions

- [x] `createBook` (catalog-linked only)
- [x] Borrow book action
- [x] Return book action
- [x] Update book action
- [x] Delete book action
- [x] Multi-tenant scoping (`getTenantContext()` + `schoolId`)

### Authorization

- [x] RBAC permission checks (`authorization.ts`)
- [x] Role-based access: DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, STAFF, ACCOUNTANT

### Validation

- [x] Book schema (Zod)
- [x] Borrow/return schemas
- [x] Update/delete schemas

### Testing

- [x] Catalog action tests
- [x] Contribution action tests

---

## Known Issues

### P2 — Medium

- **No overdue book notifications**: `BorrowStatus.OVERDUE` exists as a type but there is no cron job or scheduled action to transition `BORROWED` records to `OVERDUE` status or send reminders.
- **Static assets in component directory**: `books-row-01.png` and `books-row-02.png` are stored alongside components rather than in `public/`. This works but is unconventional for Next.js.
- **Borrow due date validation**: `borrowBookSchema` validates `dueDate > now()` but the default borrow duration from `config.ts` is not enforced server-side -- the client could submit any future date.

---

## Enhancements (Post-MVP)

- Add overdue book detection (cron or on-read check) and email notifications
- Add book reservation / waitlist when all copies are borrowed
- Add reading progress tracking
- Add book recommendations based on borrow history
- Move static assets to `public/library/`
- Add pagination to book list for large libraries
- Add barcode/QR scanning for physical book check-in/out

---

**Last Review:** 2026-03-19
