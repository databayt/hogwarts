## Announcements — Readiness Checklist

Scope: Create, list, publish/unpublish announcements scoped to school/class/role.

### Evidence

- Prisma: `prisma/models/announcement.prisma` with `AnnouncementScope`, indexes, `@@map("announcements")`.
- Server actions: `src/app/(platform)/announcements/actions.ts` (`createAnnouncement`, `toggleAnnouncementPublish`).
- UI: `src/components/platform/announcements/content.tsx` and `/(platform)/announcements/page.tsx` with data-table.
- Tenant scoping: queries/actions include `schoolId` from `getTenantContext()`.

### Ship checklist

- [x] Zod validation (`announcementSchema`) and server parse
- [x] Tenant scoping in all queries (`schoolId`)
- [x] Create + list + publish/unpublish flows
- [x] Pagination/sorting/search wired to server
- [x] Toasts and basic errors
- [ ] Minimal unit test for action happy-path and tenant guard
- [ ] Role guard (Owner/Admin/Teacher can create? confirm policy) in action
- [ ] i18n strings for labels

### Decision

- Status: READY TO SHIP
- Pre-prod QA: verify create/list in two tenants; confirm role policy; ensure toggles revalidate.



