# Exam Block System

**Comprehensive Examination Management with 5 Feature-Based Sub-Blocks**

The Exam Block provides end-to-end examination management from question creation to result generation with PDF reports. Built using feature-based architecture where each sub-block is fully self-contained.

## 📦 Architecture Overview

### Sub-Block Structure

```
exams/
├── content.tsx              # Main exam dashboard
├── manage/                  # Exam lifecycle management
│   ├── types.ts
│   ├── validation.ts
│   ├── actions.ts
│   ├── config.ts
│   ├── utils.ts
│   ├── content.tsx
│   ├── form.tsx
│   ├── table.tsx
│   └── columns.tsx
├── qbank/                   # Question bank repository
│   └── [same structure]
├── generate/                # AI-powered exam generation
│   └── [same structure]
├── mark/                    # Automated marking system
│   └── [same structure]
└── results/                 # Results & PDF generation
    ├── lib/
    │   ├── calculator.ts
    │   ├── pdf-generator.ts
    │   └── templates/
    │       ├── classic.tsx
    │       ├── modern.tsx
    │       └── minimal.tsx
    └── [standard files]
```

### Technology Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Database**: PostgreSQL (Neon) + Prisma ORM 6.14
- **Forms**: React Hook Form 7.61 + Zod 4.0 validation
- **Tables**: @tanstack/react-table 8.21
- **PDF**: @react-pdf/renderer 4.3
- **UI**: shadcn/ui + Tailwind CSS 4
- **i18n**: Full Arabic (RTL) & English (LTR) support

## 🎯 Feature Blocks

### 1. Manage Block (`manage/`)

**Exam Lifecycle Management**

Create, schedule, and oversee all examinations from planning to completion.

**Features:**
- Multi-step exam creation form
- Date and time scheduling
- Class and subject assignment
- Marks configuration (total, passing threshold)
- Exam types (MIDTERM, FINAL, QUIZ, TEST, PRACTICAL)
- Status workflow (PLANNED → IN_PROGRESS → COMPLETED)
- Search, filter, and sort capabilities
- Bulk operations

**Routes:**
- `/[lang]/exams` - Exams listing
- `/[lang]/exams/new` - Create exam
- `/[lang]/exams/[id]` - Exam details
- `/[lang]/exams/[id]/edit` - Edit exam

**Key Files:**
- `form.tsx` - Multi-step creation form
- `table.tsx` - Exams data table
- `actions.ts` - CRUD server actions
- `utils.ts` - Duration calculation, conflict detection

**Usage:**
```typescript
import { createExam } from '@/components/platform/exams/manage/actions';

const exam = await createExam({
  title: "Mathematics Midterm",
  classId: "class-id",
  subjectId: "subject-id",
  examDate: new Date("2025-03-15"),
  startTime: "09:00",
  endTime: "11:00",
  totalMarks: 100,
  passingMarks: 50,
  examType: "MIDTERM"
});
```

### 2. Question Bank Block (`qbank/`)

**Question Repository Management**

Build and maintain a reusable library of exam questions with rich metadata.

**Features:**
- Multiple question types:
  - Multiple Choice (MCQ)
  - True/False
  - Fill in the Blank
  - Short Answer
  - Essay
- Difficulty levels (EASY, MEDIUM, HARD)
- Bloom's taxonomy classification
- Topic and tag management
- Point value assignment
- Search and filter by metadata
- Bulk import/export

**Routes:**
- `/[lang]/generate/questions` - Question listing
- `/[lang]/generate/questions/new` - Add question
- `/[lang]/generate/questions/[id]` - Question details

**Key Files:**
- `form.tsx` - Question creation form
- `table.tsx` - Questions data table
- `actions.ts` - Question CRUD operations
- `types.ts` - Question type definitions

**Usage:**
```typescript
import { createQuestion } from '@/components/platform/exams/qbank/actions';

const question = await createQuestion({
  subjectId: "subject-id",
  questionText: "What is the capital of Sudan?",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "EASY",
  bloomLevel: "REMEMBER",
  points: 2,
  options: [
    { text: "Khartoum", isCorrect: true },
    { text: "Cairo", isCorrect: false },
    { text: "Addis Ababa", isCorrect: false },
    { text: "Nairobi", isCorrect: false }
  ]
});
```

