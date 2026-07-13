# Students — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 92%
**Last Updated:** 2026-07-13

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Class enrollment management (many-to-many via StudentClass)
- [x] Guardian relationships (StudentGuardian linking) -- RESOLVED 2026-03-13
- [x] Search and filtering (name, status, class) -- className now server-side (2026-07-13)
- [x] Export student data to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Server-side pagination and sorting (Load-More)
- [x] Multi-step wizard add form (attachments, personal, location, academic — older steps retired/redirected)
- [x] Photo upload + document attachments (S3 via FileUploadField/useUpload) -- wired
- [x] Row actions (View, Edit, Delete with confirmation dialog)
- [x] Breadcrumb with student name on detail page
- [x] RBAC authorization checks
- [x] DOB + gender collected in the wizard personal step (2026-07-13)
- [ ] Loading skeletons and empty states (C2)

## Known Issues

### P2 — Medium

- [ ] Performance/analysis/reports pages are stub routes
- [ ] No loading skeletons for table (C2)
- [ ] Load-More only — no total count / numbered pagination (C3)
- [ ] Classroom **facet UI** not yet in the toolbar (the `className` param IS
      now wired server-side; only the toolbar chip is missing)

## 2026-07-13 — /en/students review pass (batch 1 SHIPPED, local main)

Shipped (commits `fe87de9e7`, `9b8944f2d`):

- [x] B1/E1/E2: wizard + public application now collect DOB + gender (were
      never asked; `createDraftStudent` stamped every student "born today,
      male"). Stub DOB is now a neutral 2000-01-01 sentinel.
- [x] B2: wizard phone label no longer shows a false required `*`.
- [x] A4: bare `/students/add` mints a draft + redirects (was a dead-end).
- [x] A3: service-worker registration guards undefined registration.
- [x] A2: WebSocket connect error logs once, not per reconnect attempt.
- [x] C1: `className` filter mapped into the Prisma where clause.
- [x] D1/D2: deleted dead `queries.ts` + stale `types.ts`.

Remaining from the review (see plan `read-https-demo-databayt-org-en-students-luminous-bird`):

- [ ] E6 (guardian `fatherEmail`/`motherEmail` → `*Whatsapp`): approved as a
      **full column rename + migration**, but it also needs `provisionStudent`
      extended to persist a guardian WhatsApp `GuardianPhoneNumber` (the core
      has no whatsapp field today) and a deploy-coordinated `ALTER TABLE
  RENAME`. Deferred to a dedicated, runtime-verified unit.
- [ ] B3: collect email in the wizard (feeds the login; currently "No email").
- [ ] B4: tighten wizard `requiredSteps` (grade/section) for SIS completeness.
- [ ] E3/E4/E5: guardian occupation + generic guardian in the wizard; align
      name/phone validation across the two flows; drop dead application
      nationality/religion/category schema fields.
- [ ] A1: re-enable error reporting in `s/[subdomain]/error.tsx` (Sentry
      capture is commented out) — the demo intermittently hits this boundary.

### Enhancements (Post-MVP)

- [ ] Bulk class assignment (select multiple students)
- [ ] Status change history log with timestamps
- [ ] Attendance summary per student
- [ ] Grade progression tracking
- [ ] Transfer between schools

---

**Last Review:** 2026-07-13
