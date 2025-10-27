# Manage Block - Issues & Troubleshooting

**Common issues, known limitations, and troubleshooting for exam management**

Part of the [Exam Block System](../README.md) | [Manage Block README](./README.md)

---

## Table of Contents

1. [Form Issues](#form-issues)
2. [Scheduling Issues](#scheduling-issues)
3. [Marks Entry Issues](#marks-entry-issues)
4. [Calendar Issues](#calendar-issues)
5. [Performance Issues](#performance-issues)
6. [Known Limitations](#known-limitations)
7. [Future Enhancements](#future-enhancements)

---

## Form Issues

### Issue: Multi-Step Form State Lost on Refresh

**Symptoms:**
- User fills Step 1, refreshes page
- All form data is lost
- Must start over from beginning

**Root Cause:** Form state not persisted

**Solution:** Add form state persistence

```typescript
// form.tsx - Add session storage
import { useEffect } from 'react';

export function ExamForm() {
  const form = useForm({
    defaultValues: getInitialValues()
  });

  // Save to session storage on change
  useEffect(() => {
    const subscription = form.watch((values) => {
      sessionStorage.setItem('exam-form-draft', JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return // ... form JSX
}

function getInitialValues() {
  const draft = sessionStorage.getItem('exam-form-draft');
  return draft ? JSON.parse(draft) : defaultValues;
}
```

**Workaround:** Complete form in one sitting without refreshing

---

### Issue: Subject Dropdown Empty After Selecting Class

**Symptoms:**
- User selects a class
- Subject dropdown remains empty
- Expected: Subjects filtered by selected class

**Root Cause:** Missing relation or incorrect filtering

**Debugging:**
```typescript
// Check class-subject relationship
const class = await db.class.findUnique({
  where: { id: classId },
  include: {
    subjects: true  // Are subjects linked?
  }
});

console.log('Subjects for class:', class.subjects);
```

**Solution:** Ensure class-subject relations exist

```sql
-- Check database
SELECT c.name as class_name, s.subject_name
FROM class c
LEFT JOIN subject s ON s.class_id = c.id
WHERE c.id = 'class-id';
```

If no subjects found:
1. Subjects must be assigned to classes
2. Check `Subject` model has `classId` field
3. Update subject assignment in admin panel

---

### Issue: Validation Error Not Displayed

**Symptoms:**
- Form submission fails silently
- No error message shown to user
- Console shows validation error

**Root Cause:** Error not properly mapped to form field

**Solution:** Check error path in Zod schema

```typescript
// validation.ts
export const examSchema = z.object({
  // ...
  passingMarks: z.number()
}).refine(
  (data) => data.passingMarks <= data.totalMarks,
  {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"]  // ✅ Must match form field name
  }
);

// form.tsx
<FormField
  name="passingMarks"  // ✅ Must match path
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />  {/* ✅ Shows error */}
    </FormItem>
  )}
/>
```

---

### Issue: Date Picker Shows Past Dates

**Symptoms:**
- User can select dates in the past
- Exam created with past date
- Validation should prevent this

**Solution:** Add date restriction

```typescript
// schedule-marks.tsx
<DatePicker
  value={field.value}
  onChange={field.onChange}
  minDate={new Date()}  // ✅ Disable past dates
  disabled={(date) => date < new Date()}
/>

// Validation (double-check on server)
export const examSchema = z.object({
  examDate: z.date().min(new Date(), {
    message: "Exam date must be in the future"
  })
});
```

---

## Scheduling Issues

### Issue: Time Conflict Not Detected

**Symptoms:**
- Two exams scheduled for same class at same time
- No warning shown during creation
- Causes student confusion

**Root Cause:** Missing conflict detection

**Solution:** Implement conflict check

```typescript
// actions.ts
export async function createExam(data: ExamFormData) {
  "use server";

  const { schoolId } = await getTenantContext();

  // Check for conflicts
  const conflict = await db.exam.findFirst({
    where: {
      schoolId,
      classId: data.classId,
      examDate: data.examDate,
      status: { not: 'CANCELLED' },
      OR: [
        {
          // New exam starts during existing exam
          startTime: { lte: data.startTime },
          endTime: { gt: data.startTime }
        },
        {
          // New exam ends during existing exam
          startTime: { lt: data.endTime },
          endTime: { gte: data.endTime }
        },
        {
          // New exam contains existing exam
          startTime: { gte: data.startTime },
          endTime: { lte: data.endTime }
        }
      ]
    },
    include: {
      subject: { select: { subjectName: true } }
    }
  });

  if (conflict) {
    return {
      success: false,
      error: `Conflict with ${conflict.subject.subjectName} exam (${conflict.startTime} - ${conflict.endTime})`
    };
  }

  // Create exam...
}
```

**File Reference:** `actions.ts:1-522`

---

### Issue: Duration Calculation Shows Negative Value

**Symptoms:**
- User enters start time: "14:00", end time: "11:00"
- Duration shows -180 minutes
- Should show validation error

**Root Cause:** End time before start time not validated

**Solution:** Add time validation

```typescript
// validation.ts
export const examSchema = z.object({
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return end > start;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);
```

**File Reference:** `validation.ts:1-83`

---

### Issue: Exam Time Not Showing in Correct Timezone

**Symptoms:**
- User schedules exam for 9:00 AM
- System shows 2:00 AM in database
- Different timezone than school location

**Root Cause:** Timezone not handled correctly

**Solution:** Store times as strings (local time), not UTC

```typescript
// Store as local time strings
const exam = await db.exam.create({
  data: {
    examDate: new Date("2025-03-15"),  // Date only, no time
    startTime: "09:00",  // Local time string
    endTime: "11:00",    // Local time string
    schoolId
  }
});

// Display with school timezone
import { formatInTimeZone } from 'date-fns-tz';

const displayTime = formatInTimeZone(
  exam.examDate,
  school.timezone || 'UTC',
  'MMM dd, yyyy'
);
```

---

## Marks Entry Issues

### Issue: Marks Greater Than Total Marks Accepted

**Symptoms:**
- Teacher enters 120 marks for 100-mark exam
- System accepts the invalid value
- Results show >100% percentage

**Root Cause:** Validation not enforcing max marks

**Solution:** Add max marks validation

```typescript
// marks-entry-form.tsx
<Input
  type="number"
  min={0}
  max={exam.totalMarks}  // ✅ Client-side limit
  {...field}
/>

// Server-side validation
export const marksEntrySchema = z.object({
  examId: z.string(),
  marks: z.array(z.object({
    studentId: z.string(),
    marksObtained: z.number()
  }))
}).superRefine(async (data, ctx) => {
  const exam = await db.exam.findUnique({
    where: { id: data.examId },
    select: { totalMarks: true }
  });

  data.marks.forEach((mark, index) => {
    if (!mark.isAbsent && mark.marksObtained > exam.totalMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Marks cannot exceed ${exam.totalMarks}`,
        path: ['marks', index, 'marksObtained']
      });
    }
  });
});
```

**File Reference:** `marks-entry-form.tsx:1-259`

---

### Issue: Student Missing from Marks Entry Roster

**Symptoms:**
- Class has 30 students
- Marks entry form only shows 28
- Two students missing from list

**Root Cause:** Students not enrolled in class or query error

**Debugging:**
```typescript
// Check class enrollment
const studentsInClass = await db.studentClass.findMany({
  where: {
    classId: exam.classId,
    schoolId
  },
  include: {
    student: true
  }
});

