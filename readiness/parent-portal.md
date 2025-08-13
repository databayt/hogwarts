## Parent/Student Portal (Read-only MVP) — Readiness Checklist

Scope: Parents view linked students' attendance and announcements. Students view their own.

### Evidence

- Models: Guardian/Student relations in `school.prisma` (roles present). No dedicated routes yet.
- Docs: Requirements and issues reference read-only portal.

### Gaps to MVP

- [ ] Routes under `/(platform)/portal` or `/(school)/portal` with mirrored components
- [ ] Server queries: list announcements filtered by class/role/student; attendance summary per student
- [ ] Role guard for GUARDIAN and STUDENT
- [ ] Minimal UI (mobile-first)
- [ ] i18n strings
- [ ] Tests for tenant scoping and role access

### Decision

- Status: NOT IMPLEMENTED — Target after core shipping features



