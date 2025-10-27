# Results Block - Comprehensive Results & Analytics

**Grade calculation, analytics generation, and PDF report creation**

Part of the [Exam Block System](../README.md)

---

## Overview

The Results Block handles the final stage of the exam lifecycle: calculating grades, generating analytics, computing rankings, and creating customizable PDF report cards. It provides comprehensive insights into student and class performance.

**Key Features:**
- Mark summation and aggregation
- Letter grade calculation with boundaries
- Class rank computation
- Performance analytics and statistics
- PDF report generation (3 templates)
- Question-wise breakdown
- Export capabilities (PDF, CSV)
- Multi-language support (EN/AR with RTL)

---

## Features

### 1. Grade Calculation

**Grade Boundaries:**
Configure school-wide or subject-specific grading scales:

```typescript
// config.ts
export const DEFAULT_GRADE_BOUNDARIES = [
  { grade: 'A+', minScore: 95, maxScore: 100, gpaValue: 4.0 },
  { grade: 'A', minScore: 90, maxScore: 94, gpaValue: 3.7 },
  { grade: 'B+', minScore: 85, maxScore: 89, gpaValue: 3.3 },
  { grade: 'B', minScore: 80, maxScore: 84, gpaValue: 3.0 },
  { grade: 'C+', minScore: 75, maxScore: 79, gpaValue: 2.7 },
  { grade: 'C', minScore: 70, maxScore: 74, gpaValue: 2.0 },
  { grade: 'D', minScore: 60, maxScore: 69, gpaValue: 1.0 },
  { grade: 'F', minScore: 0, maxScore: 59, gpaValue: 0.0 }
];
```

**Calculation:**
```typescript
// lib/calculator.ts
export async function calculateGrade(
  percentage: number,
  schoolId: string,
  subjectId?: string
): Promise<{ grade: string; gpa: number }> {
  const boundaries = await db.gradeBoundary.findMany({
    where: {
      schoolId,
      ...(subjectId && { subjectId }),
      minScore: { lte: percentage },
      maxScore: { gte: percentage }
    },
    orderBy: { gpaValue: 'desc' },
    take: 1
  });

  if (boundaries.length === 0) {
    return getDefaultGrade(percentage);
  }

  return {
    grade: boundaries[0].grade,
    gpa: boundaries[0].gpaValue
  };
}
```

**File Reference:** `lib/calculator.ts:1-340`

### 2. Class Rankings

Calculate student rankings with tie handling:

```typescript
// lib/calculator.ts
export function calculateRanks(
  results: ExamResult[]
): Array<ExamResult & { rank: number }> {
  const sorted = [...results]
    .filter(r => !r.isAbsent)
    .sort((a, b) => b.percentage - a.percentage);

  let currentRank = 1;
  let previousPercentage: number | null = null;

  return sorted.map((result, index) => {
    if (previousPercentage !== result.percentage) {
      currentRank = index + 1; // Skip tied positions
    }

    previousPercentage = result.percentage;

    return {
      ...result,
      rank: currentRank
    };
  });
}
```

### 3. Performance Analytics

**Available Statistics:**
- Class average and median
- Highest and lowest scores
- Pass/fail rate
- Grade distribution
- Standard deviation
- Quartile analysis
- Top performers
- Students needing attention

```typescript
// actions.ts
export async function getExamAnalytics(examId: string) {
  const results = await getExamResults(examId);
  const presentResults = results.filter(r => !r.isAbsent);

  const scores = presentResults.map(r => r.percentage);

  return {
    totalStudents: results.length,
    presentStudents: presentResults.length,
    absentStudents: results.filter(r => r.isAbsent).length,
    averageScore: mean(scores),
    medianScore: median(scores),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passRate: (presentResults.filter(r => r.passed).length / presentResults.length) * 100,
    standardDeviation: stdDev(scores),
    gradeDistribution: calculateGradeDistribution(presentResults),
    topPerformers: presentResults.slice(0, 10),
    needsAttention: presentResults.filter(r => !r.passed)
  };
}
```

**File Reference:** `actions.ts:1-426`

### 4. PDF Report Generation

Three customizable templates:

#### Classic Template
Traditional formal report card with school header:
- School logo and details
- Student information table
- Exam details
- Marks breakdown
- Letter grade and rank
- Footer with signature lines

**File Reference:** `lib/templates/classic.tsx:1-400`

#### Modern Template
Visual design with charts and colors:
- Progress bars for scores
- Doughnut chart for grade distribution
- Color-coded sections
- Modern typography
- Visual grade indicators

**File Reference:** `lib/templates/modern.tsx:1-380`

#### Minimal Template
Clean text-based layout:
- Simple black and white
- Table-based layout
- Easy to print
- Compact format

**File Reference:** `lib/templates/minimal.tsx:1-350`

**Usage:**
```typescript
import { generateStudentPDF } from './actions';

const pdf = await generateStudentPDF({
  examId: "exam-123",
  studentId: "stu-456",
  options: {
    template: 'modern',
    includeQuestionBreakdown: true,
    includeClassAnalytics: true,
    language: 'ar'
  }
});

// Returns: Buffer (PDF binary data)
```

