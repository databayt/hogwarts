# Catalog Block — Issue Tracker

**Status:** PRODUCTION READY (code paths); content/assets partial
**Completion:** 90%
**Last Updated:** 2026-06-10

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

- [x] Catalog suites green: 332 tests was 193-failed mock drift (fixed 2026-06-10) + new flag/pinned/config tests
- [x] tsc 0 errors; no `as any` in catalog seeds/core
- [x] i18n: picker namespace `school.subjects.catalog` populated (en+ar) incl. pinned/reminder keys

### Docs

- [x] Single consolidated `/docs/catalog` hub (en+ar) — retired curriculum-engineering / us-curriculum / sudan-curriculum / concept pages with redirects
- [x] Block docs: README.md / CLAUDE.md / ISSUE.md (this file)

---

## P1 — production gaps (next)

- [ ] **Live-DB seed sync** (deploy-gated): delete stale `gb-national-g*` (~156) + `ib-diploma-g*` (~114) rows; run gb/cbse/caie-igcse/ib deep + concepts/banners against prod Neon. Run ONLY after a "deploy" + Neon branch-before-touch.
- [ ] **Asset gaps**: banners cover 10/23 concepts (13 keys 404); textbook covers never uploaded (icon fallback everywhere); textbook PDFs Sudan-only; lesson thumbnails US-only; `videos.ts` placeholder S3 keys with no backing mp4; 51 books on external OpenLibrary cover URLs; materials are metadata-only (null fileUrl).
- [ ] **Partial-failure recovery**: provisioning is fire-and-forget at onboarding; `ensureSubjectSelections` self-heals selections only — levels/grades/streams/timetable are not retried.
- [ ] **Arab nationals depth**: SA/EG/AE/QA/KW/JO are subjects-only (no chapters/lessons) pending ministry TOCs; transnational deep coverage is single-grade (CAIE g10, IB g12, CBSE g10).

## P2 — tracked improvements

- [ ] Extract timetable/section auto-provision out of `setup.ts` (single responsibility; ~1,700 lines)
- [ ] Batch national seeders (~2,850 sequential awaits; SD seed 822s) with createMany/bulk SQL
- [ ] `getSubjectStreamType` / `getDefaultWeeklyPeriods` keyword patterns are bilingual-fragile — fold into academic-config or registry metadata
- [ ] Seed the `Quiz` model (currently zero rows) or remove it from the schema docs
- [ ] Sudan TOC extraction quality: grades 10-12 have ~71% of subjects with 0 lessons (garbled pdftotext)
- [ ] Dedicated `proposal_approved` / `proposal_rejected` NotificationTypes (Postgres ALTER TYPE + 5-file fan-out) if metadata.kind proves limiting
- [ ] Exam / question-bank purchase flow (mirror VideoPurchase) — fields already exist
- [ ] Mock-exam typing: `Exam.examType` is a free string ("midterm" | "final" | "chapter_test" | "practice") — consider an enum

## Deferred / out of scope (decided 2026-06-10)

- Exam/question Stripe purchases (manage-flags only this round)
- Dual on-disk US curriculum merge (`curriculum/us` Aldar variant stays unmerged)
- Per-school catalog pricing overrides