console.log(`Students enrolled: ${studentsInClass.length}`);
```

**Solutions:**

1. **Missing enrollment:** Enroll students in class
```sql
INSERT INTO student_class (student_id, class_id, school_id)
VALUES ('student-id', 'class-id', 'school-id');
```

2. **Query includes inactive students:**
```typescript
const students = await db.studentClass.findMany({
  where: {
    classId: exam.classId,
    schoolId,
    student: {
      status: 'ACTIVE'  // ✅ Only active students
    }
  }
});
```

---

### Issue: Grade Not Auto-Calculating

**Symptoms:**
- Marks entered, percentage calculated
- Letter grade remains empty
- Expected: Auto-assign based on boundaries

**Root Cause:** Grade boundaries not configured

**Solution:** Configure grade boundaries

```sql
-- Insert grade boundaries for school
INSERT INTO grade_boundary (school_id, grade, min_score, max_score, gpa_value)
VALUES
  ('school-id', 'A+', 95, 100, 4.0),
  ('school-id', 'A', 90, 94, 3.7),
  ('school-id', 'B+', 85, 89, 3.3),
  ('school-id', 'B', 80, 84, 3.0),
  ('school-id', 'C+', 75, 79, 2.7),
  ('school-id', 'C', 70, 74, 2.0),
  ('school-id', 'D', 60, 69, 1.0),
  ('school-id', 'F', 0, 59, 0.0);