### 3. Auto-Generate Block (`generate/`)

**AI-Powered Exam Creation**

Generate exams automatically using templates or AI-powered question selection.

**Features:**
- Exam template management
- Question distribution rules
- AI question generation
- Smart question selection algorithms
- Bloom's taxonomy distribution
- Difficulty balancing
- Template-based generation
- Preview before finalization

**Routes:**
- `/[lang]/generate` - Generation dashboard
- `/[lang]/generate/templates` - Template listing
- `/[lang]/generate/templates/new` - Create template

**Key Files:**
- `form.tsx` - Template creation
- `distribution-editor.tsx` - Distribution configuration
- `actions.ts` - Generation logic
- `utils.ts` - Selection algorithms

**Usage:**
```typescript
import { generateExamFromTemplate } from '@/components/platform/exams/generate/actions';

const exam = await generateExamFromTemplate({
  templateId: "template-id",
  classId: "class-id",
  examDate: new Date("2025-04-10"),
  startTime: "10:00"
});
```

### 4. Auto-Mark Block (`mark/`)

**Automated Grading System**

Grade student submissions automatically with AI assistance for subjective answers.

**Features:**
- Automatic MCQ/True-False grading
- Rubric-based essay marking
- AI-assisted grading for subjective answers
- Bulk marking capabilities
- Grade override system
- Detailed feedback mechanism
- Marking progress tracking
- Question-wise analysis

**Routes:**
- `/[lang]/mark` - Marking dashboard
- `/[lang]/mark/grade/[id]` - Grade specific exam
- `/[lang]/mark/pending` - Pending exams

**Key Files:**
- `content.tsx` - Marking dashboard
- `form.tsx` - Marking interface
- `actions.ts` - Grading logic
- `utils.ts` - Score calculation

**Usage:**
```typescript
import { markExam } from '@/components/platform/exams/mark/actions';

const result = await markExam({
  examId: "exam-id",
  studentId: "student-id",
  answers: [
    { questionId: "q1", answer: "A", pointsAwarded: 2 },
    { questionId: "q2", answer: "Essay text...", pointsAwarded: 8 }
  ]
});
```

### 5. Results Block (`results/`)

**Comprehensive Results & Analytics**

Generate detailed reports, calculate grades, and create customizable PDF certificates.

**Features:**
- Mark summation and aggregation
- Grade calculation with boundaries
- Class rank computation
- Performance analytics
- PDF report generation (3 templates):
  - **Classic**: Traditional formal report card
  - **Modern**: Visual design with charts
  - **Minimal**: Clean text-based layout
- Question-wise breakdown
- Export capabilities (PDF, CSV)
- A4-friendly layouts for printing

**Routes:**
- `/[lang]/results` - Results listing
- `/[lang]/results/[examId]` - Exam results detail
- `/[lang]/results/analytics` - Performance analytics

**Key Files:**
- `lib/calculator.ts` - Grade calculation (340 lines, 20+ functions)
- `lib/pdf-generator.ts` - PDF generation core (280 lines)
- `lib/templates/classic.tsx` - Formal template (400 lines)
- `lib/templates/modern.tsx` - Visual template (380 lines)
- `lib/templates/minimal.tsx` - Simple template (350 lines)
- `actions.ts` - Results operations (300 lines)
- `utils.ts` - Helper functions (200+ lines)

**Usage:**
```typescript
import { getExamResults, generateStudentPDF } from '@/components/platform/exams/results/actions';

// Get all results
const results = await getExamResults({
  examId: "exam-id",
  includeAbsent: true,
  includeQuestionBreakdown: true
});

// Generate PDF
const pdf = await generateStudentPDF({
  examId: "exam-id",
  studentId: "student-id",
  options: {
    template: "modern",
    includeQuestionBreakdown: true,
    includeClassAnalytics: true,
    language: "en"
  }
});
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate
```

### Database Models

See `prisma/models/exams.prisma` and `prisma/models/marking.prisma`:
- `Exam` - Main exam entity
- `ExamResult` - Student results
- `QuestionBank` - Question repository
- `ExamTemplate` - Reusable blueprints
- `GeneratedExam` - AI-generated exams
- `GradeBoundary` - Grade rules
- `MarkingResult` - Detailed marks
- `Rubric` - Marking criteria

