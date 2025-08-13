## Timetable — Readiness Checklist (Beta)

Scope: Weekly grid per class/teacher, schedule config (working days/lunch), conflict detection.

### Evidence

- Prisma: `prisma/models/timetable.prisma` and `SchoolWeekConfig` (via `school.prisma` relations).
- Actions: `src/components/platform/timetable/actions.ts` includes `detectTimetableConflicts`, selectors; API routes `/api/timetable/*` in `src/app/api/timetable`.
- UI: `src/components/platform/timetable/*` grid, header, slot editor, conflicts drawer, config dialogs; tests present.
- Docs: `src/app/docs/timetable/page.mdx`; `ISSUE.md` with completed tasks.

### Ship checklist

- [x] Load weekly grid from server
- [x] Schedule config: working days + lunch
- [x] Conflict detection (teacher/room)
- [x] Suggestion fetching in conflicts drawer
- [ ] Upsert slot action (verify implemented end-to-end)
- [ ] Role guard (Admin/Owner/Developer for mutations)
- [ ] Print stylesheet QA (A4)
- [ ] Minimal tests for conflict detection on seeded data
- [ ] i18n strings

### Decision

- Status: SHIP AS BETA (feature-flag per tenant)
- Pre-prod QA: conflict counter, suggestion flow, slot save semantics, print.



