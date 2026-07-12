# Catalog Block — Issue Tracker

**Status:** PRODUCTION READY (code paths); content/assets partial
**Completion:** 95%
**Last Updated:** 2026-06-12

---

## MVP Checklist

### Architecture

- [x] Global catalog (no schoolId) + schoolId-scoped bridges (SubjectSelection, ContentOverride, InstructorPreference, BookSelection)
- [x] School mirrors with `catalogXxxId` back-pointers (SchoolExam, SchoolAssignment, QuestionBank, SchoolBook, SchoolExamTemplate)
- [x] ContentStatus / ApprovalStatus / ContentVisibility enums used consistently
- [x] PUBLISHED-only filter on every school-facing read (global-search leak fixed 2026-06-10)

### Provisioning

- [x] `setupCatalogForSchool` + `setupDefaultsForSchool` + lazy `ensureSubjectSelections` self-heal
- [x] Progressive `findSubjects` fallback (country+curriculum → broad → `*` → US baseline)
- [x] Per-curriculum academic structure (`academic-config.ts`) — SD byte-identical, US 5+3+4, GB key stages, CBSE, generic fallback (de-Sudanized 2026-06-10)
- [x] Idempotency guards (skipIfExists inside transaction)
- [x] **Provisioning doctor** (`provision.ts`): `getProvisioningStatus` + `repairProvisioning` — detects/repairs missing stages (defaults → structure → selections → schedule → sections → timetable → join code), each stage isolated; wired into onboarding `after()`, manual `publishSchool`, and the operator tenants table ("Repair Provisioning") (2026-06-12)
- [x] `applyTimetableStructureForNewSchool` re-runs no longer duplicate periods (idempotency bug fixed 2026-06-12)
- [x] **Terms-aware schedule stage** (2026-06-12): `applyTimetableStructureForNewSchool` now derives the school year + N terms from `ACADEMIC_CALENDARS` (timetable/calendars.ts) by country/structure/date — SA 2-semester (post-1447 revert), AE/KW/GB 3-term, IN Apr–Mar year-wrap, regional GULF/MENA fallbacks; exactly one term `isActive` by date. SchoolYear matched by `yearName` (stale prior-year records no longer adopt new terms); weekConfig `termId` falls back to latest term when none is active (repair now converges). `resolveActiveTerm` priority-4 creates the full calendar set too.
- [x] **Doctor hardening** (2026-06-12): `weekConfigs` counted + flags `schedule`; `classroomTypes === 0` flags `sections`; unknown structure slug now FAILS the schedule stage loudly (was silently marked repaired). Docs: new `/docs/provision` (en+ar) owns the pipeline reference.
- [x] Stream patterns are curriculum-owned (`academic-config.ts` `streamSubjectPatterns`, SD-family only) — no more global bilingual keyword matching (2026-06-12)

### Request → Approval flow (opt-in)

- [x] School proposes subject/chapter/lesson (`Proposal`, ADMIN/DEVELOPER/TEACHER)
- [x] Operator review queue with pending badges (`/catalog/proposals`)
- [x] Approve publishes to catalog only — auto-bridge removed (opt-in, 2026-06-10)
- [x] Approve/reject notifications to proposer + school ADMINs (in-app + email, school-language aware)
- [x] Pinned "Requested by your school — now ready" section + Add CTA in the school picker
- [x] One-time reminder dialog (localStorage-dismissed, pin persists until added)

### Visibility / paid content

- [x] Operator flag management: `updateContentFlags` + shared content-flags dialog (visibility/status/price)
- [x] Approval also publishes (Question/Material/Assignment were stuck DRAFT-invisible — fixed 2026-06-10)
- [x] PAID guard: price>0 + 3-letter currency; PAID rejected for non-priceable types
- [x] Video paid gating end-to-end (Stripe VideoPurchase, signed CloudFront, null-URL unpurchased)
- [x] School subject on/off (`SubjectSelection.isActive`) + hide chapter/lesson/video (`ContentOverride`)
- [x] ContentOverride enforcement on subject detail page + admin Customize panel mounted (was orphaned — wired 2026-06-10)

### Seeds & pipeline

- [x] Registry-driven 12 curricula (`registry.ts`), generic tree engine (`engine.ts`)
- [x] Deep seeds: SD (g1-12 + 118 textbook PDFs), US (g1-12); GB deep tree from `curriculum/uk`
- [x] `content.ts` idempotent re-runs + typed CreateManyInput arrays (fixed 2026-06-10)

### Tests & quality

