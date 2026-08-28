# Receipt -- Readiness & Open Work

> 85% ready · Expense receipt upload, AI extraction, line items

## MVP Checklist

- [x] Upload (image / PDF)
- [x] AI extraction pipeline (merchant, date, amount, line items)
- [x] Status state machine (pending → processing → processed / error)
- [x] Retry extraction on failure
- [x] Error codes (`RECEIPT_NOT_FOUND`, `DELETE_FAILED`, etc.)
- [x] Date formatting passes locale
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] OCR fallback for low-quality images
- [ ] Receipt-to-expense linking

## Resolved (2026-08-14) — revalidatePath targets that never matched

All 5 calls used `/s/[subdomain]/(school-dashboard)/finance/receipt`, which
could never match a cache tag for two independent reasons: it carried the
`(school-dashboard)` **route group** (groups are not part of a page's path) and
it omitted `[lang]` entirely. The detail call also interpolated a real id into
that path, a third failure mode. Now
`revalidatePath("/[lang]/s/[subdomain]/finance/receipt", "page")` and
`.../finance/receipt/[id]` — `type` is required once a path holds a dynamic
segment. Three tests asserted the old string and were updated; they had been
encoding the bug.

Context and the repo-wide count live in `.claude/findings/revalidate-path-repo-wide.md`.
**Not a live bug today**: `pnpm build` reports 691 of 692 routes as `ƒ` (dynamic),
so nothing was cached to go stale. It becomes load-bearing the day any of these
routes adopt `'use cache'` / Cache Components — so the paths are correct now.

## Known Issues

### P1

- [ ] Extraction accuracy varies wildly by vendor -- no per-vendor training
- [ ] No "edit extracted data" UI -- user must delete + retry on misread
- [ ] Attachment to expense record is manual

### P2

- [ ] Batch upload (drag folder of receipts)
- [ ] Duplicate receipt detection (same merchant, same amount, same date)
- [ ] Email-forward inbox for receipt submission

### P3

- [ ] Mobile photo capture integration
- [ ] Receipt search by merchant / amount / date range
- [ ] Export to tax-prep software

## Test Gaps

- [ ] Upload + extraction state transitions
- [ ] Delete receipt cleans up storage + DB
- [ ] Retry after extraction error succeeds on good image
