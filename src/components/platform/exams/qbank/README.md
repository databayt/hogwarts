# Question Bank Block - Question Repository Management

**Comprehensive question library with AI generation and Bloom's taxonomy classification**

Part of the [Exam Block System](../README.md)

---

## Overview

The Question Bank (qbank) Block provides a centralized repository for exam questions with rich metadata, multiple question types, and intelligent organization. It serves as the foundation for exam generation with support for difficulty levels, Bloom's taxonomy classification, and AI-powered question creation.

**Key Responsibilities:**

- Question CRUD operations with validation
- Multiple question types (5 types)
- Difficulty classification (Easy, Medium, Hard)
- Bloom's taxonomy levels (6 levels)
- AI-powered question generation
- Tagging and categorization
- Question analytics and usage tracking
- Bulk import/export capabilities
- Subject-based organization

---

## Features

### 1. Multiple Question Types

**Supported Types:**

#### Multiple Choice Questions (MCQ)

- 2-6 options per question
- Single or multiple correct answers
- Option-specific explanations
- Auto-grading support

```typescript
{
  questionText: "What is the capital of Sudan?",
  questionType: "MULTIPLE_CHOICE",
  options: [
    { text: "Khartoum", isCorrect: true, explanation: "Correct! Khartoum is the capital." },
    { text: "Cairo", isCorrect: false, explanation: "Cairo is the capital of Egypt." },
    { text: "Addis Ababa", isCorrect: false, explanation: "This is Ethiopia's capital." },
    { text: "Nairobi", isCorrect: false, explanation: "This is Kenya's capital." }
  ]
}
```

#### True/False Questions

- Binary choice questions
- Explanations for both options
- Fast to answer
- Auto-grading support

```typescript
{
  questionText: "The Earth revolves around the Sun.",
  questionType: "TRUE_FALSE",
  options: [
    { text: "True", isCorrect: true, explanation: "Earth completes one orbit in 365.25 days." },
    { text: "False", isCorrect: false }
  ]
}
```

#### Fill in the Blank

- Short answer with specific expected values
- Multiple accepted answers (synonyms)
- Case sensitivity control
- Auto-grading with fuzzy matching

```typescript
{
  questionText: "The chemical symbol for water is _____.",
  questionType: "FILL_BLANK",
  acceptedAnswers: ["H2O", "H₂O"],
  caseSensitive: false
}
```

#### Short Answer

- 1-2 sentence responses
- Sample answer for grading reference
- Grading rubric with key points
- Manual or AI-assisted grading

```typescript
{
  questionText: "Explain the process of photosynthesis in 2-3 sentences.",
  questionType: "SHORT_ANSWER",
  sampleAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy...",
  gradingRubric: "Key points: 1) Light absorption, 2) CO2 conversion, 3) Oxygen release"
}
```

#### Essay Questions

- Long-form responses
- Detailed grading rubric
- Comprehensive sample answer
- AI-assisted or manual grading

```typescript
{
  questionText: "Discuss the causes and effects of climate change.",
  questionType: "ESSAY",
  sampleAnswer: "Climate change refers to long-term shifts in temperatures and weather patterns...",
  gradingRubric: "Structure (20%), Content (40%), Analysis (30%), Conclusion (10%)",
  points: 10
}
```

**File Reference:** `config.ts:9-45`

---

### 2. Difficulty Levels

Three-tier difficulty classification:

| Level      | Description                    | Default Points | Use Case               |
| ---------- | ------------------------------ | -------------- | ---------------------- |
| **Easy**   | Basic recall and understanding | 1              | Foundational knowledge |
| **Medium** | Application and analysis       | 2              | Problem-solving        |
| **Hard**   | Evaluation and creation        | 3              | Critical thinking      |

**Configuration:** `config.ts:48-70`

**Points Calculation:**