```

Then update calculation logic:
```typescript
// utils.ts
export async function calculateGrade(
  percentage: number,
  schoolId: string
): Promise<string> {
  const boundary = await db.gradeBoundary.findFirst({
    where: {
      schoolId,
      minScore: { lte: percentage },
      maxScore: { gte: percentage }
    }
  });

  return boundary?.grade || 'N/A';
}
```

---

## Calendar Issues

### Issue: Calendar View Loads Slowly

**Symptoms:**
- Calendar takes 5+ seconds to load
- Browser becomes unresponsive
- Many exams in date range

**Root Cause:** Loading too much data at once

**Solution:** Paginate and optimize query

```typescript
// actions.ts
export async function getExamsForCalendar(
  startDate: Date,
  endDate: Date
) {
  "use server";

  const { schoolId } = await getTenantContext();

  // Limit date range to 3 months max
  const maxDays = 90;
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff > maxDays) {
    throw new Error(`Date range too large. Maximum ${maxDays} days allowed.`);
  }

  return await db.exam.findMany({
    where: {
      schoolId,
      examDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      title: true,
      examDate: true,
      startTime: true,
      endTime: true,
      examType: true,
      status: true,
      class: { select: { name: true } }
    },
    orderBy: { examDate: 'asc' }
  });
}
```

**File Reference:** `calendar.tsx:1-430`

---

### Issue: Drag-and-Drop Rescheduling Not Working

**Symptoms:**
- User drags exam to new date
- Exam snaps back to original date
- No error shown

**Status:** Not yet implemented (planned feature)

**Workaround:** Use edit form to change exam date

**Implementation (Future):**
```typescript
// calendar.tsx
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

function CalendarEvent({ exam }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: exam.id
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {exam.title}
    </div>
  );
}

function onDragEnd(event) {
  const { active, over } = event;
  if (over) {
    updateExamDate(active.id, over.id);  // Update exam date
  }
}
```

---

## Performance Issues

### Issue: Exam List Loads Slowly (>3 seconds)

**Symptoms:**
- Table shows loading spinner for 3+ seconds
- Many exams in database
- Query returns 500+ records

**Solution 1: Add Pagination**

```typescript
// content.tsx
export default async function ManageContent({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where: { schoolId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { examDate: 'desc' }
    }),
    db.exam.count({ where: { schoolId } })
  ]);

  return (
    <ExamTable
      data={exams}
      total={total}
      page={page}
      pageSize={pageSize}
    />
  );
}
```

**Solution 2: Optimize Query**

```typescript
// ❌ Slow - Fetches everything
const exams = await db.exam.findMany({
  where: { schoolId },
  include: {
    class: true,
    subject: true,
    examResults: true
  }
});

// ✅ Fast - Select only needed fields
const exams = await db.exam.findMany({
  where: { schoolId },
  select: {
    id: true,
    title: true,
    examDate: true,
    startTime: true,
    endTime: true,
    totalMarks: true,
    status: true,
    class: { select: { name: true } },
    subject: { select: { subjectName: true } },
    _count: { select: { examResults: true } }
  }
});
```

**Solution 3: Add Indexes**

```prisma
model Exam {
  // ...
  @@index([schoolId, examDate(sort: Desc)])
  @@index([schoolId, status])
  @@index([schoolId, classId])
}
```

---

### Issue: Analytics Dashboard Times Out

**Symptoms:**
- Analytics page loads forever
- Eventually times out (504 error)
- Exam has 200+ students

**Root Cause:** Complex calculations not optimized

**Solution:** Use database aggregations

```typescript
// ❌ Slow - Calculate in app
const results = await db.examResult.findMany({
  where: { examId, schoolId }
});
const average = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

