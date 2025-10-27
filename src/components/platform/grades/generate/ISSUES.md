# Known Issues & Solutions

> **Last Updated:** 2025-10-27

This document tracks known issues, bugs, workarounds, and technical debt in the Auto-Generate Exams feature.

## 🔴 Critical Issues

### 1. Hardcoded Subject Dropdown

**Status:** ⚠️ HIGH PRIORITY
**Severity:** Medium
**Affects:** `question-bank/form.tsx`, `templates/form.tsx`

**Problem:**
```typescript
// Lines 168-172 in question-bank/form.tsx
<SelectContent>
  {/* TODO: Fetch subjects from DB */}
  <SelectItem value="subject-1">Mathematics</SelectItem>
  <SelectItem value="subject-2">Science</SelectItem>
  <SelectItem value="subject-3">English</SelectItem>
</SelectContent>
```

**Impact:**
- Users cannot select their actual subjects
- Hard to test with real school data
- Subjects are not dynamic based on school

**Workaround:**
Use the hardcoded IDs: "subject-1", "subject-2", "subject-3"

**Solution:**
1. Create `getSubjects(schoolId)` server action in `actions.ts`:
   ```typescript
   export async function getSubjects(schoolId: string) {
     const subjects = await db.subject.findMany({
       where: { schoolId },
       select: { id: true, subjectName: true },
       orderBy: { subjectName: 'asc' }
     });
     return subjects;
   }
   ```

2. Update forms to fetch and display real subjects:
   ```typescript
   const [subjects, setSubjects] = useState<Subject[]>([]);

   useEffect(() => {
     getSubjects(schoolId).then(setSubjects);
   }, [schoolId]);

   // In render:
   {subjects.map(subject => (
     <SelectItem value={subject.id}>{subject.subjectName}</SelectItem>
   ))}
   ```

**Estimated Fix Time:** 30 minutes
**Assigned:** Not assigned

---

### 2. Incomplete Internationalization (i18n)

**Status:** ⏳ IN PROGRESS
**Severity:** Medium
**Affects:** 5 components

**Problem:**
40% of components still use hardcoded English text instead of dictionary references.

**Completed (60%):**
- ✅ `content.tsx` (landing page)
- ✅ `question-bank/form.tsx`
- ✅ `question-bank/table.tsx`
- ✅ `question-bank/content.tsx`

**Remaining (40%):**
- ⏳ `question-bank/columns.tsx` - Table headers, badges, actions
- ⏳ `templates/form.tsx` - Form labels and placeholders
- ⏳ `templates/columns.tsx` - Column headers
- ⏳ `templates/distribution-editor.tsx` - Matrix labels
- ⏳ `templates/content.tsx` - Page headers

**Impact:**
- Arabic users see English text in some components
- Inconsistent user experience across languages
- Cannot fully test RTL layout

**Solution:**
Update each component to use dictionary references:
```typescript
// Before
<FormLabel>Template Name</FormLabel>

// After
<FormLabel>{dict.templates?.form?.templateNameLabel || "Template Name"}</FormLabel>
```

**Estimated Fix Time:** 1-2 hours
**Progress:** 60% complete

---

## 🟡 Medium Priority Issues

### 3. TypeScript Errors in util.ts

**Status:** 📋 DOCUMENTED
**Severity:** Low (cosmetic)
**Affects:** `util.ts` lines 270-280, 353-355

**Problem:**
```typescript
// Error: 'QuestionType' cannot be used as a value
import type { QuestionType, DifficultyLevel } from '@prisma/client';

// Then used as value:
const questionTypeOrder = {
  [QuestionType.MULTIPLE_CHOICE]: 1,  // Error!
  [QuestionType.TRUE_FALSE]: 2,
  // ...
};
```

**Impact:**
- TypeScript compilation shows errors
- Does NOT affect runtime (enums are transpiled correctly)
- Clutters type checking output

**Workaround:**
Change `import type` to regular `import`:
```typescript
// Change from:
import type { QuestionType, DifficultyLevel } from '@prisma/client';

// To:
import { QuestionType, DifficultyLevel } from '@prisma/client';
```

**Solution:**
Apply workaround in `util.ts` at line 1.

**Estimated Fix Time:** 2 minutes
**Why Not Fixed:** Low priority, doesn't affect functionality

---

### 4. Missing Prisma Relations in content.tsx

**Status:** 📋 DOCUMENTED
**Severity:** Low
**Affects:** `question-bank/content.tsx`, `templates/content.tsx`

**Problem:**
```typescript
// Lines 60-72 in question-bank/content.tsx
include: {
  subject: {
    select: { id: true, subjectName: true },
  },
  analytics: {
    select: { timesUsed: true, successRate: true },
  },
}
```

**Error:**
```
Property 'subject' does not exist on type '{ ... QuestionBank }'
Property 'analytics' does not exist on type '{ ... QuestionBank }'
```

**Impact:**
- TypeScript errors during compilation
- Runtime works fine (Prisma generates types correctly)
- Type safety compromised in these files

**Root Cause:**
Prisma schema missing back-relations on Subject and QuestionAnalytics models.

**Solution:**
Run `pnpm prisma format` to auto-generate missing relations.

**Estimated Fix Time:** 1 minute
**Why Not Fixed:** Waiting for other Prisma changes to batch together

---

### 5. Input Type Mismatch in Forms

