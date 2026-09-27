---
feature: library
title: Library
status: partial
pillar: school-operations
personas: [student, teacher, parent, principal, owner]
routes: [/ar/s/{school}/library, /ar/s/{school}/library/books, /ar/s/{school}/library/books/{id}, /ar/s/{school}/library/my-profile, /ar/s/{school}/library/contribute, /ar/s/{school}/library/catalog, /ar/s/{school}/library/admin]
screenshots: [library-ar.png]
readme: ./README.md
docs: content/docs-en/library.mdx
updated: 2026-09-27
---

# Library — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every student, teacher and parent can browse the school's bookshelf on screen, borrow a book in one tap, and see when it is due back.

## The school's day without it

The librarian keeps a notebook of who took which book. A student asks "is that book in?" and someone walks to the shelf to check. Due dates live in the librarian's memory, and at the end of term nobody is sure which books are still out or with whom.

## What happens in Balqalam

1. The library opens on a green banner and shelves of book covers: latest books, featured books, literature and science. A school starts with a ready shelf of books from the start — nobody has to type in a catalogue first.
2. A student searches by title, author or genre, or filters by genre and grade level (kindergarten, primary, intermediate, secondary).
3. Opening a book shows a full page: cover, title, author, rating, description, how many copies the school has and how many are free, plus "more by this author" and similar books.
4. The student taps Borrow. A confirmation appears with the due date, set automatically two weeks ahead. Each person can hold up to five books at once.
5. "My library" lists what the reader has now, with due dates, flags anything past due, and keeps a history of everything returned.
6. The school admin can hide books the school does not want on its shelves, and set how many copies it holds and where they sit.
7. Teachers can suggest a new book. The Balqalam team reviews it before it appears on the shelves.

## Who it is for

- Student: browses covers like a bookshop, borrows in a tap, sees what is due back and when.
- Teacher: borrows too, and can suggest books for the shelf.
- Parent: can open the same library and borrow on the account they use.
- Principal / owner: a library that is ready on day one, with a record of every borrow and return instead of a notebook.

## Real screens to show

- `library-ar.png` — the Arabic library home: green banner ("مكتبة المدرسة تجمع كل ما يستحق أن تقرأه"), the featured book and the "latest books" shelf. Do NOT publish it as-is: a welcome dialog covers the middle, a developer badge sits in the corner, and the featured image is a film still and the covers are real published books (copyright). Recapture before use.
- Routes to capture with /record (Arabic, a demo student account):
  - `/ar/s/{school}/library/books/{id}` — the book page with the Borrow button and the due-date confirmation
  - `/ar/s/{school}/library/my-profile` — current loans and history
  - `/ar/s/{school}/library/books` — search and genre / grade filters

## What you can say

- Students, teachers and parents can borrow and return books on screen. [authorization.ts, docs-en/library.mdx]
- The due date is set automatically, 14 days from the day of borrowing. [actions.ts, config.ts]
- Each reader can hold up to 5 books at a time; the system refuses a sixth. [actions.ts, config.ts]
- A new school sees a ready shelf of books without typing in a catalogue. [README.md, docs-en/library.mdx]
- Search by title, author or genre, and filter by grade level. [book-list/, dictionaries/en/library.json]
- Each reader has a page of current loans, due dates, a past-due flag and full borrow history. [my-profile/content.tsx]
- A school can hide any book it does not want its students to see. [catalog/actions.ts, docs-en/library.mdx]
- Teachers can suggest books; each one is reviewed before it goes on the shelves. [contribute/actions.ts, docs-en/library.mdx]

## Do not say

- "Automatic overdue reminders" or "parents are notified when a book is late" — no reminder is sent; a past-due book is only flagged on the reader's own page. [ISSUE.md]
- "Scan books with a barcode" or "QR check-in" — planned, not built. [ISSUE.md]
- "Reserve a book" or "join a waitlist" — not built. [ISSUE.md]
- "Read books online / e-books" — digital reading is not built. [ISSUE.md]
- "Reading recommendations" or "tracks reading progress" — not built.
- Any number of books in the catalogue — the demo count is seed data, not a school's real collection.
- Do not claim a full library-management back office: the admin book list can look empty for a new school, and some labels (genre, grade) still show in English on the Arabic page. [ISSUE.md]
- No book cover, film still or character image from a real published title in a post.
- Global bans: no "works offline", no app-store app, no hours or percentages saved, no "advanced analytics", never the old codename.

## Post angles

1. "Who has the chemistry book? The notebook doesn't know." — principal — school-operations — The librarian's notebook versus a record of every borrow and return.
2. "Borrow a book in one tap. The due date sets itself." — student — product-proof — Screen recording: open a book, tap Borrow, the two-week due date appears.
3. "How a student checks what they owe the library" — parent — school-operations — Walk through "My library": current loans, due dates, what is past due.
4. "A library on day one, before anyone types a single title" — owner — product-proof — New schools open to ready shelves; the school hides what it does not want.
5. "What is the one book every student at your school should borrow this year?" — teacher — school-operations — Question post inviting teachers; mention they can suggest books for the shelf.

## Connects to

- [Dashboard](../school-dashboard/dashboard/SPOTLIGHT.md) — the library sits in the school sidebar next to the other daily tools.

## Sources

- src/components/library/README.md, ISSUE.md, CLAUDE.md
- src/components/library/actions.ts, config.ts, authorization.ts, content.tsx
- src/components/library/my-profile/content.tsx
- src/components/library/contribute/actions.ts, src/components/library/catalog/actions.ts
- src/components/library/admin/books/content.tsx, book-form.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/library/ (all pages, incl. admin/books/new/page.tsx which redirects to contribute)
- src/components/internationalization/dictionaries/{en,ar}/library.json
- content/docs-en/library.mdx, content/docs-en/marketing-brief.mdx
- library-ar.png
- src/components/school-dashboard/library/management.tsx — an older, standalone library-management screen; no route or component imports it, so it is not what users see (no separate spotlight)
