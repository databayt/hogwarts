# Grades — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Report card generation (per term, per class, per student)
- [x] Report card listing and publishing
- [x] Transcript generation with QR verification
- [x] Certificate PDF generation (single + batch)
- [x] Composable certificate template system
- [x] Regional presets (US, Saudi, Sudan, MENA)
- [x] Promotion candidate evaluation
- [x] Promotion batch approval and execution
- [x] Promotion policy configuration (upsert)
- [x] Grade notification dispatch
- [x] Default grade boundaries (A+ through F)
- [ ] Custom grade boundary configuration per school
- [ ] Transcript verification endpoint (public-facing)

## Known Issues

### P0 — Critical

- None

### P1 — High

- Grade boundaries are hardcoded defaults -- no UI for school-specific configuration
- Transcript verification relies on QR code but public verification page not confirmed

### P2 — Medium

- Batch PDF generation may timeout for large classes (no progress indicator)
- Template preview in admin UI not yet available
- Promotion override audit trail needs review

## Enhancements (Post-MVP)

- GPA calculation engine with weighted/unweighted modes
- Grade analytics (class averages, distribution histograms)
- Parent/student portal for viewing report cards online
- Automated promotion recommendations based on policy rules
- Historical transcript comparison
- Certificate template designer (WYSIWYG)

---

**Last Review:** 2026-03-19
