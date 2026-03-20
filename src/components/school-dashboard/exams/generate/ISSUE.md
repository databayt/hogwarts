# Generate -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 65%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Exam template CRUD
- [x] Question distribution configuration
- [x] Distribution editor UI with real-time totals
- [x] Question selection algorithms
- [x] Bloom's taxonomy balancing
- [x] Difficulty distribution enforcement
- [x] Template reuse across classes
- [x] Version library for template history
- [x] Preview before finalization
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [ ] Route pages created in app directory (BLOCKER)

---

## Known Issues

### P0 -- Critical

1. **No route pages** -- `src/app/.../exams/generate/` directory does not exist

### P1 -- High

1. **Hard failure on insufficient questions** -- If question bank lacks enough questions for a distribution requirement, generation fails entirely instead of degrading gracefully

### P2 -- Medium

1. **No question replacement** -- Cannot swap individual questions after generation
2. **Single template per exam** -- Cannot combine multiple templates
3. **No partial distribution filling** -- All-or-nothing on question counts

---

## Enhancements (Post-MVP)

- Graceful degradation when question pool is insufficient
- Post-generation question swapping
- Composite templates (combine multiple)
- Seeded randomization for reproducible exam variants
- Template sharing between teachers

---

**Last Review:** 2026-03-19