### Configuration

1. **Grade Boundaries**: Configure in database
```sql
INSERT INTO grade_boundaries (grade, min_score, max_score, gpa_value, school_id)
VALUES
  ('A+', 95, 100, 4.0, 'school-id'),
  ('A', 90, 94, 3.7, 'school-id');
```

2. **PDF Templates**: Customize in `results/lib/templates/`

3. **Question Types**: Defined in `prisma/models/exams.prisma`

## 🔒 Multi-Tenant Safety

**Critical**: All operations are scoped by `schoolId`:

```typescript
import { getTenantContext } from '@/lib/tenant-context';

export async function myAction() {
  "use server";

  const { schoolId } = await getTenantContext();

  // Always include schoolId
  const data = await db.exam.findMany({
    where: { schoolId }  // Required!
  });
}
```

## 🌍 Internationalization

Full bilingual support with 150+ translation keys:

**Dictionaries:**
- `dictionary.school.exams.dashboard.*` - Dashboard UI
- `dictionary.results.*` - Results block
- `dictionary.generate.*` - Generation block
- `dictionary.marking.*` - Marking block

**Languages:**
- Arabic (RTL) - Default
- English (LTR)

**Usage:**
```typescript
<h1>{dictionary?.school?.exams?.title}</h1>
<p>{dictionary?.results?.statistics?.averageScore}</p>
```

## 📊 Analytics & Metrics

### Available Statistics
- Class average and median scores
- Pass/fail rates
- Grade distribution
- Top performers (configurable count)
- Students needing attention (below threshold)
- Question-wise difficulty analysis
- Performance trends by topic

### Calculation Functions

From `results/lib/calculator.ts`:
```typescript
- calculateGrade() - Letter grade from percentage
- calculateMarkSummation() - Aggregate marks
- calculateRanks() - Class rankings
- calculateGPA() - GPA from percentage
- calculateClassAverage() - Class performance
- calculateGradeDistribution() - Grade breakdown
- identifyTopPerformers() - Top N students
- identifyNeedsAttention() - Struggling students
```

## 🎨 UI Components

### Dashboard
- 8 overview statistics cards
- 5 feature block navigation cards
- Quick actions menu (4 shortcuts)
- 5-step workflow guide

### Tables
All blocks use `@tanstack/react-table`:
- Server-side pagination
- Multi-column sorting
- Advanced filtering
- Column visibility controls
- Bulk selection and actions
- Export capabilities

### Forms
Built with `react-hook-form` + Zod:
- Real-time validation
- Multi-step flows
- Auto-save functionality
- Error handling with toast notifications
- Optimistic updates

## 📝 Code Statistics

- **Total Lines**: ~16,800
- **Results Block**: ~2,500 lines
- **PDF Templates**: 1,130 lines (3 templates)
- **Calculator**: 340 lines (20+ functions)
- **Server Actions**: 600+ lines
- **Type Definitions**: 500+ lines
- **i18n Keys**: 150+ (en/ar)

## 🐛 Troubleshooting

See [ISSUE.md](./ISSUE.md) for common issues and solutions.

## 📚 Sub-Block Documentation

- [Manage Block](./manage/README.md) - Exam management details
- [Question Bank](./qbank/README.md) - Question repository guide
- [Auto-Generate](./generate/README.md) - Generation system docs
- [Auto-Marking](./mark/README.md) - Marking system guide
- [Results](./results/README.md) - Results & analytics docs

## 🤝 Contributing

When adding features:
1. Follow feature-based structure
2. Keep blocks self-contained
3. Always scope by schoolId
4. Add i18n dictionary keys (en + ar)
5. Include TypeScript types
6. Write server actions with "use server"
7. Validate with Zod (client + server)
8. Update documentation

## 🔐 Security Checklist

- [ ] All queries include `schoolId`
- [ ] Server actions use "use server" directive
- [ ] Input validation with Zod on server
- [ ] Use `updateMany`/`deleteMany` for modifications
- [ ] Sanitize user input before database operations
- [ ] Check permissions before sensitive operations
- [ ] Rate limit API endpoints
- [ ] Audit log for grade changes

## 📄 License

Part of the Hogwarts School Management System - MIT License