**File Reference:** `lib/pdf-generator.ts:1-280`

---

## Server Actions

**File:** `actions.ts:1-426`

### Available Actions

- `getExamResults(examId, filters)` - Fetch all results
- `getStudentResult(examId, studentId)` - Single result
- `getExamAnalytics(examId)` - Calculate statistics
- `generateStudentPDF(examId, studentId, options)` - Create PDF
- `generateClassPDFs(examId, options)` - Batch PDF generation
- `exportResultsToCSV(examId)` - Export to CSV
- `calculateGrade(percentage, schoolId)` - Get letter grade
- `calculateClassRankings(examId)` - Compute ranks
- `getQuestionWiseAnalysis(examId)` - Per-question stats

---

## Utility Functions

**File:** `lib/calculator.ts:1-340` (20+ functions)

### Key Functions

```typescript
// Mark aggregation
export function calculateMarkSummation(results: ExamResult[]): number;

// Statistical calculations
export function calculateClassAverage(results: ExamResult[]): number;
export function calculateMedian(values: number[]): number;
export function calculateStandardDeviation(values: number[]): number;

// Grade distribution
export function calculateGradeDistribution(
  results: ExamResult[]
): Record<string, number>;

// Performance identification
export function identifyTopPerformers(
  results: ExamResult[],
  count: number
): ExamResult[];

export function identifyNeedsAttention(
  results: ExamResult[],
  threshold: number
): ExamResult[];

// GPA calculation
export function calculateGPA(percentage: number): number;

// Percentile calculation
export function calculatePercentile(score: number, allScores: number[]): number;
```

---

## Routes

- `/[lang]/results` - Results list (all completed exams)
- `/[lang]/results/[examId]` - Exam results detail
- `/[lang]/results/[examId]/student/[studentId]` - Individual result
- `/[lang]/results/analytics` - Performance analytics dashboard

---

## Configuration

**File:** `config.ts:1-168`

### PDF Settings

```typescript
export const PDF_CONFIG = {
  templates: ['classic', 'modern', 'minimal'],
  defaultTemplate: 'modern',
  pageSize: 'A4',
  fonts: {
    en: 'Inter',
    ar: 'Tajawal'
  },
  includeSchoolLogo: true,
  includeWatermark: false
};
```

### Grade Calculation

```typescript
export const GRADE_CONFIG = {
  passingGrade: 'D',
  passingPercentage: 60,
  honorRollThreshold: 90,  // A grade
  warningThreshold: 70     // Below C+
};
```

---

## Integration Points

### With Manage Block
- "View Results" button for completed exams
- Status updates trigger result generation

### With Mark Block
- Receives marks from grading system
- Triggers when all students graded

### With Platform
- Links to report cards
- Integrates with student profiles
- Feeds into performance trends

---

## Multi-Language PDF Support

### RTL (Arabic) Handling

```typescript
// lib/templates/modern.tsx
const styles = StyleSheet.create({
  page: {
    flexDirection: lang === 'ar' ? 'row-reverse' : 'row',
    fontFamily: lang === 'ar' ? 'Tajawal' : 'Inter',
    textAlign: lang === 'ar' ? 'right' : 'left'
  },
  text: {
    direction: lang === 'ar' ? 'rtl' : 'ltr'
  }
});

// Register Arabic font
Font.register({
  family: 'Tajawal',
  fonts: [
    { src: '/fonts/Tajawal-Regular.ttf' },
    { src: '/fonts/Tajawal-Bold.ttf', fontWeight: 'bold' }
  ]
});
```

---

## Performance Optimization

### Batch PDF Generation

```typescript
// Generate PDFs for entire class
export async function generateClassPDFs(
  examId: string,
  options: PDFOptions
) {
  const results = await getExamResults(examId);

  // Process in batches of 10
  const batchSize = 10;
  const batches = chunk(results, batchSize);

  for (const batch of batches) {
    await Promise.all(
      batch.map(result =>
        generateStudentPDF(examId, result.studentId, options)
      )
    );

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

### Caching

```typescript
// Cache analytics for 5 minutes
export async function getExamAnalytics(examId: string) {
  const cacheKey = `analytics:${examId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const analytics = await calculateAnalytics(examId);

  await redis.set(cacheKey, JSON.stringify(analytics), 'EX', 300);

  return analytics;
}
```

---

## Best Practices

### 1. Always Include SchoolId

```typescript
// ✅ CORRECT
const results = await db.examResult.findMany({
  where: {
    examId,
    schoolId
  }
});
```

### 2. Handle Absent Students

```typescript
// Exclude absent from averages
const presentResults = results.filter(r => !r.isAbsent);
const average = calculateAverage(presentResults.map(r => r.percentage));
```

### 3. Validate Grade Boundaries

```typescript
// Ensure no gaps in boundaries
function validateBoundaries(boundaries: GradeBoundary[]): boolean {
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (boundaries[i].minScore !== boundaries[i + 1].maxScore + 1) {
      return false;  // Gap detected
    }
  }
  return true;
}
```

---

## Related Documentation

- [Main Exam Block](../README.md)
- [Manage Block](../manage/README.md)
- [Mark Block](../mark/README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