- [x] Catalog suites green: 361 tests / 21 files (2026-06-12; was 332) — adds provisioning-doctor (10), banner-fallback (5), periods-idempotency suites
- [x] tsc 0 errors; no `as any` in catalog seeds/core
- [x] i18n: picker namespace `school.subjects.catalog` populated (en+ar) incl. pinned/reminder keys
- [x] Operator action errors are snake_case codes mapped at display time (`error-messages.ts` `catalogActionError`, prettify fallback) — no raw codes in toasts; approve/reject/delete flows no longer fail silently (2026-06-12)

### Docs

- [x] Single consolidated `/docs/catalog` hub (en+ar) — retired curriculum-engineering / us-curriculum / sudan-curriculum / concept pages with redirects
- [x] Block docs: README.md / CLAUDE.md / ISSUE.md (this file)

---

## P1 — production gaps (next)

- [ ] **Live-DB seed sync** (deploy-gated): now ONE command — `pnpm tsx scripts/catalog-deploy-sync.ts` (plan-mode report by default; `--execute` deletes only UNREFERENCED stale `gb-national-g*`/`ib-diploma-g*` rows — referenced ones are listed for manual migration since SubjectSelection/Enrollment CASCADE — then seeds registry/gb/cbse/caie-igcse/ib/concepts/banners). Run ONLY after a "deploy" + Neon branch-before-touch.
- [ ] **Asset uploads** (external; the code side is now resilient): textbook PDFs Sudan-only; lesson thumbnails US-only; real lesson mp4s missing (seed now HEAD-probes and only registers videos whose mp4 exists, removing stale rows); banner seed now guarantees 23/23 concepts by borrowing the nearest covered neighbor; book covers still on OpenLibrary until `scripts/snapshot-book-covers.ts` runs in an env with valid AWS creds; material files still null (cards are now clickable the moment a `fileUrl`/`externalUrl` lands).
- [x] **Partial-failure recovery** — provisioning doctor shipped 2026-06-12 (see Provisioning above).
- [x] **`schoolLevel="middle"` provisioning gap** (2026-07-12) — `setup.ts` now maps `middle` → Grades 7-9 year levels + `["MIDDLE"]` catalog level; previously a middle school got ZERO year levels and fell back to all-3-levels catalog. `secondary` intentionally keeps its historical 7-12 coverage (`["MIDDLE","HIGH"]`) — do not narrow it without a data migration for existing schools.
- [ ] **Arab nationals depth**: SA/EG/AE/QA/KW/JO are subjects-only (no chapters/lessons) pending ministry TOCs; transnational deep coverage is single-grade (CAIE g10, IB g12, CBSE g10).

## P2 — tracked improvements

- [x] Extract timetable/section auto-provision out of `setup.ts` — moved to `provision.ts` with the doctor; setup.ts 1,666→1,063 lines (2026-06-12)
- [ ] Batch national seeders (~2,850 sequential awaits; SD seed 822s) with createMany/bulk SQL
- [x] `getSubjectStreamType` folded into academic-config as per-curriculum `streamSubjectPatterns` (SD-family only); dead `getDefaultWeeklyPeriods` deleted — live path was already `getReferenceWeeklyPeriods` (2026-06-12)
- [x] `Quiz` model — DECIDED 2026-06-12: keep as reserved schema (zero readers/writers in app code; the course-page "quiz" stat counts PUBLISHED exams, deliberately). Docs say "Defined; not seeded". Dropping the table is a destructive migration → only with explicit approval if the quiz feature is descoped for good.
- [ ] Sudan TOC extraction quality: grades 10-12 have ~71% of subjects with 0 lessons (garbled pdftotext)
- [ ] Dedicated `proposal_approved` / `proposal_rejected` NotificationTypes (Postgres ALTER TYPE + 5-file fan-out) if metadata.kind proves limiting
- [ ] Exam / question-bank purchase flow (mirror VideoPurchase) — fields already exist
- [x] `Exam.examType` typing — DECIDED 2026-06-12: NOT a catalog-scoped fix. Two live vocabularies coexist (school exams: `"MIDTERM"`-style uppercase ×23 call sites; catalog/templates: lowercase `"midterm"/"final"/"chapter_test"/"practice"/"custom"`). Unifying is an exams-block refactor + a data migration; tracked there.

## Deferred / out of scope (decided 2026-06-10)

- Exam/question Stripe purchases (manage-flags only this round)
- Dual on-disk US curriculum merge (`curriculum/us` Aldar variant stays unmerged)
- Per-school catalog pricing overrides