**Status:** 📋 DOCUMENTED
**Severity:** Low
**Affects:** `question-bank/form.tsx` lines 316, 340; `templates/form.tsx` lines 188, 209

**Problem:**
```typescript
<Input
  type="number"
  {...field}
  onChange={(e) => field.onChange(parseFloat(e.target.value))}
/>
// Type error: onChange signature mismatch
```

**Impact:**
- TypeScript errors
- Functionality works correctly
- Type safety issue

**Solution:**
Cast the onChange handler:
```typescript
onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
  field.onChange(parseFloat(e.target.value))
}
```

**Estimated Fix Time:** 5 minutes

---

## 🟢 Low Priority Issues

### 6. Modal Form Reloads Page on Submit

**Status:** ⚙️ BY DESIGN
**Severity:** Low (UX)
**Affects:** All forms

**Problem:**
```typescript
// Line 129 in question-bank/form.tsx
if (result.success) {
  SuccessToast("Question created!");
  closeModal();
  window.location.reload();  // Full page reload
}
```

**Impact:**
- Poor UX - entire page reloads
- Loses scroll position
- Slow on poor connections

**Better Approach:**
Use optimistic updates or SWR revalidation:
```typescript
if (result.success) {
  SuccessToast("Question created!");
  closeModal();
  mutate(); // SWR revalidation
  // or
  router.refresh(); // Next.js refresh
}
```

**Estimated Fix Time:** 15 minutes
**Why Not Fixed:** Works reliably, optimization can come later

---

### 7. No Loading States in Forms

**Status:** 💡 ENHANCEMENT
**Severity:** Low (UX)
**Affects:** All forms

**Problem:**
Forms show loading spinner on submit button but no skeleton loading when opening modal.

**Impact:**
- Users see empty form briefly on modal open
- Feels less polished

**Solution:**
Add skeleton loading:
```typescript
{isLoading ? <SkeletonForm /> : <QuestionBankForm />}
```

**Estimated Fix Time:** 30 minutes
**Priority:** Nice-to-have

---

### 8. Distribution Matrix Not Validated Client-Side

**Status:** 💡 ENHANCEMENT
**Severity:** Low
**Affects:** `templates/distribution-editor.tsx`

**Problem:**
Distribution validation only happens on server.

**Impact:**
- User fills in distribution
- Submits form
- Server returns error
- Poor UX

**Better Approach:**
Add real-time validation:
```typescript
const isValid = useMemo(() => {
  const total = calculateTotalQuestions(distribution);
  return total > 0 && total <= 100;
}, [distribution]);
```

**Estimated Fix Time:** 20 minutes
**Priority:** Nice-to-have

---

## 🔵 Technical Debt

### 9. Discriminated Union Type Issues

**Status:** 📋 DOCUMENTED
**Severity:** Low
**Affects:** `validation.ts` line 212

**Problem:**
```typescript
// Zod discriminated union doesn't have .partial() method
export const updateQuestionSchema = questionBankSchema.partial();
// Error: Property 'partial' does not exist
```

**Workaround:**
Define separate update schema:
```typescript
export const updateQuestionSchema = z.object({
  id: z.string(),
  // ... all fields optional
});
```

**Impact:**
- More boilerplate code
- Duplication between create/update schemas

**Estimated Fix Time:** 30 minutes
**Why Not Fixed:** Zod limitation, workaround acceptable

---

### 10. No Error Boundaries

**Status:** 💡 ENHANCEMENT
**Severity:** Low
**Affects:** All components

**Problem:**
No error boundaries wrap forms/tables. Errors crash entire page.

**Impact:**
- Poor error handling
- Bad UX on unexpected errors

**Solution:**
Wrap components in error boundaries:
```typescript
<ErrorBoundary fallback={<ErrorUI />}>
  <QuestionBankForm />
</ErrorBoundary>
```

**Estimated Fix Time:** 1 hour
**Priority:** Good-to-have

---

## 📊 Issue Summary

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | 1 in progress, 1 pending |
| 🟡 Medium | 4 | All documented |
| 🟢 Low | 4 | All documented/design |
| **Total** | **10** | **2 active, 8 documented** |

## 🎯 Recommended Fix Order

1. ⚠️ **Complete i18n** (60% → 100%) - 1-2 hours
2. ⚠️ **Fix subject dropdown** - 30 minutes
3. ✨ **Fix TypeScript errors** - 30 minutes
4. ✨ **Run prisma format** - 1 minute
5. 💡 **Add error boundaries** - 1 hour (optional)
6. 💡 **Optimize form reloads** - 15 minutes (optional)
7. 💡 **Add loading states** - 30 minutes (optional)
8. 💡 **Client-side validation** - 20 minutes (optional)

**Total Critical Work:** 1.5-2.5 hours
**Total Optional Work:** 2 hours

---

## 🔍 How to Report New Issues

1. Search this file to avoid duplicates
2. Add issue under appropriate severity section
3. Include:
   - **Status** (emoji + text)
   - **Severity** (Critical/Medium/Low)
   - **Affects** (files and line numbers)
   - **Problem** (description + code snippet)
   - **Impact** (who/what is affected)
   - **Workaround** (if available)
   - **Solution** (proposed fix + code)
   - **Estimated Fix Time**
4. Update issue summary table
5. Add to recommended fix order if critical

---

**Last Review:** 2025-10-27
**Next Review:** After completing critical fixes
