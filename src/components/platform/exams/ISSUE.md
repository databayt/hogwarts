# Exam Block System - Troubleshooting Guide

**Comprehensive issue tracking and troubleshooting for the 5-block exam architecture**

**Last Updated:** 2025-10-27
**Version:** 2.0
**Status:** Production-Ready with 5 Feature Blocks

---

## Table of Contents

1. [Common Issues](#common-issues)
2. [Block-Specific Issues](#block-specific-issues)
   - [Manage Block](#manage-block-issues)
   - [Question Bank Block](#question-bank-issues)
   - [Auto-Generate Block](#auto-generate-issues)
   - [Auto-Mark Block](#auto-mark-issues)
   - [Results Block](#results-issues)
3. [Performance Issues](#performance-issues)
4. [Security Concerns](#security-concerns)
5. [Database Issues](#database-issues)
6. [Integration Issues](#integration-issues)
7. [Known Limitations](#known-limitations)
8. [FAQ](#faq)

---

## Common Issues

### Multi-Tenant Scope Errors

**Issue:** Query returns data from other schools or no data at all

**Symptoms:**

```typescript
// Error: PrismaClientKnownRequestError: Record to update not found
// Or: Unexpected empty results
```

**Root Cause:** Missing `schoolId` in query scope

**Solution:**

```typescript
// ✅ CORRECT - Always include schoolId
import { getTenantContext } from "@/lib/tenant-context"

// ❌ WRONG - Missing schoolId
const exam = await db.exam.findUnique({
  where: { id: examId },
})

const { schoolId } = await getTenantContext()
const exam = await db.exam.findUnique({
  where: {
    id: examId,
    schoolId, // Required for multi-tenant safety
  },
})
```

**Prevention:**

- Use `getTenantContext()` in all server actions
- Include `schoolId` in all queries
- Test with multiple tenant accounts
- Review Prisma queries in code review

---

### Validation Errors Not Showing

**Issue:** Form submission fails silently or with generic error

**Symptoms:**

- Form doesn't submit
- No validation feedback
- Console shows Zod validation errors

**Root Cause:** Zod schema mismatch between client and server

**Solution:**

```typescript
// form.tsx (client)
// actions.ts (server)
import { examSchema, examSchema } from "./validation"

// Ensure schema is imported from same file on both sides
// validation.ts
export const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // ...
})

const form = useForm({
  resolver: zodResolver(examSchema),
})

const validated = examSchema.parse(data)
```

**Prevention:**

- Co-locate validation schemas in `validation.ts`
- Import from single source of truth
- Test validation on both client and server
- Use `safeParse()` for graceful error handling

---

### PDF Generation Failures

**Issue:** PDF generation fails or produces blank pages

**Symptoms:**

- `@react-pdf/renderer` throws errors
- PDF downloads but is blank
- Memory errors during generation

**Common Causes:**

1. **Invalid JSX in PDF template**

```typescript
// ❌ WRONG - Using div in PDF
<View>
  <div>Text</div>  // HTML elements not allowed
</View>

// ✅ CORRECT - Use PDF components
<View>
  <Text>Text</Text>
</View>
```

2. **Missing required data**

```typescript
// ❌ WRONG - Undefined data
<Text>{exam.title}</Text>  // exam might be undefined

// ✅ CORRECT - Safe access
<Text>{exam?.title || 'N/A'}</Text>
```

3. **Large dataset causing memory issues**

```typescript
// ✅ SOLUTION - Paginate or limit data
const results = await db.examResult.findMany({
  where: { examId, schoolId },
  take: 100, // Limit results
  include: { student: true },
})
```

**File References:**

- `src/components/platform/exams/results/lib/pdf-generator.ts:1-280`
- `src/components/platform/exams/results/lib/templates/*.tsx`

---

### i18n Translation Keys Missing

**Issue:** UI shows translation key instead of text

**Symptoms:**

```
dictionary?.results?.title  // Shows as "dictionary.results.title"
```

**Solution:**

1. Check dictionary files have all keys:
   - `src/components/internationalization/school-en.json`
   - `src/components/internationalization/school-ar.json`

2. Add missing keys:

```json
// school-en.json
{
  "results": {
    "title": "Exam Results",
    "statistics": {
      "totalStudents": "Total Students",
      "averageScore": "Average Score"
    }
  }
}
```

3. Verify dictionary is passed to component:

```typescript
// page.tsx
const dictionary = await getDictionary(lang);
<ResultsContent dictionary={dictionary} lang={lang} />
```

**Prevention:**

- Maintain parity between en/ar dictionaries
- Use TypeScript for dictionary types
- Test both languages
- Document new keys in README

---

## Block-Specific Issues

### Manage Block Issues

**Location:** `src/components/platform/exams/manage/`

#### Issue: Exam Time Conflict Not Detected

**Symptoms:** Multiple exams scheduled for same class at same time

**Solution:**

```typescript
// Add conflict detection in actions.ts
export async function createExam(data: ExamFormData) {
  "use server"
  const { schoolId } = await getTenantContext()

  // Check for conflicts
  const conflict = await db.exam.findFirst({
    where: {
      schoolId,
      classId: data.classId,
      examDate: data.examDate,
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime },
        },
        {
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime },
        },
      ],
    },
  })

  if (conflict) {
    throw new Error(`Conflict with exam: ${conflict.title}`)
  }

  // Create exam...
}
```

**File Reference:** `manage/actions.ts`

---

#### Issue: Duration Calculation Incorrect

**Symptoms:** Exam duration shows negative or wrong values

**Root Cause:** Time string parsing issues or timezone problems

**Solution:**

```typescript
// utils.ts - Robust duration calculation
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  let duration = endMinutes - startMinutes

  // Handle overnight exams (rare but possible)
  if (duration < 0) {
    duration += 24 * 60
  }

  return duration
}
```

---

### Question Bank Issues

**Location:** `src/components/platform/exams/qbank/`

#### Issue: Question Options Not Saving

**Symptoms:** Multiple choice questions save without options

**Root Cause:** Nested Prisma create without proper relation handling

**Solution:**

```typescript
// actions.ts
export async function createQuestion(data: QuestionFormData) {
  "use server"
  const { schoolId } = await getTenantContext()

  const question = await db.questionBank.create({
    data: {
      schoolId,
      subjectId: data.subjectId,
      questionText: data.questionText,
      questionType: data.questionType,
      difficulty: data.difficulty,
      points: data.points,
      // Properly create related options
      options: {
        create:
          data.options?.map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: index,
          })) || [],
      },
    },
    include: { options: true },
  })

  return question
}
```

---

#### Issue: Question Search Returns Irrelevant Results

**Symptoms:** Search for "calculus" returns biology questions

**Solution:** Use full-text search with proper field weighting

```typescript
// actions.ts
export async function searchQuestions(query: string, subjectId?: string) {
  "use server"
  const { schoolId } = await getTenantContext()

  return await db.questionBank.findMany({
    where: {
      schoolId,
      ...(subjectId && { subjectId }),
      OR: [
        { questionText: { contains: query, mode: "insensitive" } },
        { topic: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
    },
    include: {
      subject: true,
      options: true,
    },
    take: 50,
  })
}
```

---

### Auto-Generate Issues

**Location:** `src/components/platform/exams/generate/`

#### Issue: Generated Exam Has Unbalanced Difficulty

**Symptoms:** All easy questions or all hard questions

**Root Cause:** Selection algorithm doesn't enforce distribution

**Solution:**

```typescript
// utils.ts
export async function selectQuestions(
  template: ExamTemplate,
  subjectId: string,
  schoolId: string
) {
  const distribution = template.questionDistribution
  const questions: QuestionBank[] = []

  // Select by difficulty
  for (const [difficulty, count] of Object.entries(distribution.byDifficulty)) {
    const selected = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId,
        difficulty: difficulty as Difficulty,
      },
      take: count,
      orderBy: { createdAt: "desc" },
    })

    if (selected.length < count) {
      throw new Error(
        `Not enough ${difficulty} questions. Need ${count}, found ${selected.length}`
      )
    }

    questions.push(...selected)
  }

  // Shuffle questions
  return questions.sort(() => Math.random() - 0.5)
}
```

---

#### Issue: AI Question Generation Timeout

**Symptoms:** Generation takes >60s and times out

**Solution:** Use streaming or batch generation

```typescript
// actions.ts
export async function generateQuestionsWithAI(prompt: string, count: number) {
  "use server"

  // Generate in batches of 5
  const batchSize = 5
  const batches = Math.ceil(count / batchSize)
  const questions: Question[] = []

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(batchSize, count - i * batchSize)
    const batchQuestions = await aiGenerateQuestions(prompt, batchCount)
    questions.push(...batchQuestions)

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return questions
}
```

---

### Auto-Mark Issues

**Location:** `src/components/platform/exams/mark/`

#### Issue: MCQ Auto-Grading Incorrect

**Symptoms:** Correct answers marked wrong

**Root Cause:** Case sensitivity or whitespace in answer comparison

**Solution:**

```typescript
// utils.ts
export function gradeMCQAnswer(
  studentAnswer: string,
  correctAnswer: string
): boolean {
  const normalize = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, " ")

  return normalize(studentAnswer) === normalize(correctAnswer)
}
```

---

#### Issue: Essay Grading AI Returns Invalid Scores

**Symptoms:** AI gives scores >max points or negative scores

**Solution:** Validate AI responses

```typescript
// actions.ts
export async function gradeEssay(
  answer: string,
  rubric: Rubric,
  maxPoints: number
) {
  "use server"

  const aiScore = await aiGradeEssay(answer, rubric)

  // Validate AI response
  const score = Math.max(0, Math.min(maxPoints, aiScore))

  if (score !== aiScore) {
    console.warn(`AI score ${aiScore} clamped to ${score} (max: ${maxPoints})`)
  }

  return score
}
```

---

### Results Issues

**Location:** `src/components/platform/exams/results/`

#### Issue: Grade Calculation Mismatch

**Symptoms:** Letter grade doesn't match percentage

**Root Cause:** Grade boundaries not configured or wrong logic

**Solution:**

```typescript
// lib/calculator.ts
export async function calculateGrade(
  percentage: number,
  schoolId: string,
  subjectId?: string
): Promise<{ grade: string; gpa: number }> {
  // Get grade boundaries (subject-specific or school-wide)
  const boundaries = await db.gradeBoundary.findMany({
    where: {
      schoolId,
      ...(subjectId && { subjectId }),
      minScore: { lte: percentage },
      maxScore: { gte: percentage },
    },
    orderBy: { gpaValue: "desc" },
    take: 1,
  })

  if (!boundaries.length) {
    // Fallback to default grading
    return getDefaultGrade(percentage)
  }

  const boundary = boundaries[0]
  return {
    grade: boundary.grade,
    gpa: boundary.gpaValue,
  }
}
```

**File Reference:** `results/lib/calculator.ts:1-340`

---

#### Issue: Class Rank Calculation Incorrect with Ties

**Symptoms:** Two students with same score get different ranks

**Solution:** Use proper ranking with tie handling

```typescript
// lib/calculator.ts
export function calculateRanks(
  results: ExamResult[]
): Array<ExamResult & { rank: number }> {
  // Sort by percentage descending
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage)

  let currentRank = 1
  let previousPercentage: number | null = null
  let studentsAtSameRank = 0

  return sorted.map((result, index) => {
    if (previousPercentage === result.percentage) {
      // Same score, same rank
      studentsAtSameRank++
    } else {
      // New score, new rank (skip tied positions)
      currentRank = index + 1
      studentsAtSameRank = 0
    }

    previousPercentage = result.percentage

    return {
      ...result,
      rank: currentRank,
    }
  })
}
```

---

#### Issue: PDF Export Shows Incorrect RTL Layout

**Symptoms:** Arabic text appears left-to-right in PDF

**Solution:** Use RTL-aware PDF styles

```typescript
// lib/templates/modern.tsx
const rtlStyles = StyleSheet.create({
  page: {
    flexDirection: lang === "ar" ? "row-reverse" : "row",
    fontFamily: lang === "ar" ? "Rubik" : "Inter",
    textAlign: lang === "ar" ? "right" : "left",
  },
  text: {
    direction: lang === "ar" ? "rtl" : "ltr",
  },
})

// Register Arabic font
Font.register({
  family: "Rubik",
  src: "/fonts/Rubik-Regular.ttf",
})
```

---

## Performance Issues

### Slow Exam List Loading

**Issue:** Exam list takes >3s to load

**Diagnosis:**

```bash
# Check slow queries in Prisma
pnpm prisma studio
# Check indexes
pnpm prisma db execute --file=check_indexes.sql
```

**Solutions:**

1. **Add database indexes**

```prisma
// prisma/models/exam.prisma
model Exam {
  // ...
  @@index([schoolId, examDate])
  @@index([schoolId, classId])
  @@index([schoolId, status])
  @@index([examDate, startTime])  // Add this for calendar queries
}
```

2. **Optimize query with selective includes**

```typescript
// Instead of including everything
const exams = await db.exam.findMany({
  where: { schoolId },
  include: {
    class: true,
    subject: true,
    examResults: true, // ❌ Expensive
    generatedExams: true,
  },
})

// ✅ Select only needed fields
const exams = await db.exam.findMany({
  where: { schoolId },
  select: {
    id: true,
    title: true,
    examDate: true,
    class: { select: { name: true } },
    subject: { select: { subjectName: true } },
    _count: { select: { examResults: true } }, // Count instead of full data
  },
})
```

3. **Use pagination**

```typescript
// Add to actions.ts
export async function getExams(params: { page: number; pageSize: number }) {
  const { page, pageSize } = params
  const skip = (page - 1) * pageSize

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where: { schoolId },
      skip,
      take: pageSize,
      orderBy: { examDate: "desc" },
    }),
    db.exam.count({ where: { schoolId } }),
  ])

  return { exams, total, pages: Math.ceil(total / pageSize) }
}
```

---

### PDF Generation Timeout

**Issue:** Generating 100+ student results times out

**Solution:** Use background jobs

```typescript
// Option 1: Generate on-demand, one at a time
export async function generateSinglePDF(examId: string, studentId: string) {
  const result = await getExamResult(examId, studentId)
  return await generatePDF(result)
}

// Option 2: Pre-generate and store (requires storage)
export async function preGenerateAllPDFs(examId: string) {
  const results = await getExamResults(examId)

  const jobs = results.map(async (result) => {
    const pdf = await generatePDF(result)
    await uploadToStorage(pdf, `results/${examId}/${result.studentId}.pdf`)
  })

  // Process in batches of 10
  for (let i = 0; i < jobs.length; i += 10) {
    await Promise.all(jobs.slice(i, i + 10))
  }
}
```

---

## Security Concerns

### Prevent Grade Tampering

**Issue:** Unauthorized users could modify grades

**Solution:** Add audit logging and permission checks

```typescript
// actions.ts
export async function updateGrade(
  examId: string,
  studentId: string,
  newGrade: number
) {
  "use server"

  const session = await auth()
  const { schoolId } = await getTenantContext()

  // Permission check
  if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("Unauthorized")
  }

  // Get old grade for audit
  const oldResult = await db.examResult.findUnique({
    where: {
      examId_studentId: { examId, studentId },
      schoolId,
    },
  })

  // Update grade
  const updated = await db.examResult.update({
    where: {
      examId_studentId: { examId, studentId },
      schoolId,
    },
    data: { marksObtained: newGrade },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      schoolId,
      userId: session.user.id,
      action: "UPDATE_GRADE",
      entityType: "ExamResult",
      entityId: updated.id,
      oldValue: JSON.stringify({ marksObtained: oldResult?.marksObtained }),
      newValue: JSON.stringify({ marksObtained: newGrade }),
      timestamp: new Date(),
    },
  })

  return updated
}
```

---

### Prevent Cross-Tenant Data Leakage

**Issue:** Student from School A sees School B's exams

**Prevention Checklist:**

- [ ] All queries include `schoolId` from `getTenantContext()`
- [ ] Use `updateMany`/`deleteMany` with `schoolId` filter
- [ ] Test with multiple tenant accounts
- [ ] Add integration tests for tenant isolation
- [ ] Never trust `schoolId` from client (always from session)

---

## Database Issues

### Migration Failures

**Issue:** `pnpm prisma migrate dev` fails

**Common Causes:**

1. **Existing data conflicts with new constraint**

```bash
# Error: Unique constraint violation
```

**Solution:** Add data migration

```sql
-- migrations/xxx_fix_duplicates.sql
DELETE FROM exam_results
WHERE id NOT IN (
  SELECT MIN(id)
  FROM exam_results
  GROUP BY exam_id, student_id, school_id
);
```

2. **Required field added without default**

```prisma
model Exam {
  newRequiredField String  // ❌ Will fail if existing data
}
```

**Solution:** Make optional or provide default

```prisma
model Exam {
  newRequiredField String @default("")  // ✅ Provide default
  // OR
  newRequiredField String?  // ✅ Make optional
}
```

---

### Prisma Client Out of Sync

**Issue:** TypeScript errors about missing Prisma models

**Solution:**

```bash
# Regenerate Prisma client
pnpm prisma generate

# If that doesn't work, clear cache
rm -rf node_modules/.prisma
pnpm prisma generate
```

---

## Integration Issues

### Exam Results Not Appearing in Gradebook

**Issue:** Marks entered but don't show in student gradebook

**Root Cause:** Missing integration layer

**Solution:** Create sync function

```typescript
// lib/gradebook-sync.ts
export async function syncExamToGradebook(examId: string) {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { examResults: true },
  })

  if (!exam) return

  // Create gradebook entries
  for (const result of exam.examResults) {
    await db.grade.upsert({
      where: {
        studentId_subjectId_assessmentName: {
          studentId: result.studentId,
          subjectId: exam.subjectId,
          assessmentName: exam.title,
        },
      },
      create: {
        schoolId: exam.schoolId,
        studentId: result.studentId,
        subjectId: exam.subjectId,
        assessmentName: exam.title,
        score: result.marksObtained,
        maxScore: exam.totalMarks,
        weight: exam.examType === "FINAL" ? 0.5 : 0.25,
      },
      update: {
        score: result.marksObtained,
      },
    })
  }
}
```

---

## Known Limitations

### Current Limitations (v2.0)

1. **Question Import Format**
   - Only manual entry supported
   - CSV import not yet implemented
   - Workaround: Use bulk create API

2. **AI Question Generation**
   - Requires external AI service
   - Rate limits may apply
   - Workaround: Generate in smaller batches

3. **PDF Template Customization**
   - Only 3 built-in templates
   - Custom templates require code changes
   - Workaround: Modify existing templates

4. **Real-time Collaboration**
   - No live updates when multiple teachers grade
   - Workaround: Reload page to see updates

5. **Offline Support**
   - Requires internet connection
   - No offline mode for grade entry
   - Workaround: Use mobile data or wait for connection

6. **File Size Limits**
   - PDF exports limited to 500 students
   - Workaround: Export by class sections

---

## FAQ

### General Questions

**Q: Can I reuse questions across multiple exams?**
A: Yes, questions in the Question Bank can be used in multiple generated exams.

**Q: What happens if I delete an exam?**
A: By default, exam results are preserved. Set `onDelete: Cascade` in schema to delete results too.

**Q: Can students see their answers after the exam?**
A: Not by default. Enable in exam settings: `showAnswersAfterCompletion: true`

**Q: How do I change the grading scale?**
A: Configure GradeBoundary records in database for your school.

### Technical Questions

**Q: Where are PDF templates defined?**
A: `src/components/platform/exams/results/lib/templates/` - see `classic.tsx`, `modern.tsx`, `minimal.tsx`

**Q: How do I add a new question type?**
A:

1. Add to `QuestionType` enum in `prisma/models/exam.prisma`
2. Update validation in `qbank/validation.ts`
3. Add UI rendering in `qbank/form.tsx`
4. Update grading logic in `mark/utils.ts`

**Q: Can I customize the grade calculation formula?**
A: Yes, modify `calculateGrade()` in `results/lib/calculator.ts:1-340`

**Q: How do I debug a failed PDF generation?**
A:

```typescript
// Add logging in pdf-generator.ts
console.log('Generating PDF for exam:', examId);
console.log('Data:', JSON.stringify(data, null, 2));

// Check PDF component errors
try {
  const doc = <PDFDocument data={data} />;
  await pdf(doc).toBlob();
} catch (error) {
  console.error('PDF error:', error);
}
```

---

## Getting Help

If you encounter issues not covered here:

1. **Check Logs:**
   - Browser console for client errors
   - Server logs: `vercel logs` or check Vercel dashboard
   - Database logs: Prisma query logging

2. **Debug Mode:**

```bash
# Enable Prisma query logging
DEBUG=prisma:query pnpm dev
```

3. **Test in Isolation:**

```bash
# Test specific feature
pnpm test src/components/platform/exams/results/**/*.test.ts
```

4. **Review Related Documentation:**
   - [Main README](./README.md)
   - [Manage Block](./manage/README.md)
   - [Question Bank](./qbank/README.md)
   - [Generate Block](./generate/README.md)
   - [Mark Block](./mark/README.md)
   - [Results Block](./results/README.md)

5. **Check Platform Issues:**
   - See [Platform ISSUE.md](../ISSUE.md) for system-wide issues

---

**Last Updated:** 2025-10-27
**Maintainers:** Platform Team
**Version:** 2.0 (5-Block Architecture)
