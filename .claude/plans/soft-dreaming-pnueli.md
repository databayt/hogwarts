# K-12 Subject Seeding & Bilingual Seed Refactoring

## User Decisions

- **Course Type**: StreamCourses (LMS online courses with chapters/lessons)
- **DB Structure**: Two separate records per course (one EN, one AR with same slug)
- **Grade Levels**: All levels (KG-12) - complete curriculum coverage

---

## Implementation Plan

### Phase 1: Create Bilingual Data Types

**File**: `prisma/seeds/stream.ts`

Add interfaces for bilingual course data:

```typescript
interface BilingualCourseData {
  slug: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  price: number
  categoryKey: string // Maps to bilingual category
  level: StreamCourseLevel
  imageUrl: string
  chapters: BilingualChapterData[]
}

interface BilingualChapterData {
  titleAr: string
  titleEn: string
  lessons: BilingualLessonData[]
}
```

### Phase 2: Category Mapping

Create bilingual category mappings:

```typescript
const BILINGUAL_CATEGORIES = {
  Languages: { ar: "اللغات", en: "Languages" },
  Sciences: { ar: "العلوم", en: "Sciences" },
  Humanities: { ar: "العلوم الإنسانية", en: "Humanities" },
  Religion: { ar: "الدين", en: "Religion" },
  ICT: { ar: "تقنية المعلومات", en: "ICT" },
  "Arts & PE": { ar: "الفنون والرياضة", en: "Arts & PE" },
}
```

### Phase 3: Refactor Course Creation

Convert from combined titles to bilingual pairs:

**Before**:

```typescript
{ title: "القرآن الكريم | Quran Recitation", lang: "en" }
```

**After**:

```typescript
// Creates TWO records with same slug, different lang
createBilingualCourse({
  slug: "quran-tajweed",
  titleAr: "القرآن الكريم - التجويد",
  titleEn: "Quran Recitation with Tajweed",
  // ...
})
```

### Phase 4: Add K-12 Subject Courses

Generate courses for all 20 subjects across 14 grade levels:

| Department | Subjects                                          | Grade Levels |
| ---------- | ------------------------------------------------- | ------------ |
| Languages  | Arabic, English, French, Reading, Writing         | KG-12        |
| Sciences   | Mathematics, Science, Physics, Chemistry, Biology | KG-12        |
| Humanities | Social Studies, Geography, History, Civics        | Primary-12   |
| Religion   | Islamic Studies, Quran                            | KG-12        |
| ICT        | Computer Science                                  | 4-12         |
| Arts & PE  | Art, Physical Education, Music                    | KG-12        |

**Course structure per subject/grade**:

- 4-8 chapters (based on subject complexity)
- 3-5 lessons per chapter
- Video URL placeholders
- Level: BEGINNER (KG-3), INTERMEDIATE (4-8), ADVANCED (9-12)

### Phase 5: Update Seed Orchestration

Refactor `seedStream` function:

```typescript
export async function seedStream(...) {
  // 1. Create bilingual categories
  const categories = await seedBilingualCategories(prisma, schoolId)

  // 2. Seed existing courses (refactored to bilingual)
  await seedExistingCourses(prisma, schoolId, teachers, categories)

  // 3. Seed K-12 subject courses
  await seedK12SubjectCourses(prisma, schoolId, teachers, categories)

  // 4. Create enrollments
  if (students?.length) {
    await seedEnrollments(prisma, schoolId, students)
  }
}
```

---

## Files to Modify

| File                        | Changes                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `prisma/seeds/stream.ts`    | Major refactor: bilingual types, dual-record creation, K-12 generation |
| `prisma/seeds/constants.ts` | Add chapter templates for K-12 subjects (optional)                     |

**No changes needed** (already filters by lang):

- `src/components/stream/data/course/get-all-courses.ts`
- Course listing pages

---

## Expected Output

| Metric                        | Count                        |
| ----------------------------- | ---------------------------- |
| Existing courses (refactored) | 26 records (13 × 2 langs)    |
| K-12 subject courses          | ~324 records (162 × 2 langs) |
| **Total courses**             | ~350 records                 |
| Chapters                      | ~1,750                       |
| Lessons                       | ~7,000                       |

---

## Implementation Order

1. Add bilingual data types to `stream.ts`
2. Create `BILINGUAL_CATEGORIES` mapping
3. Add `createBilingualCourse()` helper function
4. Refactor existing 13 courses to bilingual format
5. Add K-12 chapter templates per subject
6. Add `seedK12SubjectCourses()` function
7. Update `seedStream()` orchestration
8. Test with `pnpm db:seed`

---

## Success Criteria

- [ ] Each course exists in both EN and AR versions (same slug, different lang)
- [ ] `/en/stream/courses` shows only English courses
- [ ] `/ar/stream/courses` shows only Arabic courses
- [ ] K-12 subjects seeded with grade-appropriate content
- [ ] Existing enrollments/progress preserved (additive seed)
- [ ] Categories also bilingual (same pattern)
