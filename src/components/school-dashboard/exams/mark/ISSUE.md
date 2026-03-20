# Mark -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 65%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Auto-grading for MCQ, True/False, Fill-in-Blank
- [x] AI-assisted essay grading with rubrics
- [x] AI-assisted short answer grading
- [x] Manual grading interface
- [x] Grade override with audit trail
- [x] Bulk grading capabilities
- [x] CSV import for marks
- [x] Mobile grading view
- [x] Answer key management
- [x] AI rate limiting system (queue-based, exponential backoff)
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [ ] Route pages created in app directory (BLOCKER)
- [ ] OpenAI API key configuration documented and validated at startup

---

## Known Issues

### P0 -- Critical

1. **No route pages** -- `src/app/.../exams/mark/` directory does not exist

### P1 -- High

1. **OpenAI dependency** -- AI grading fails silently without API key; needs graceful fallback
2. **AI grading consistency** -- Same answer can receive different scores on re-grading; mitigated by rubrics and temperature=0

### P2 -- Medium

1. **OCR accuracy** -- Low confidence on poor handwriting requires manual review
2. **Cost tracking** -- No production-level budget controls for AI API usage
3. **No plagiarism detection** -- Essay answers not checked for copying
4. **No peer grading** -- Teacher-only grading model

---

## Enhancements (Post-MVP)

- Question difficulty calibration based on student performance
- Plagiarism detection for essays
- Video/audio answer support
- Peer grading workflows
- Real-time grading notifications
- OCR preprocessing (grayscale, contrast enhancement)

---

**Last Review:** 2026-03-19