```typescript
// Base points by type + difficulty multiplier
calculateDefaultPoints(QuestionType.MULTIPLE_CHOICE, DifficultyLevel.HARD)
// Returns: 1 × 2 = 2 points
```

---

### 3. Bloom's Taxonomy Classification

Six cognitive levels following Bloom's revised taxonomy:

1. **Remember** (Level 1)
   - Recall facts and basic concepts
   - Keywords: Define, List, Identify, Name, State
   - Example: "Define the term 'photosynthesis'"

2. **Understand** (Level 2)
   - Explain ideas or concepts
   - Keywords: Explain, Describe, Summarize, Interpret
   - Example: "Explain how photosynthesis works"

3. **Apply** (Level 3)
   - Use information in new situations
   - Keywords: Apply, Solve, Use, Demonstrate, Calculate
   - Example: "Calculate the rate of photosynthesis under given conditions"

4. **Analyze** (Level 4)
   - Draw connections among ideas
   - Keywords: Analyze, Compare, Contrast, Examine
   - Example: "Compare C3 and C4 photosynthesis pathways"

5. **Evaluate** (Level 5)
   - Justify a stand or decision
   - Keywords: Evaluate, Justify, Critique, Judge
   - Example: "Evaluate the impact of reduced sunlight on photosynthesis"

6. **Create** (Level 6)
   - Produce new or original work
   - Keywords: Create, Design, Construct, Develop
   - Example: "Design an experiment to test photosynthesis efficiency"

**Configuration:** `config.ts:73-158`

**Distribution Example:**

```typescript
const bloomDistribution = {
  REMEMBER: 4, // 40% foundational
  UNDERSTAND: 3, // 30% comprehension
  APPLY: 2, // 20% application
  ANALYZE: 1, // 10% analysis
  EVALUATE: 0, // Optional
  CREATE: 0, // Optional
}
```

---

### 4. AI Question Generation

Generate questions automatically using AI with customizable parameters:

**Features:**

- Topic-based generation
- Difficulty and Bloom level control
- Batch generation (1-50 questions)
- Custom instructions support
- Subject-specific context
- Auto-formatting with templates

**Usage:**

```typescript
import { generateQuestionsWithAI } from "./actions"

const result = await generateQuestionsWithAI({
  subjectId: "sub123",
  topic: "Photosynthesis",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  bloomLevel: "APPLY",
  numberOfQuestions: 5,
  additionalInstructions: "Focus on practical applications",
  tags: ["biology", "plants", "energy"],
})

// Returns: { success: true, data: AIGeneratedQuestion[] }
```

**AI Prompts:** `config.ts:231-296`

**Prompt Structure:**

1. Context setting (subject, level, topic)
2. Requirements (difficulty, Bloom level, question type)
3. Format specification (JSON schema)
4. Quality criteria (clear, unambiguous, pedagogically sound)

---

### 5. Tagging System

Flexible tagging for organization and search:

```typescript
{
  questionText: "...",
  tags: [
    "photosynthesis",
    "cellular-respiration",
    "biology",
    "energy-transfer",
    "grade-10"
  ]
}
```

**Tag Benefits:**

- Cross-referencing questions
- Topic-based filtering
- Curriculum mapping
- Quick search and discovery
- Custom categorization

---

### 6. Question Analytics

Track question performance and effectiveness:

**Metrics Tracked:**

- Times used in exams
- Average score across students
- Success rate (% correct)
- Average time spent
- Perceived difficulty vs. assigned difficulty
- Last used date

**Analytics Types:**

```typescript
type QuestionAnalytics = {
  timesUsed: number
  avgScore: number | null
  successRate: number | null
  avgTimeSpent: number | null
  perceivedDifficulty: DifficultyLevel | null
  lastUsed: Date | null
}
```

**Usage:**

- Identify underperforming questions
- Refine difficulty classifications
- Find most effective questions
- Track question lifecycle

**File Reference:** `types.ts:219-256`

---

## Architecture

### File Structure