// ✅ Fast - Calculate in database
const stats = await db.examResult.aggregate({
  where: { examId, schoolId, isAbsent: false },
  _avg: { percentage: true },
  _max: { percentage: true },
  _min: { percentage: true },
  _count: true
});
```

**File Reference:** `analytics-dashboard.tsx:1-226`

---

## Known Limitations

### Current Limitations (v2.0)

1. **No Recurring Exams**
   - Cannot schedule weekly quizzes automatically
   - Must create each exam individually
   - **Workaround:** Use bulk create (future) or API script

2. **No Exam Templates**
   - Cannot save exam as template for reuse
   - Must re-enter all details each time
   - **Workaround:** Clone exam feature (future)

3. **Limited Conflict Detection**
   - Only checks same class conflicts
   - Doesn't check teacher availability
   - Doesn't check room availability
   - **Workaround:** Manual coordination

4. **No Automatic Status Updates**
   - Status must be manually changed
   - No auto-transition to IN_PROGRESS at exam time
   - **Workaround:** Manual status management

5. **Single Grade Boundary Set**
   - Same grading scale for all subjects
   - Cannot have different scales per subject
   - **Workaround:** Store subject-specific boundaries (requires schema update)

6. **No Partial Marks**
   - Marks must be integers
   - Cannot give half marks (e.g., 7.5)
   - **Workaround:** Use decimal in database (schema change needed)

7. **No Offline Mode**
   - Requires internet connection
   - Cannot enter marks offline
   - **Workaround:** Use service worker caching (future)

---

## Future Enhancements

### Planned Features

#### 1. Exam Templates (Priority: High)
```typescript
// Save exam as template
export async function saveAsTemplate(examId: string, name: string) {
  const exam = await db.exam.findUnique({
    where: { id: examId, schoolId }
  });

  return await db.examTemplate.create({
    data: {
      name,
      schoolId,
      examType: exam.examType,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      instructions: exam.instructions
    }
  });
}

// Create exam from template
export async function createFromTemplate(templateId: string, data: Partial<ExamFormData>) {
  const template = await db.examTemplate.findUnique({
    where: { id: templateId, schoolId }
  });

  return await createExam({
    ...template,
    ...data
  });
}
```

#### 2. Bulk Exam Creation (Priority: High)
```typescript
// Create exams for multiple classes at once
export async function bulkCreateExams(
  examData: Omit<ExamFormData, 'classId'>,
  classIds: string[]
) {
  const exams = await Promise.all(
    classIds.map(classId =>
      createExam({
        ...examData,
        classId
      })
    )
  );

  return exams;
}
```

#### 3. Exam Clone Feature (Priority: Medium)
```typescript
export async function cloneExam(examId: string, newClassId: string) {
  const original = await db.exam.findUnique({
    where: { id: examId, schoolId }
  });

  return await db.exam.create({
    data: {
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      classId: newClassId,
      status: 'PLANNED'
    }
  });
}
```

#### 4. Automatic Status Updates (Priority: Medium)
```typescript
// Cron job to auto-update exam status
export async function updateExamStatuses() {
  const now = new Date();

  // Start exams
  await db.exam.updateMany({
    where: {
      status: 'PLANNED',
      examDate: { lte: now }
    },
    data: { status: 'IN_PROGRESS' }
  });

  // Complete exams
  await db.exam.updateMany({
    where: {
      status: 'IN_PROGRESS',
      // endTime passed
    },
    data: { status: 'COMPLETED' }
  });
}
```

#### 5. Advanced Conflict Detection (Priority: Low)
- Check teacher availability
- Check room availability
- Check student conflicts (multiple exams same day)
- Suggest alternative times

#### 6. Partial Marks Support (Priority: Low)
```prisma
model ExamResult {
  marksObtained Decimal @db.Decimal(5, 2)  // Change from Int
}
```

#### 7. Offline Mode (Priority: Low)
- Service worker caching
- IndexedDB for local storage
- Sync when connection restored

---

## FAQ

**Q: Why can't I delete an exam that has marks entered?**
A: To protect data integrity. Archive instead of delete, or remove all marks first.

**Q: Can teachers create exams for other teachers' subjects?**
A: No, by design. Teachers can only create exams for their assigned subjects. Admins can create for any subject.

**Q: How do I change the grading scale?**
A: Update `GradeBoundary` records in database for your school.

**Q: Can I have different total marks for different students?**
A: No, all students in an exam have same total marks. Create separate exams if needed.

**Q: Why doesn't the calendar show drag-and-drop?**
A: Feature not yet implemented. Use edit form to reschedule exams.

---

## Getting Help

If you encounter issues not covered here:

1. **Check Main ISSUE.md:** Many issues are system-wide: [../ISSUE.md](../ISSUE.md)
2. **Check Server Logs:** `vercel logs` or check Vercel dashboard
3. **Enable Debug Mode:** Set `DEBUG=prisma:query` to see database queries
4. **Test in Isolation:** Create minimal reproduction case
5. **Check Related Docs:**
   - [Manage Block README](./README.md)
   - [Main Exam README](../README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
