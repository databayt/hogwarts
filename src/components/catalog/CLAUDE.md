# Catalog Block (shared core)

## Context

Platform-wide curriculum catalog: Subject → Chapter → Lesson plus content types (Exam,
Question, Material, Assignment, Book, Video, Quiz, Document). Catalog tables have **no
`schoolId`** — schools connect through schoolId-scoped bridge tables (`SubjectSelection`,
`ContentOverride`, `InstructorPreference`, `BookSelection`) and school mirrors carrying
`catalogXxxId` back-pointers. This directory is the shared core (provisioning engine,
academic config, image pipeline); route-bound surfaces live in saas-dashboard/catalog,
school-dashboard/listings/subjects/catalog, stream/data/catalog, library/catalog.

## Before You Start

1. Read `README.md` here for modules, surfaces, and test inventory
2. Read `ISSUE.md` here for the P0/P1/P2 backlog and MVP checklist
3. Read [/docs/catalog](/docs/catalog) — the single consolidated doc (architecture,
   provisioning, proposals, visibility, curricula, assets, operations)
4. Catalog reads are intentionally NOT schoolId-scoped (global tables) — but every
   bridge-table query MUST include `schoolId`

## Key Decisions

- **Global catalog + bridges**: the standalone school `Subject` model was removed; `Class`
  and everything else FK directly to the catalog Subject. A school "has" a subject when a
  `SubjectSelection (schoolId, catalogSubjectId, gradeId, streamId?)` row exists.
- **Opt-in proposal approval** (no auto-bridge): `approveProposal` publishes to the global
  catalog only, then notifies the proposer + school ADMINs (in-app + email). The school
  adds the subject from its catalog picker, where approved-but-unadded requests are PINNED
  on top with an Add CTA + one-time reminder dialog (`catalog-ready-dismissed:${schoolId}`
  in localStorage). Pinned state is derived (`Proposal.status=PUBLISHED` +
  `catalogEntityId ∉ SubjectSelection`), so it clears itself once added.
- **Notification types are reused, not extended**: proposal notifications use
  `document_shared` / `system_alert` with `metadata.kind = "proposal_approved" |
"proposal_rejected"` as the discriminator — adding real enum values would require a
  Postgres `ALTER TYPE` + a 5-file fan-out (see notifications block CLAUDE.md).
- **Per-curriculum provisioning** via `academic-config.ts`: SD keeps the original Arabic
  6+3+3 + Science/Arts streams byte-for-byte; US/GB/CBSE/transnational get their own
  structures; unknown codes fall back to a generic English 6+3+3.
- **PUBLISHED is the visibility floor**: every school-facing catalog read filters
  `status: "PUBLISHED"` (+ `approvalStatus`/`visibility` where the model has them).
- **Approval publishes**: `approveContent` sets `status: "PUBLISHED"` for
  Question/Material/Assignment/Book (contributions are created DRAFT and would otherwise
  stay invisible to browse paths).
- **Paid content**: only Question/Video/Exam carry price/currency. Video purchases are
  live (Stripe `VideoPurchase`, signed CloudFront, null-URL for unpurchased PAID). Exam /
  question purchase flow is deliberately deferred.

## Danger Zones

- **`setup.ts` propagates to ALL schools** — it runs at onboarding, operator provisioning,
  and lazily via `ensureSubjectSelections` on read paths. A bug here corrupts every new
  school's academic structure.
- **SD config must stay byte-identical** (`academic-config.ts` ARABIC_6_3_3) — existing
  Sudanese schools' structures were provisioned from these exact strings;
  `catalog-setup.curriculum-config.test.ts` locks them.
- **Do not drop the `status: "PUBLISHED"` filter** on any school-facing read — DRAFT and
  ARCHIVED catalog rows leak instantly (the global-search leak was exactly this).
- **Grade slugs are always `grade-${n}`** for every curriculum — the YearLevel mapping in
  `setup.ts` regex-matches that shape. Only display names vary per config.
- **`ContentOverride` semantics**: `isHidden: true` row = hidden; no row = visible. The
  subject detail page filters for non-admin roles only — admins see everything plus the
  customize panel.
- **Seeds**: NEVER run the full seed (`pnpm db:seed:single <name>` only). `content.ts` is
  idempotent by deterministic (scope ids + title/questionText) identity — keep new seed
  output deterministic or re-runs will duplicate.
- **`approveProposal` notification must never fail the approval** — dispatch happens after
  the transaction inside try/catch. Keep it that way.

## Related Blocks

- [SaaS Dashboard](../saas-dashboard/CLAUDE.md) — operator authoring/moderation surface;
  catalog changes there propagate to all schools
- [School Dashboard](../school-dashboard/CLAUDE.md) — adoption, customization, and the
  subjects listing surfaces
- [Stream](../stream/CLAUDE.md) — LMS read adapter + video gating engine
- [Library](../library/CLAUDE.md) — catalog Book adoption (`BookSelection`)
- [Notifications](../school-dashboard/notifications/CLAUDE.md) — `dispatchNotification`
  helpers + the enum fan-out rules
- [Onboarding](../onboarding/CLAUDE.md) — triggers `setupCatalogForSchool` at publish

## After You Finish

1. Update `ISSUE.md` — check off completed items, add new issues found
2. Update `README.md` — if modules, surfaces, or tests changed
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. Run `pnpm vitest run src/tests/lib/catalog-setup.test.ts src/tests/lib/catalog-setup.level-config.test.ts src/tests/lib/catalog-setup.curriculum-config.test.ts src/tests/saas-dashboard/catalog/ src/tests/school-dashboard/listings/subjects/catalog/`
5. Test: `dev@databayt.org` (pw: 1234) at `localhost:3000/en/catalog` (operator) and
   `admin@databayt.org` on `demo.localhost:3000/en/subjects/catalog` (school picker)