```
qbank/
├── content.tsx          # Server component - question list
├── table.tsx            # Client component - data table
├── columns.tsx          # Table column definitions
├── form.tsx             # Question creation/edit form
├── actions.ts           # Server actions (CRUD + AI)
├── validation.ts        # Zod schemas
├── types.ts             # TypeScript types (347 lines)
├── config.ts            # Configuration (369 lines)
├── list-params.ts       # URL state management
└── lib/                 # Utilities (empty for now)
```

### Technology Stack

- **Prisma 6.14** - QuestionBank, QuestionAnalytics models
- **Zod 4.0** - Multi-step validation
- **React Hook Form 7.61** - Complex form state
- **@tanstack/react-table 8.21** - Advanced filtering
- **AI Integration** - Question generation (external service)

---

## Usage

### Creating a Question

```typescript
import { createQuestion } from "@/components/platform/exams/qbank/actions"

const question = await createQuestion({
  subjectId: "sub123",
  questionText: "What is the Pythagorean theorem?",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "EASY",
  bloomLevel: "REMEMBER",
  points: 1,
  options: [
    { text: "a² + b² = c²", isCorrect: true },
    { text: "a + b = c", isCorrect: false },
    { text: "a² - b² = c²", isCorrect: false },
    { text: "ab = c²", isCorrect: false },
  ],
  tags: ["geometry", "triangles", "formulas"],
  explanation: "The Pythagorean theorem relates the sides of a right triangle.",
})

// Returns: { success: true, data: { id: "..." } }
```

### Searching Questions

```typescript
import { searchQuestions } from "./actions"

const results = await searchQuestions({
  subjectId: "sub123",
  search: "photosynthesis",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  bloomLevel: "APPLY",
  tags: ["biology"],
  page: 1,
  pageSize: 20,
})

// Returns: { questions: QuestionBank[], total: number }
```

### Generating Questions with AI

```typescript
import { generateQuestionsWithAI } from "./actions"

const generated = await generateQuestionsWithAI({
  subjectId: "sub123",
  topic: "Quadratic Equations",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  bloomLevel: "APPLY",
  numberOfQuestions: 10,
  additionalInstructions: "Include real-world application examples",
  tags: ["algebra", "equations"],
})

// Save to question bank
for (const q of generated.data) {
  await createQuestion({
    subjectId: "sub123",
    ...q,
    source: "AI",
  })
}
```

### Bulk Import

```typescript
import { bulkImportQuestions } from './actions';

const questions = [
  { questionText: "...", questionType: "MCQ", ... },
  { questionText: "...", questionType: "TF", ... },
  // ... more questions
];

const result = await bulkImportQuestions({
  questions,
  subjectId: "sub123",
  source: "IMPORTED"
});

// Returns: { successful: 45, failed: 5, errors: [...] }
```

---

## Server Actions

### Available Actions

**File:** `actions.ts:1-500`

#### CRUD Operations

- `createQuestion(data)` - Create new question
- `updateQuestion(id, data)` - Update existing question
- `deleteQuestion(id)` - Delete question (soft delete if used in exams)
- `getQuestion(id)` - Fetch single question with relations
- `getQuestions(filters)` - Fetch paginated question list

#### Search & Filter

- `searchQuestions(query, filters)` - Full-text search
- `getQuestionsByTag(tag)` - Find questions by tag
- `getQuestionsBySubject(subjectId)` - Subject-specific questions
- `getQuestionsByDifficulty(difficulty)` - Filter by difficulty

#### AI Generation

- `generateQuestionsWithAI(params)` - Generate questions with AI
- `refineQuestion(id, instructions)` - AI refinement of existing question

#### Analytics

- `updateQuestionAnalytics(id, stats)` - Record usage stats
- `getQuestionAnalytics(id)` - Fetch analytics data
- `identifyUnderperformingQuestions()` - Find questions with low success rate
- `identifyMostUsedQuestions(limit)` - Top N popular questions

