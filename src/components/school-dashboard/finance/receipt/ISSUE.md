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
