# Question Bank Block - Issues & Troubleshooting

**Common issues, known limitations, and troubleshooting for question repository management**

Part of the [Exam Block System](../README.md) | [Question Bank README](./README.md)

---

## Table of Contents

1. [Question Creation Issues](#question-creation-issues)
2. [AI Generation Issues](#ai-generation-issues)
3. [Search & Filter Issues](#search--filter-issues)
4. [Tagging Issues](#tagging-issues)
5. [Analytics Issues](#analytics-issues)
6. [Import/Export Issues](#importexport-issues)
7. [Performance Issues](#performance-issues)
8. [Known Limitations](#known-limitations)
9. [Future Enhancements](#future-enhancements)

---

## Question Creation Issues

### Issue: MCQ Options Not Saving Correctly

**Symptoms:**

- Create MCQ with 4 options
- Save question
- Options missing or duplicated in database

**Root Cause:** Incorrect relation handling in Prisma create

**Solution:**

```typescript
// actions.ts
export async function createQuestion(data: QuestionBankFormData) {
  "use server"

  const { schoolId } = await getTenantContext()

  // ✅ CORRECT - Use nested create
  const question = await db.questionBank.create({
    data: {
      schoolId,
      subjectId: data.subjectId,
      questionText: data.questionText,
      questionType: data.questionType,
      // ... other fields
      options: {
        create:
          data.options?.map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
            order: index,
          })) || [],
      },
    },
    include: {
      options: true,
    },
  })

  return question
}
```

**File Reference:** `actions.ts:1-500`

---

### Issue: Fill-in-the-Blank Without Blank Marker Accepted

**Symptoms:**

- Create fill-blank question: "What is photosynthesis?"
- No **\_** or [blank] in question text
- Validation should reject but doesn't

**Root Cause:** Validation not checking for blank marker

**Solution:** Add custom Zod refinement

```typescript
// validation.ts
export const fillBlankSchema = questionBankSchema
  .extend({
    questionText: z.string(),
    acceptedAnswers: z.array(z.string()).min(1),
  })
  .refine(
    (data) => {
      return (
        data.questionText.includes("_____") ||
        data.questionText.includes("[blank]") ||
        data.questionText.includes("___")
      )
    },
    {
      message:
        "Fill-in-the-blank questions must include a blank marker (_____ or [blank])",
      path: ["questionText"],
    }
  )
```

---

### Issue: Explanation Field Not Saving

**Symptoms:**

- Enter explanation for MCQ option
- Save question
- Explanation is null in database

**Root Cause:** Optional field not included in create mutation

**Solution:**

```typescript
// Ensure explanation is explicitly passed
options: {
  create: data.options?.map((opt, index) => ({
    text: opt.text,
    isCorrect: opt.isCorrect,
    explanation: opt.explanation || null, // ✅ Explicitly pass
    order: index,
  }))
}
```

---

### Issue: Points Calculation Incorrect

**Symptoms:**

- Set difficulty to HARD
- Question type ESSAY
- Expected 10 points, shows 3

**Root Cause:** Calculation formula incorrect

**Solution:** Use correct multiplier

```typescript
// config.ts
export function calculateDefaultPoints(
  type: QuestionType,
  difficulty: DifficultyLevel
): number {
  const basePoints = DEFAULT_POINTS_BY_TYPE[type]
  const difficultyMultiplier =
    difficulty === DifficultyLevel.EASY
      ? 1
      : difficulty === DifficultyLevel.MEDIUM
        ? 1.5
        : 2 // HARD

  return Math.round(basePoints * difficultyMultiplier)
}

// Example:
// ESSAY (base 5) × HARD (2) = 10 points ✅
```

**File Reference:** `config.ts:340-352`

---

## AI Generation Issues

### Issue: AI Generation Timeout

**Symptoms:**

- Request 20 questions via AI
- Request times out after 60 seconds
- Partial generation or complete failure

**Root Cause:** Generating too many questions at once

**Solution:** Batch generation

```typescript
// actions.ts
export async function generateQuestionsWithAI(params: AIGenerationFormData) {
  "use server"

  const { numberOfQuestions } = params
  const batchSize = 5 // Generate 5 at a time
  const batches = Math.ceil(numberOfQuestions / batchSize)

  const allQuestions: AIGeneratedQuestion[] = []

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(batchSize, numberOfQuestions - i * batchSize)

    const batchQuestions = await aiService.generate({
      ...params,
      numberOfQuestions: batchCount,
    })

    allQuestions.push(...batchQuestions)

    // Small delay to avoid rate limits
    if (i < batches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return {
    success: true,
    data: allQuestions,
  }
}
```

---

### Issue: AI Generated MCQ Has All Wrong Answers

**Symptoms:**

- AI generates MCQ
- All 4 options marked as `isCorrect: false`
- No correct answer exists

**Root Cause:** AI response parsing error or format mismatch

**Solution:** Validate AI response

```typescript
// actions.ts
async function validateAIQuestion(
  question: AIGeneratedQuestion
): Promise<boolean> {
  // For MCQ/TF, ensure at least one correct answer
  if (
    question.questionType === "MULTIPLE_CHOICE" ||
    question.questionType === "TRUE_FALSE"
  ) {
    if (!question.options || question.options.length === 0) {
      throw new Error("MCQ must have options")
    }

    const hasCorrect = question.options.some((opt) => opt.isCorrect)
    if (!hasCorrect) {
      throw new Error("MCQ must have at least one correct answer")
    }
  }

  // For Fill Blank, ensure accepted answers exist
  if (question.questionType === "FILL_BLANK") {
    if (!question.acceptedAnswers || question.acceptedAnswers.length === 0) {
      throw new Error("Fill-blank must have accepted answers")
    }
  }

  return true
}

// Use in generation
const questions = await aiService.generate(params)
const validatedQuestions = questions.filter((q) => {
  try {
    validateAIQuestion(q)
    return true
  } catch (error) {
    console.error(`Invalid AI question: ${error.message}`)
    return false
  }
})
```

---

### Issue: AI Generation Returns Non-JSON Response

**Symptoms:**

- AI returns plain text instead of JSON
- Parsing fails with `SyntaxError: Unexpected token`

**Root Cause:** Prompt not enforcing JSON format strictly

**Solution:** Improve prompt and add parsing fallback

````typescript
// config.ts - Update AI prompts
export const AI_GENERATION_PROMPTS = {
  systemPrompt: `You are an expert educator. You MUST respond with valid JSON only.
No additional text, explanations, or formatting. Only JSON.`,

  mcqFormat: `
IMPORTANT: Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "questionText": "The question here",
  "options": [
    {"text": "Option 1", "isCorrect": false, "explanation": "Why wrong"},
    {"text": "Option 2", "isCorrect": true, "explanation": "Why correct"}
  ],
  "explanation": "Overall explanation"
}
`,
}

// actions.ts - Add robust parsing
function parseAIResponse(response: string): AIGeneratedQuestion {
  // Remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "")
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g, "")
  }

  // Try parsing
  try {
    return JSON.parse(cleaned)
  } catch (error) {
    console.error("Failed to parse AI response:", response)
    throw new Error("AI returned invalid JSON format")
  }
}
````

---

### Issue: AI Generated Questions Too Similar

**Symptoms:**

- Request 10 questions on "Photosynthesis"
- All questions are nearly identical
- Low variety in question types/difficulty

**Root Cause:** Insufficient prompt variation

**Solution:** Add diversity instructions

```typescript
// actions.ts
const diversityPrompt = `
Generate ${numberOfQuestions} DISTINCT questions. Ensure variety by:
1. Using different question angles and perspectives
2. Testing different aspects of the topic
3. Varying question complexity
4. Using different real-world contexts
5. Avoiding repetitive phrasing

Each question should test a unique aspect of ${topic}.
`
```

---

## Search & Filter Issues

### Issue: Search Returns No Results for Valid Query

**Symptoms:**

- Search for "photosynthesis"
- Question bank has 50 questions on topic
- Search returns 0 results

**Root Cause:** Case sensitivity or full-text search not enabled

**Solution:** Use case-insensitive search

```typescript
// actions.ts
export async function searchQuestions(
  query: string,
  filters?: QuestionBankFilters
) {
  "use server"

  const { schoolId } = await getTenantContext()

  return await db.questionBank.findMany({
    where: {
      schoolId,
      AND: [
        {
          OR: [
            { questionText: { contains: query, mode: "insensitive" } }, // ✅ Case-insensitive
            { explanation: { contains: query, mode: "insensitive" } },
            { tags: { has: query.toLowerCase() } },
          ],
        },
        // ... other filters
      ],
    },
  })
}
```

**Alternative:** Use full-text search

```prisma
// prisma/models/exam.prisma
model QuestionBank {
  // ...
  @@fulltext([questionText, explanation])
}
```

```typescript
// Use full-text search
const results = await db.questionBank.findMany({
  where: {
    schoolId,
    OR: [
      { questionText: { search: query } },
      { explanation: { search: query } },
    ],
  },
})
```

---

### Issue: Tag Filter Not Working

**Symptoms:**

- Filter by tag "biology"
- Questions with tag show but also unrelated questions

**Root Cause:** Array contains vs. exact match

**Solution:** Use proper array filtering

```typescript
// ❌ WRONG - Substring match
where: {
  tags: {
    has: "bio"
  } // Matches "biology", "microbiology", "biochemistry"
}

// ✅ CORRECT - Exact match
where: {
  tags: {
    has: "biology"
  } // Only matches exact tag
}

// ✅ CORRECT - Multiple tags (AND)
where: {
  tags: {
    hasEvery: ["biology", "plants"]
  } // Must have both
}

// ✅ CORRECT - Multiple tags (OR)
where: {
  tags: {
    hasSome: ["biology", "chemistry"]
  } // Has either
}
```

---

## Tagging Issues

### Issue: Tags Not Displaying in Correct Order

**Symptoms:**

- Add tags: ["math", "algebra", "grade-10"]
- Display shows: ["grade-10", "math", "algebra"]
- Order not preserved

**Root Cause:** Tags stored as array, Prisma doesn't guarantee order

**Solution:** Sort tags on retrieval

```typescript
// columns.tsx or form.tsx
const sortedTags = question.tags.sort((a, b) => a.localeCompare(b));

// Or: Preserve insertion order with metadata
model QuestionBank {
  tags       String[]
  tagsOrder  Int[]  // Store order separately
}
```

---

### Issue: Duplicate Tags Created

**Symptoms:**

- Tag "photosynthesis" and "Photosynthesis" both exist
- Creates confusion and duplicates

**Root Cause:** Case sensitivity in tag creation

**Solution:** Normalize tags

```typescript
// validation.ts
export const questionBankSchema = z.object({
  tags: z
    .array(z.string())
    .transform(
      (tags) => tags.map((tag) => tag.toLowerCase().trim()) // ✅ Normalize
    )
    .refine(
      (tags) => {
        const unique = new Set(tags)
        return unique.size === tags.length
      },
      {
        message: "Duplicate tags not allowed",
      }
    ),
})
```

---

### Issue: Tag Autocomplete Slow with 1000+ Tags

**Symptoms:**

- Tag input has autocomplete
- Loads all tags from database
- UI freezes with many tags

**Root Cause:** Loading all tags at once

**Solution:** Implement search-based autocomplete

```typescript
// actions.ts
export async function searchTags(query: string, limit = 10) {
  "use server"

  const { schoolId } = await getTenantContext()

  // Get unique tags matching query
  const questions = await db.questionBank.findMany({
    where: {
      schoolId,
      tags: { has: query }, // Approximate match
    },
    select: { tags: true },
    take: 100,
  })

  // Flatten and filter
  const allTags = questions.flatMap((q) => q.tags)
  const uniqueTags = [...new Set(allTags)]
  const filtered = uniqueTags
    .filter((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    .slice(0, limit)

  return filtered
}
```

---

## Analytics Issues

### Issue: Success Rate Shows >100%

**Symptoms:**

- Question analytics show 120% success rate
- Mathematically impossible

**Root Cause:** Calculation error or incorrect data

**Solution:** Validate calculation

```typescript
// actions.ts
export async function updateQuestionAnalytics(
  questionId: string,
  stats: {
    totalAttempts: number
    correctAttempts: number
    totalTimeSpent: number
  }
) {
  "use server"

  const { schoolId } = await getTenantContext()

  // ✅ Validate input
  if (stats.correctAttempts > stats.totalAttempts) {
    throw new Error("Correct attempts cannot exceed total attempts")
  }

  const successRate =
    stats.totalAttempts > 0
      ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
      : null

  // ✅ Clamp to 0-100 range
  const validSuccessRate =
    successRate !== null ? Math.max(0, Math.min(100, successRate)) : null

  await db.questionAnalytics.upsert({
    where: {
      questionId_schoolId: { questionId, schoolId },
    },
    create: {
      questionId,
      schoolId,
      timesUsed: 1,
      avgScore: successRate,
      successRate: validSuccessRate,
    },
    update: {
      timesUsed: { increment: 1 },
      successRate: validSuccessRate,
    },
  })
}
```

---

### Issue: Analytics Not Updating After Exam

**Symptoms:**

- Student takes exam with question
- Question analytics remain unchanged
- `timesUsed` still shows 0

**Root Cause:** Analytics not triggered after grading

**Solution:** Update analytics in mark block

```typescript
// In mark block actions.ts
export async function markExam(examId: string, results: StudentResults[]) {
  // ... mark exam logic

  // Update question analytics
  const questionStats = calculateQuestionStats(results)

  for (const [questionId, stats] of Object.entries(questionStats)) {
    await updateQuestionAnalytics(questionId, {
      totalAttempts: stats.attempts,
      correctAttempts: stats.correct,
      totalTimeSpent: stats.timeSpent,
    })
  }
}
```

---

## Import/Export Issues

### Issue: CSV Import Fails with Special Characters

**Symptoms:**

- Import CSV with Arabic or special characters
- Import fails or shows garbled text

**Root Cause:** Wrong encoding (ASCII instead of UTF-8)

**Solution:** Enforce UTF-8 encoding

```typescript
// actions.ts
export async function importQuestionsFromCSV(file: File) {
  "use server";

  // ✅ Read as UTF-8
  const text = await file.text();  // Default UTF-8

  // Or explicitly specify
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);

  // Parse CSV
  const questions = parseCSV(text);

  return await bulkImportQuestions({ questions, ... });
}
```

---

### Issue: Export Missing Some Questions

**Symptoms:**

- Export 100 questions
- CSV contains only 50
- No error shown

**Root Cause:** Pagination or query limit

**Solution:** Export in batches

```typescript
// actions.ts
export async function exportQuestionsToCSV(filters?: QuestionBankFilters) {
  "use server"

  const { schoolId } = await getTenantContext()

  // ✅ Fetch ALL matching questions (use cursor pagination for huge datasets)
  const allQuestions: QuestionBank[] = []
  let cursor: string | undefined

  do {
    const batch = await db.questionBank.findMany({
      where: {
        schoolId,
        ...buildFiltersWhere(filters),
      },
      take: 100,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    allQuestions.push(...batch)
    cursor = batch.length === 100 ? batch[batch.length - 1].id : undefined
  } while (cursor)

  // Generate CSV
  return generateCSV(allQuestions)
}
```

---

## Performance Issues

### Issue: Question List Loads Slowly (>5 seconds)

**Symptoms:**

- Question bank has 5000+ questions
- List page takes 5+ seconds to load
- Browser becomes unresponsive

**Root Cause:** Loading all questions at once

**Solution 1:** Implement pagination

```typescript
// content.tsx
export default async function QuestionBankContent({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;

  const [questions, total] = await Promise.all([
    db.questionBank.findMany({
      where: { schoolId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    db.questionBank.count({ where: { schoolId } })
  ]);

  return (
    <QuestionTable
      data={questions}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
```

**Solution 2:** Add database indexes

```prisma
model QuestionBank {
  // ...
  @@index([schoolId, createdAt(sort: Desc)])
  @@index([schoolId, subjectId])
  @@index([schoolId, questionType])
}
```

---

### Issue: AI Generation Blocks UI

**Symptoms:**

- Click "Generate 10 Questions"
- UI freezes for 30 seconds
- Cannot interact with page

**Root Cause:** Synchronous AI call on client

**Solution:** Use streaming or async processing

```typescript
// Use server action with loading state
"use client";

export function AIGenerationForm() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleGenerate(data: AIGenerationFormData) {
    setGenerating(true);
    setProgress(0);

    try {
      // Server action with progress updates
      const result = await generateQuestionsWithProgress(data, (p) => {
        setProgress(p);
      });

      // Success
      toast.success(`Generated ${result.data.length} questions`);
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Form onSubmit={handleGenerate}>
      {generating && <ProgressBar value={progress} />}
      {/* ... form fields */}
    </Form>
  );
}
```

---

## Known Limitations

### Current Limitations (v2.0)

1. **No Image Support in Questions**
   - Cannot embed images in question text
   - Only external image URL supported
   - **Workaround:** Use image URL field + external hosting

2. **No Question Versioning**
   - Editing question overwrites original
   - No history of changes
   - **Workaround:** Create new question instead of editing

3. **No Question Preview Before Import**
   - Bulk import commits immediately
   - Cannot review before saving
   - **Workaround:** Import to test environment first

4. **Limited AI Customization**
   - Fixed AI prompts
   - Cannot customize generation style
   - **Workaround:** Edit AI-generated questions after creation

5. **No Collaborative Editing**
   - Only one person can edit at a time
   - No conflict resolution
   - **Workaround:** Coordinate edits manually

6. **Tag Limit**
   - Maximum 20 tags per question
   - **Workaround:** Use hierarchical tags

7. **No Question Dependencies**
   - Cannot link related questions
   - No question sequences
   - **Workaround:** Use tags to group related questions

8. **AI Generation Cost**
   - Each API call incurs cost
   - No batch discounts
   - **Workaround:** Generate larger batches less frequently

---

## Future Enhancements

### Planned Features

#### 1. Image Upload Support (Priority: High)

```typescript
// Upload image to Vercel Blob or S3
export async function uploadQuestionImage(file: File) {
  const url = await uploadToStorage(file);
  return url;
}

// Embed in question
{
  questionText: "Identify the structure labeled X",
  imageUrl: "https://storage/question-123.png"
}
```

#### 2. Question Versioning (Priority: Medium)

```prisma
model QuestionVersion {
  id            String   @id @default(cuid())
  questionId    String
  version       Int
  questionText  String
  // ... other fields
  createdAt     DateTime @default(now())
  createdBy     String

  question QuestionBank @relation(fields: [questionId], references: [id])
  @@index([questionId, version])
}
```

#### 3. Question Pool/Collections (Priority: Medium)

```typescript
model QuestionCollection {
  id          String   @id @default(cuid())
  name        String
  description String?
  schoolId    String
  questions   QuestionBank[]  // Many-to-many
}
```

#### 4. Advanced Analytics Dashboard (Priority: Low)

- Question difficulty vs. success rate chart
- Bloom level distribution across subjects
- Most/least used questions over time
- Recommendation engine for underused questions

#### 5. Collaborative Review System (Priority: Low)

```prisma
model QuestionReview {
  id         String   @id @default(cuid())
  questionId String
  reviewerId String
  status     ReviewStatus  // PENDING, APPROVED, REJECTED
  comments   String?
  createdAt  DateTime @default(now())
}
```

---

## FAQ

**Q: Can I reuse questions across multiple subjects?**
A: No, questions are linked to one subject. Clone the question if needed for another subject.

**Q: How do I bulk edit question tags?**
A: Use `bulkUpdateTags(questionIds, newTags)` action.

**Q: Can AI generate questions in Arabic?**
A: Yes, if your AI service supports Arabic. Update prompts accordingly.

**Q: What happens if I delete a question used in past exams?**
A: Soft delete - question marked inactive but preserved for exam history.

**Q: How do I import questions from another system?**
A: Export to CSV from old system, format according to our schema, then use bulk import.

**Q: Can I limit which teachers see which questions?**
A: Not yet. All teachers in a school see all questions. Use tags to organize.

---

## Getting Help

If you encounter issues not covered here:

1. **Check Main ISSUE.md:** System-wide issues: [../ISSUE.md](../ISSUE.md)
2. **Check Logs:** Browser console + server logs
3. **Enable Debug:** Set `DEBUG=prisma:query`
4. **Test in Isolation:** Create minimal reproduction
5. **Review Related Docs:**
   - [Question Bank README](./README.md)
   - [Main Exam README](../README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