#### Bulk Operations

- `bulkImportQuestions(data)` - Import multiple questions
- `bulkDeleteQuestions(ids)` - Delete multiple questions
- `bulkUpdateTags(ids, tags)` - Update tags for multiple questions
- `exportQuestionsToCSV(filters)` - Export questions

---

## Validation & Types

### Zod Schemas

**File:** `validation.ts:1-283`

#### Base Question Schema

```typescript
export const questionBankSchema = z.object({
  subjectId: z.string().cuid(),
  questionText: z.string().min(10, "Question too short").max(2000),
  questionType: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
    "SHORT_ANSWER",
    "ESSAY",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  bloomLevel: z.enum([
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ]),
  points: z.number().int().min(1).max(100),
  timeEstimate: z.number().optional(),
  tags: z.array(z.string()).min(1, "Add at least one tag"),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional(),
})
```

#### MCQ-Specific Validation

```typescript
export const mcqSchema = questionBankSchema.extend({
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
        explanation: z.string().optional(),
      })
    )
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine((opts) => opts.filter((o) => o.isCorrect).length >= 1, {
      message: "At least one correct answer required",
    }),
})
```

#### Fill-in-the-Blank Validation

```typescript
export const fillBlankSchema = questionBankSchema
  .extend({
    acceptedAnswers: z.array(z.string()).min(1, "At least one answer required"),
    caseSensitive: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.questionText.includes("_____") ||
      data.questionText.includes("[blank]"),
    { message: "Question must include a blank (_____ or [blank])" }
  )
```

### TypeScript Types

**File:** `types.ts:1-347`

**Key Types:**

- `QuestionBankDTO` - Database question with relations
- `QuestionBankFormData` - Form input type
- `QuestionOption` - MCQ/TF option structure
- `AIGenerationFormData` - AI generation parameters
- `AIGeneratedQuestion` - AI output format
- `QuestionAnalytics` - Usage statistics
- `QuestionStatsData` - Analytics dashboard data

---

## Configuration

### Question Types

**File:** `config.ts:9-45`

```typescript
export const QUESTION_TYPES = [
  {
    label: "Multiple Choice",
    value: QuestionType.MULTIPLE_CHOICE,
    description: "Questions with multiple options, one or more correct answers",
    icon: "CircleDot",
    supportsAutoGrading: true,
  },
  // ... other types
]
```

### Default Points

```typescript
// By Question Type
MULTIPLE_CHOICE: 1 point
TRUE_FALSE: 1 point
FILL_BLANK: 2 points
SHORT_ANSWER: 3 points
ESSAY: 5 points

// By Difficulty (multiplier)
EASY: × 1.0
MEDIUM: × 1.5
HARD: × 2.0
```

### Time Estimates

```typescript
MULTIPLE_CHOICE: 1.5 minutes
TRUE_FALSE: 0.5 minutes
FILL_BLANK: 2 minutes
SHORT_ANSWER: 5 minutes
ESSAY: 15 minutes
```

Adjusted by difficulty:

- EASY: × 1.0
- MEDIUM: × 1.2
- HARD: × 1.5

**File Reference:** `config.ts:182-206`

---

## Routes

### Page Routes

All routes under `/[lang]/generate/questions/`:

- `/[lang]/generate/questions` - Question list (table view)
- `/[lang]/generate/questions/new` - Create question (form)
- `/[lang]/generate/questions/[id]` - Question details (view)
- `/[lang]/generate/questions/[id]/edit` - Edit question
- `/[lang]/generate/questions/ai-generate` - AI generation interface
- `/[lang]/generate/questions/import` - Bulk import
- `/[lang]/generate/questions/analytics` - Analytics dashboard

---

## Integration Points

### With Other Blocks

**Manage Block:**

- "Browse Question Bank" button in exam form
- Manual question selection for exams

**Generate Block:**

- Question selection algorithms
- Template-based filtering
- Distribution requirements

