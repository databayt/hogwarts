# Question Bank -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 70%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] 5 question types (MCQ, True/False, Fill-in-Blank, Short Answer, Essay)
- [x] Difficulty levels (Easy, Medium, Hard)
- [x] Bloom's taxonomy classification (6 levels)
- [x] AI-powered question generation
- [x] Tagging and categorization system
- [x] Practice mode and practice sessions
- [x] Catalog tab browsing
- [x] Search with case-insensitive filtering
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [ ] Route pages created in app directory (BLOCKER)
- [ ] Bulk CSV import tested end-to-end

---

## Known Issues

### P0 -- Critical

1. **No route pages** -- `src/app/.../exams/qbank/` directory does not exist

### P1 -- High

1. **AI generation requires API key** -- No graceful fallback if OPENAI_API_KEY not configured
2. **No question versioning** -- Edits overwrite original, no change history

### P2 -- Medium

1. **No image support in questions** -- Only external URL field, no upload
2. **Tag autocomplete performance** -- Loading all tags at once for large datasets
3. **No question dependencies/sequences** -- Cannot link related questions
4. **No collaborative review** -- Single-editor model only

---

## Enhancements (Post-MVP)

- Image upload support for questions
- Question versioning with history
- Question collections/pools
- Collaborative review workflow
- Import from QTI format
- Advanced analytics dashboard for question effectiveness

---

**Last Review:** 2026-03-19
