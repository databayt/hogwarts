# Announcements -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-07-17

---

## MVP Checklist

- [x] Announcement CRUD operations with Zod validation
- [x] Two-step wizard (content, targeting)
- [x] Scope targeting (SCHOOL, CLASS, ROLE)
- [x] Publish/unpublish workflow
- [x] Scheduled publishing support
- [x] CSV export (via `table.tsx`'s toolbar export — see note below)
- [x] On-demand translation (Arabic/English)
- [x] Announcement templates
- [x] Archived announcements page
- [x] Configuration page
- [x] Multi-tenant isolation (schoolId scoping)
- [x] RBAC authorization (wizard path hardened 2026-07-17)
- [x] Table with search, sort, filter, pagination
- [x] Unit tests (actions + validation + wizard RBAC)
- [ ] Read receipt tracking — **NOT built** (the `AnnouncementRead` model exists
      but nothing reads or writes it; `markAsRead()` is a comment only)
- [ ] Unread count badges — not built (depends on read tracking)
- [ ] Bulk operations (publish, delete, archive) — not built
- [ ] Push notifications on publish
- [ ] Email notifications to targeted audience

> The checklist above previously claimed read tracking, unread badges, and bulk
> operations were done, and `README.md` listed ~10 files that do not exist
> (`read-tracking.ts`, `bulk-actions.ts`, `scheduling-section.tsx`, the badge
> components, `templates-step.tsx`, `__tests__/`). Corrected 2026-07-17.
> Tests live at `src/tests/school-dashboard/listings/announcements/`, not in a
> block-local `__tests__/` (the repo retired that convention).

## Known Issues

### P0 -- Critical

_None_ — the wizard RBAC bypass below was fixed on 2026-07-17.

### P1 -- High

- [ ] Push/email notification delivery not wired (dispatch infrastructure exists but triggers incomplete)
- [ ] `checkAnnouncementPermission("read", ...)` only checks same-school: it does
      not require `published`, and does not verify scope targeting. Any
      authenticated user in the school can therefore fetch another user's draft
      or a class-A-only announcement via `/announcements/[id]`. Deliberately not
      fixed in the 2026-07-17 pass — tightening reads touches the parent portal
      and dashboard widgets, so it needs its own scoped change + tests.

### P2 -- Medium

- [ ] Scheduled publishing requires external cron trigger (no built-in scheduler)
- [ ] Rich text editor not yet integrated for announcement body
- [ ] `actions.ts` is ~1.1k lines and mixes queries, dispatch, and config
      handling; the legacy `createAnnouncement`/`updateAnnouncement` path and the
      wizard path duplicate scope/permission logic in different shapes.

## Enhancements (Post-MVP)

- [ ] Push notifications via web push API
- [ ] Email notification delivery on publish
- [ ] Rich text / markdown editor for body content
- [ ] File attachments (PDF, images)
- [ ] Announcement expiration dates with auto-archive
- [ ] Priority levels with visual indicators
- [ ] Analytics dashboard (read rates, engagement over time)

---

## 2026-07-17 — optimization + i18n pass

**Security (P0, fixed).** The wizard steps trusted the tenant context alone.
`getTenantContext()` resolves `schoolId` from the `x-subdomain` header _before_
it consults the session, so a tenant context proved nothing about the caller:

- `wizard/content/actions.ts` and `wizard/targeting/actions.ts` had **no
  `auth()` call at all**, and `updateAnnouncementTargeting` is what sets
  `published: true`.
- `createDraftAnnouncement` checked only that a session existed, hardcoded
  `scope: "school"`, and never set `createdBy`.
- `template-actions.ts` `updateTemplate`/`deleteTemplate` had no `auth()` either.

Net effect: any authenticated user — including a STUDENT or GUARDIAN — could
drive createDraft → updateContent → updateTargeting({published, scope:"school"})
→ complete, and publish a school-wide announcement.

Fix: `guard.ts` at the block root centralizes auth + RBAC. `resolveContext()`
issues `auth()` and `getTenantContext()` concurrently (the latter calls `auth()`
internally, so the old code resolved the session twice, sequentially, in ~12
actions). `guardAnnouncement(id, action)` loads ownership fields and asserts
permission. Drafts now seed from `getAllowedScopes(role)` (ADMIN → school,
TEACHER → class, others → refused) and record `createdBy` — without which the
teacher-ownership branch of `checkAnnouncementPermission` could never pass.
Pinned by 13 regression tests in `wizard-authorization.test.ts`, verified to fail
against the pre-fix behaviour.

**Dead code removed (~490 lines).** `export.ts` (316 lines) had zero callers —
the CSV users actually get is `table.tsx`'s toolbar export. Deleting it took
~20 i18n gaps with it. Also removed: `createAnnouncementWithTranslation`
(unreferenced, and the only write path missing `prewarm`), `getAnnouncementDetail`,
and — cascading from `export.ts` — `getAnnouncementsByIds` + `announcementDetailSelect`.

**i18n.** The dictionary was already complete (247 keys, zero EN/AR drift); the
gaps were wiring failures:

- `config/page.tsx` rebuilt ~45 labels via `lang === "ar" ? … : …` ternaries,
  duplicating a mapping `settings/page.tsx` also maintained. Both mapping objects
  are gone — `AnnouncementConfigForm` already resolves every label off the
  announcements section itself, so both routes now pass `d` straight through.
  This removes the drift-by-construction between two routes rendering one form.
- `config-form.tsx` read `ann?.urgent`, but "urgent" lives at
  `priority.urgent.label` — so that one priority silently fell back to English.
- `resolveActionError()` existed in `lib/` for exactly this block's problem but
  was imported nowhere in it; server actions returning codes surfaced raw
  (`"UNAUTHORIZED"`) in toasts. Now wired in the wizard forms and config form.
- ~19 hardcoded server-action error strings → `ACTION_ERRORS` codes. Note
  `assertAnnouncementPermission` throws an English string that the old catch
  blocks returned verbatim, so even the "correct" legacy path leaked English.
- Zod messages → `createXSchema(v?: ValidationHelper)` factories in all three
  `validation.ts` files, using exact catalog keys (`titleRequired`, `futureDate`,
  `roleRequired`, `startBeforeEnd`) rather than a generic "Required".
- Wizard config gained `i18nGroupLabels`/`i18nFinalLabel` (the `WizardConfig`
  type already supported both); `layout.tsx` no longer hardcodes `finalLabel="Publish"`.
- CSV headers in `table.tsx` now read `csvHeaders.*` — keys that already existed.
- Keys added (both languages): `config.title`, `config.description`, `config.loadFailed`.

**Correctness / perf.**

- `table.tsx` `handleView` and the targeting form's post-publish redirect pushed
  locale-less paths (`/announcements/…`), unlike every sibling call.
- `toggleAnnouncementPublish` dispatched a notification titled
  `existing.scope === "school" ? "New Announcement" : "New Announcement"` —
  identical branches, ignoring the real title. It now sends the announcement's
  actual title (real content, which the notification layer localizes per reader)
  and refuses to publish a titleless draft rather than blasting a placeholder.
- `updateTemplate` checked ownership with `findFirst` then wrote with
  `update({ where: { id } })` — no `schoolId` on the write. Now one atomic
  `updateMany({ where: { id, schoolId, isSystem: false } })`.
- `getTemplates()` had no `select` and pulled `body` (`@db.Text`) for a list that
  never renders it.
- `[id]/page.tsx` and `templates/page.tsx` awaited the dictionary and the data
  sequentially though they are independent → `Promise.all`.

**Verification.** `tsc` clean for this block; 32 tests pass (13 new). Dictionary
parity + loader-sync green. The repo-wide `hardcoded-ratchet` `bilingualField`
and `STATIC-GAP` ratchets are red from OTHER uncommitted work (`site-header`,
`school-marketing`, `/documents`, `/exams/new`) — announcements contributes **0**
offenders in every category (`npx tsx scripts/i18n-hardcoded-ratchet.ts --by-dir`).
Not committed; not deployed.

---

**Last Review:** 2026-07-17