**Mark Block:**

- Auto-grading for MCQ/TF/Fill Blank
- Rubric access for subjective questions

**Results Block:**

- Question-wise performance analysis
- Update question analytics after grading

---

## Multi-Tenant Safety

All operations scoped by `schoolId`:

```typescript
// ✅ CORRECT - Always include schoolId
const questions = await db.questionBank.findMany({
  where: {
    schoolId,
    subjectId: "sub123",
  },
})

// ✅ CORRECT - Prevent cross-tenant updates
const updated = await db.questionBank.update({
  where: {
    id: questionId,
    schoolId, // Critical!
  },
  data: updates,
})
```

---

## Internationalization

### Translation Keys

```typescript
dictionary.school.exams.qbank = {
  title: "Question Bank",
  description: "Manage your question repository",
  create: "Create Question",
  edit: "Edit Question",
  delete: "Delete Question",
  types: {
    mcq: "Multiple Choice",
    trueFalse: "True/False",
    fillBlank: "Fill in the Blank",
    shortAnswer: "Short Answer",
    essay: "Essay",
  },
  difficulty: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  },
  bloom: {
    remember: "Remember",
    understand: "Understand",
    apply: "Apply",
    analyze: "Analyze",
    evaluate: "Evaluate",
    create: "Create",
  },
}
```

### RTL Support

- Form layouts adjust automatically
- Table text alignment
- Tag display direction
- AI generation interface

---

## Performance Considerations

### Database Indexes

```prisma
model QuestionBank {
  // ...
  @@index([schoolId, subjectId])
  @@index([schoolId, difficulty])
  @@index([schoolId, questionType])
  @@index([schoolId, bloomLevel])
  @@fulltext([questionText, explanation])
}
```

### Query Optimization

```typescript
// ❌ Slow - Fetches everything
const questions = await db.questionBank.findMany({
  where: { schoolId },
  include: {
    subject: true,
    analytics: true,
  },
})

// ✅ Fast - Select only needed fields
const questions = await db.questionBank.findMany({
  where: { schoolId },
  select: {
    id: true,
    questionText: true,
    questionType: true,
    difficulty: true,
    points: true,
    subject: { select: { subjectName: true } },
    _count: { select: { generatedExamQuestions: true } },
  },
})
```

---

## Best Practices

### Writing Good Questions

1. **Clear and Concise:** Avoid ambiguity
2. **Age-Appropriate:** Match student level
3. **Single Focus:** Test one concept per question
4. **Plausible Distractors:** MCQ options should be reasonable
5. **Avoid Negatives:** "Which is NOT..." can confuse
6. **Balanced Distribution:** Mix difficulty and Bloom levels

### Tagging Strategy

```typescript
// ✅ GOOD - Specific, hierarchical tags
tags: ["math", "algebra", "quadratic-equations", "grade-10"]

// ❌ BAD - Too generic or inconsistent
tags: ["math", "Maths", "mathematics", "stuff"]
```

### AI Generation Tips

1. Be specific in topic description
2. Provide context about student level
3. Review and edit AI-generated questions
4. Test questions before using in exams
5. Refine based on analytics data

---

## Contributing

When adding features to the Question Bank:

1. **New Question Type:** Update `QuestionType` enum in Prisma + config
2. **New Bloom Level:** Update `BloomLevel` enum + color coding
3. **New Analytics:** Add to `QuestionAnalytics` model
4. **i18n:** Add keys for en/ar
5. **Validation:** Add Zod schemas for new types
6. **Types:** Update TypeScript types
7. **Documentation:** Update this README

---

## Related Documentation

- [Main Exam Block README](../README.md)
- [Main Exam Block ISSUE](../ISSUE.md)
- [Manage Block](../manage/README.md)
- [Auto-Generate Block](../generate/README.md)
- [Auto-Mark Block](../mark/README.md)
- [Results Block](../results/README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
