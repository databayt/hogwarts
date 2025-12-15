# Auto-Generate Block - AI-Powered Exam Generation

**Intelligent exam creation using templates and AI-powered question selection**

Part of the [Exam Block System](../README.md)

---

## Overview

The Auto-Generate Block automates exam creation using predefined templates, distribution rules, and intelligent question selection algorithms. It generates balanced exams that meet specific difficulty, Bloom's taxonomy, and question type requirements.

**Key Features:**

- Exam template management
- Question distribution configuration
- AI-powered question selection
- Bloom's taxonomy balancing
- Difficulty distribution
- Preview before finalization
- Randomization support
- Template reuse across classes

---

## Features

### 1. Exam Templates

Create reusable blueprints for exam generation:

```typescript
{
  name: "Standard Math Midterm",
  subjectId: "math-101",
  duration: 90, // minutes
  totalMarks: 100,
  distribution: {
    MULTIPLE_CHOICE: {
      EASY: 10,    // 10 easy MCQ
      MEDIUM: 5,   // 5 medium MCQ
      HARD: 3      // 3 hard MCQ
    },
    SHORT_ANSWER: {
      MEDIUM: 2,
      HARD: 2
    }
  },
  bloomDistribution: {
    REMEMBER: 8,
    UNDERSTAND: 6,
    APPLY: 4,
    ANALYZE: 2
  }
}
```

### 2. Distribution Editor

Visual interface for configuring question distribution:

- Drag-and-drop grid
- Real-time total calculation
- Balance validation
- Points preview

**File Reference:** `distribution-editor.tsx:1-146`

### 3. Question Selection Algorithm

Intelligent selection ensuring requirements are met:

```typescript
// utils.ts
export async function selectQuestions(
  template: ExamTemplate,
  options: GenerationOptions
): Promise<QuestionBank[]> {
  const { distribution, bloomDistribution } = template
  const selected: QuestionBank[] = []

  // Select by type and difficulty
  for (const [type, difficultyMap] of Object.entries(distribution)) {
    for (const [difficulty, count] of Object.entries(difficultyMap)) {
      const questions = await db.questionBank.findMany({
        where: {
          schoolId,
          subjectId: template.subjectId,
          questionType: type,
          difficulty: difficulty,
        },
        take: count * 2, // Buffer for selection
        orderBy: options.randomize ? { id: "asc" } : { timesUsed: "asc" },
      })

      // Apply Bloom distribution
      const bloomFiltered = filterByBloomLevel(questions, bloomDistribution)
      selected.push(...bloomFiltered.slice(0, count))
    }
  }

  return selected
}
```

**File Reference:** `utils.ts:1-402`

---

## Usage

### Creating a Template

```typescript
import { createExamTemplate } from "./actions"

const template = await createExamTemplate({
  name: "Physics Final Template",
  description: "Standard final exam structure",
  subjectId: "physics-101",
  duration: 120,
  totalMarks: 150,
  distribution: {
    MULTIPLE_CHOICE: {
      EASY: 15,
      MEDIUM: 10,
      HARD: 5,
    },
    ESSAY: {
      HARD: 2,
    },
  },
  bloomDistribution: {
    REMEMBER: 10,
    UNDERSTAND: 10,
    APPLY: 8,
    ANALYZE: 4,
    EVALUATE: 2,
    CREATE: 1,
  },
})
```

### Generating an Exam

```typescript
import { generateExamFromTemplate } from "./actions"

const result = await generateExamFromTemplate({
  templateId: "template-123",
  examId: "exam-456",
  options: {
    randomize: true,
    seed: "unique-seed-2025",
    excludeRecentlyUsed: true,
    preferHighPerforming: true,
  },
})

// Returns: { generatedExamId: "...", questions: [...] }
```

---

## Server Actions

**File:** `actions.ts:1-500`

- `createExamTemplate(data)` - Create template
- `updateExamTemplate(id, data)` - Update template
- `deleteExamTemplate(id)` - Delete template
- `getExamTemplate(id)` - Fetch template
- `getExamTemplates(filters)` - List templates
- `generateExamFromTemplate(params)` - Generate exam
- `previewGeneration(templateId)` - Preview without saving
- `validateDistribution(distribution)` - Check if achievable

---

## Routes

- `/[lang]/generate` - Generation dashboard
- `/[lang]/generate/templates` - Template list
- `/[lang]/generate/templates/new` - Create template
- `/[lang]/generate/templates/[id]` - Template details
- `/[lang]/generate/templates/[id]/edit` - Edit template
- `/[lang]/generate/preview` - Preview generated exam

---

## Configuration

**File:** `config.ts:1-325` (same as qbank config)

### Generation Settings

```typescript
export const EXAM_GENERATION_SETTINGS = {
  minQuestionsPerExam: 1,
  maxQuestionsPerExam: 100,
  defaultDuration: 60,
  allowDuplicateQuestions: false,
  defaultRandomization: false,
  selectionStrategy: "BALANCED", // BALANCED, RANDOM, LEAST_USED
}
```

---

## Integration

### With Question Bank

- Queries available questions
- Filters by metadata
- Tracks usage statistics

### With Manage Block

- "Generate from Template" option
- Pre-fills exam details
- Links to generated exam

---

## Performance

### Optimization Strategies

1. **Pre-filter Questions**

```typescript
// Get all matching questions once
const pool = await db.questionBank.findMany({
  where: {
    schoolId,
    subjectId,
    questionType: { in: requiredTypes },
    difficulty: { in: requiredDifficulties },
  },
})

// Then filter in memory
const selected = filterByBloomAndSelect(pool, distribution)
```

2. **Cache Templates**

```typescript
// Cache frequently used templates
const cachedTemplate = await redis.get(`template:${id}`)
if (cachedTemplate) return JSON.parse(cachedTemplate)
```

---

## Related Documentation

- [Main Exam Block](../README.md)
- [Question Bank](../qbank/README.md)
- [Manage Block](../manage/README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
