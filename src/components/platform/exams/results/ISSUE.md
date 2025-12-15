# Results Block - Issues & Troubleshooting

**Common issues and solutions for results and PDF generation**

Part of the [Exam Block System](../README.md) | [Results Block README](./README.md)

---

## Common Issues

### Issue: Letter Grade Doesn't Match Percentage

**Symptoms:**

- Student scores 92%
- Shows grade "B" instead of "A"

**Root Cause:** Grade boundaries not configured or incorrect

**Solution:** Configure grade boundaries

```sql
-- Insert grade boundaries
INSERT INTO grade_boundary (school_id, grade, min_score, max_score, gpa_value)
VALUES
  ('school-id', 'A+', 95, 100, 4.0),
  ('school-id', 'A', 90, 94, 3.7),
  ('school-id', 'B+', 85, 89, 3.3);
```

---

### Issue: PDF Generation Fails

**Symptoms:**

- Click "Download PDF"
- Error: "Failed to generate PDF"

**Common Causes:**

1. **Invalid data in template**

```typescript
// ❌ BAD - Undefined data
<Text>{student.name}</Text>

// ✅ GOOD - Safe access
<Text>{student?.name || 'N/A'}</Text>
```

2. **Using HTML elements in PDF**

```typescript
// ❌ BAD - div not allowed
<View>
  <div>Content</div>
</View>

// ✅ GOOD - Use PDF components
<View>
  <Text>Content</Text>
</View>
```

**File Reference:** `lib/pdf-generator.ts:1-280`, `lib/templates/*.tsx`

---

### Issue: Class Rankings Incorrect with Ties

**Symptoms:**

- Two students both score 85%
- Ranks show 1, 3 (skipping 2)

**Expected:** Both should be rank 1, next is rank 3 (correct!)

**Explanation:** This is correct tie-handling behavior. Rankings skip positions after ties.

**Example:**

- Score 95%: Rank 1
- Score 95%: Rank 1 (tied)
- Score 92%: Rank 3 (not 2)

---

### Issue: Average Score Shows >100%

**Symptoms:**

- Class average shows 120%
- Mathematically impossible

**Root Cause:** Including absent students or calculation error

**Solution:**

```typescript
// ✅ CORRECT - Exclude absent
const presentResults = results.filter((r) => !r.isAbsent)
const average =
  presentResults.reduce((sum, r) => sum + r.percentage, 0) /
  presentResults.length
```

---

### Issue: PDF Shows Wrong Language

**Symptoms:**

- Request Arabic PDF
- Shows English text

**Solution:** Pass language parameter

```typescript
const pdf = await generateStudentPDF(examId, studentId, {
  template: "modern",
  language: "ar", // ✅ Specify language
})
```

---

### Issue: PDF Arabic Text Appears Disconnected

**Symptoms:**

- Arabic letters show separately: "م ح م د"
- Should be connected: "محمد"

**Root Cause:** Font doesn't support Arabic ligatures

**Solution:** Use proper Arabic font

```typescript
// lib/templates/modern.tsx
Font.register({
  family: "Tajawal", // ✅ Supports Arabic properly
  src: "/fonts/Tajawal-Regular.ttf",
})
```

---

## Known Limitations

1. **Single Template Per PDF**
   - Cannot mix templates in one document
   - Workaround: Generate multiple PDFs

2. **Large Class PDF Generation Slow**
   - Generating 200+ PDFs takes minutes
   - Workaround: Use batch processing with delays

3. **No Custom Grade Boundaries Per Subject**
   - Same grading scale for all subjects in school
   - Workaround: Use subject-specific boundaries (requires schema update)

4. **PDF Size Limit**
   - Max 500 students per export
   - Workaround: Export by sections/classes

---

## FAQ

**Q: Can students download their own PDFs?**
A: Yes, configure permissions in auth system.

**Q: How do I change the grading scale?**
A: Update `GradeBoundary` records in database.

**Q: Can I include school logo in PDF?**
A: Yes, set `includeSchoolLogo: true` in config and provide logo URL.

**Q: How do I export all results to CSV?**
A: Use `exportResultsToCSV(examId)` action.

---

**Last Updated:** 2025-10-27
**Version:** 2.0
