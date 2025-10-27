# Auto-Marking System - Troubleshooting Guide

This guide helps resolve common issues with the auto-marking system.

## Table of Contents

- [OpenAI API Issues](#openai-api-issues)
- [OCR Problems](#ocr-problems)
- [AI Grading Inconsistencies](#ai-grading-inconsistencies)
- [Database Errors](#database-errors)
- [Performance Issues](#performance-issues)
- [Multi-Tenant Issues](#multi-tenant-issues)
- [Form Validation Errors](#form-validation-errors)
- [Component Rendering Issues](#component-rendering-issues)
- [Rate Limiting Problems](#rate-limiting-problems)
- [Debugging Tips](#debugging-tips)

---

## OpenAI API Issues

### Error: "Invalid API Key"

**Symptoms:**
- AI grading fails with authentication error
- OCR processing returns 401 errors

**Solutions:**
1. Check your `.env.local` file has valid `OPENAI_API_KEY`:
   ```bash
   # Verify the key exists and is not empty
   cat .env.local | grep OPENAI_API_KEY
   ```

2. Verify API key on OpenAI platform:
   - Visit https://platform.openai.com/api-keys
   - Ensure key has not been revoked
   - Check key has sufficient permissions

3. Restart development server after updating:
   ```bash
   pnpm dev
   ```

### Error: "Rate Limit Exceeded" (429)

**Symptoms:**
- AI grading fails with "Too many requests"
- Error message: "You exceeded your current quota"

**Solutions:**
1. Check your OpenAI usage and billing:
   - Visit https://platform.openai.com/usage
   - Verify you have available credits

2. The rate limiter should handle this automatically with exponential backoff
   - Default: 5 concurrent requests, exponential backoff on 429 errors
   - Check rate limiter stats:
   ```typescript
   const stats = aiRateLimiter.getStats()
   console.log('Queue length:', stats.queueLength)
   console.log('Active requests:', stats.activeRequests)
   ```

3. Reduce concurrent requests in rate limiter:
   ```typescript
   // In src/lib/ai/rate-limiter.ts
   const customLimiter = new AIRateLimiter({
     maxConcurrent: 3, // Reduce from 5 to 3
     minDelay: 2000,   // Increase delay to 2s
   })
   ```

### Error: "Model Not Found" or "Invalid Model"

**Symptoms:**
- Grading fails with "The model 'gpt-4' does not exist"

**Solutions:**
1. Check your OpenAI account has access to GPT-4:
   - Visit https://platform.openai.com/account/limits
   - Verify GPT-4 access

2. Fallback to GPT-3.5 if needed:
   ```typescript
   // In src/lib/ai/openai.ts
   const response = await openai.chat.completions.create({
     model: "gpt-3.5-turbo", // Change from gpt-4
     // ...
   })
   ```

---

## OCR Problems

### Issue: Low OCR Confidence Scores

**Symptoms:**
- OCR extracts text but confidence is below 70%
- `needsReview` flag is set to true
- Manual review required frequently

**Solutions:**
1. **Improve scan quality:**
   - Use 300+ DPI for scans
   - Ensure good lighting and contrast
   - Avoid shadows or glare on paper
   - Use black ink on white paper

2. **Image preprocessing:**
   - Convert to grayscale
   - Increase contrast
   - Remove background noise
   - Straighten skewed images

3. **Handwriting guidelines for students:**
   - Write clearly and legibly
   - Use print letters (not cursive)
   - Leave space between words
   - Use dark pen or pencil

### Issue: OCR Returns Empty Text

**Symptoms:**
- `extractedText` is null or empty string
- Confidence score is 0

**Solutions:**
1. **Check image accessibility:**
   ```typescript
   // Verify imageUrl is accessible
   const response = await fetch(imageUrl)
   if (!response.ok) {
     console.error('Image not accessible:', imageUrl)
   }
   ```

2. **Verify image format:**
   - Supported: JPEG, PNG, WebP
   - Max size: 10MB (configurable via `NEXT_PUBLIC_MAX_UPLOAD_SIZE`)

3. **Check GPT-4 Vision availability:**
   - Ensure your API key has access to `gpt-4-vision-preview`
   - Check OpenAI platform for model availability

### Issue: Wrong Text Extracted

**Symptoms:**
- OCR extracts incorrect or garbled text
- Numbers confused with letters (0 vs O, 1 vs l)

**Solutions:**
1. **Provide context to OCR:**
   ```typescript
   await processOCRWithAI({
     imageUrl,
     questionText: "What is 2+2?", // Helps AI understand expected format
     expectedFormat: "number"       // Guides extraction
   })
   ```

2. **Use sample answers:**
   - Include expected answer patterns in question bank
   - AI uses these as reference for OCR interpretation

3. **Manual review workflow:**
   - Set higher confidence threshold (e.g., 0.85) for auto-accept
   - Review low-confidence extractions manually

---

## AI Grading Inconsistencies

### Issue: AI Gives Different Scores for Same Answer

**Symptoms:**
- Same student answer gets different scores on re-grading
- Scores vary by ±10-20%

**Solutions:**
1. **Use rubrics for consistency:**
   ```typescript
   // Always create detailed rubrics for essays
   await createRubric({
     questionId,
     title: "Essay Rubric",
     criteria: [
       { criterion: "Thesis clarity", maxPoints: 5, description: "Clear, focused thesis statement" },
       { criterion: "Evidence", maxPoints: 10, description: "3+ relevant examples with citations" },
       // ...
     ]
   })
   ```

2. **Provide sample answers:**
   ```typescript
   // In question creation
   await createQuestion({
     // ...
     sampleAnswer: "Detailed example of excellent answer with key points..."
   })
   ```

3. **Set temperature to 0 for consistency:**
   ```typescript
   // In src/lib/ai/openai.ts
   const response = await openai.chat.completions.create({
     model: "gpt-4",
     temperature: 0, // Deterministic output
     // ...
   })
   ```

4. **Review low-confidence grades:**
   - Grades with `aiConfidence < 0.65` should be manually reviewed
   - Use `needsReview` flag to filter review queue

### Issue: AI Too Lenient or Too Strict

**Symptoms:**
- Average scores unusually high (>90%) or low (<50%)
- AI doesn't catch obvious errors
- AI penalizes minor issues too harshly

**Solutions:**
1. **Calibrate with sample grading:**
   - Grade 10-20 answers manually first
   - Compare AI scores with manual scores
   - Adjust rubrics based on discrepancies

2. **Refine rubric descriptions:**
   ```typescript
   // VAGUE (inconsistent grading)
   { criterion: "Good writing", maxPoints: 10 }

   // SPECIFIC (consistent grading)
   {
     criterion: "Grammar and mechanics",
     maxPoints: 10,
     description: "0-2 errors = 10pts, 3-5 errors = 7pts, 6-10 errors = 4pts, 10+ errors = 0pts"
   }
   ```

3. **Adjust confidence thresholds:**
   ```typescript
   // In config.ts
   AI_CONFIDENCE = {
     HIGH: 0.90,   // Increase from 0.85 for stricter auto-accept
     MEDIUM: 0.70, // Increase from 0.65
     LOW: 0.50,    // Increase from 0.40
   }
   ```

---

## Database Errors

### Error: "schoolId is required"

**Symptoms:**
- Queries fail with missing schoolId
- "WHERE clause is missing schoolId" error

**Solutions:**
1. **Always include schoolId in queries:**
   ```typescript
   // ❌ WRONG
   await db.questionBank.findMany()

   // ✅ CORRECT
   const session = await auth()
   const schoolId = session?.user?.schoolId
   await db.questionBank.findMany({ where: { schoolId } })
   ```

2. **Verify session includes schoolId:**
   ```typescript
   const session = await auth()
   if (!session?.user?.schoolId) {
     throw new Error('User session missing schoolId')
   }
   ```

### Error: "Prisma Client Not Generated"

**Symptoms:**
- TypeScript errors about missing Prisma types
- Import errors for `@prisma/client`

**Solutions:**
1. **Regenerate Prisma client:**
   ```bash
   pnpm prisma generate
   ```

2. **Run after schema changes:**
   ```bash
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

### Error: "Slow Queries" / "Timeout"

**Symptoms:**
- Page loads take >5 seconds
- Database queries timing out

**Solutions:**
1. **Check indexes are applied:**
   ```bash
   # Run migration to apply indexes
   pnpm prisma migrate deploy
   ```

2. **Use selective field fetching:**
   ```typescript
   // ❌ SLOW - Fetches all fields
   await db.questionBank.findMany({ where: { schoolId } })

   // ✅ FAST - Fetches only needed fields (70% reduction)
   await db.questionBank.findMany({
     where: { schoolId },
     select: {
       id: true,
       questionText: true,
       questionType: true,
       difficulty: true,
       points: true,
       subject: { select: { subjectName: true } }
     }
   })
   ```

3. **Add pagination:**
   ```typescript
   await db.studentAnswer.findMany({
     where: { schoolId, examId },
     take: 100, // Limit to 100 results
     skip: page * 100,
   })
   ```

4. **Verify indexes exist:**
   ```bash
   # Check database indexes
   psql $DATABASE_URL -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"
   ```

---

## Performance Issues

### Issue: Bulk Grading Too Slow

**Symptoms:**
- Grading 100 submissions takes >10 minutes
- Browser becomes unresponsive

**Solutions:**
1. **Use rate limiter batch method:**
   ```typescript
   // ❌ SLOW - Sequential processing
   for (const answer of answers) {
     await aiGradeAnswer(answer.id)
   }

   // ✅ FAST - Parallel with rate limiting
   await aiRateLimiter.batch(
     answers.map(answer => ({
       data: answer,
       execute: (data) => aiGradeAnswer(data.id)
     })),
     1 // Priority
   )
   ```

2. **Monitor rate limiter stats:**
   ```typescript
   const stats = aiRateLimiter.getStats()
   console.log('Total requests:', stats.totalRequests)
   console.log('Total cost:', stats.totalCost)
   console.log('Avg cost:', stats.averageCostPerRequest)
   ```

3. **Increase batch delay for stability:**
   ```typescript
   const limiter = new AIRateLimiter({
     maxConcurrent: 5,
     minDelay: 2000, // 2s between batches (increase from 1s)
   })
   ```

### Issue: High OpenAI Costs

**Symptoms:**
- Monthly bill exceeds budget
- Unexpected charges

**Solutions:**
1. **Track costs with rate limiter:**
   ```typescript
   // After each grading operation
   const stats = aiRateLimiter.getStats()
   console.log(`Total cost so far: $${stats.totalCost}`)

   if (stats.totalCost > 50) {
     console.warn('Daily cost limit exceeded!')
   }
   ```

2. **Use caching for repeated answers:**
   - Cache AI responses for identical answers
   - Store in Redis or database

3. **Prefer auto-grading over AI:**
   - Use MCQ, T/F, Fill-in-Blank where possible
   - Only use AI for short answer and essays

4. **Set budget alerts:**
   - Configure OpenAI billing alerts
   - Monitor via https://platform.openai.com/usage

---

## Multi-Tenant Issues

### Issue: Seeing Other Schools' Data

**Symptoms:**
- Questions from other schools appear in list
- Student data from wrong school

**Solutions:**
1. **Verify all queries include schoolId:**
   ```typescript
   // Check all actions.ts files
   grep -r "db\\.questionBank\\.findMany" src/components/platform/mark/
   # Ensure all have: where: { schoolId }
   ```

2. **Check session schoolId:**
   ```typescript
   const session = await auth()
   console.log('User schoolId:', session?.user?.schoolId)
   console.log('User role:', session?.user?.role)
   ```

3. **Audit database queries:**
   - All business models should have `@@index([schoolId])`
   - All unique constraints should include `schoolId`

### Issue: "Unauthorized" Errors

**Symptoms:**
- User can't access marking features
- "You don't have permission" errors

**Solutions:**
1. **Check user role:**
   ```typescript
   const session = await auth()
   if (!['ADMIN', 'TEACHER'].includes(session?.user?.role)) {
     return { error: 'Unauthorized' }
   }
   ```

2. **Verify session is valid:**
   ```bash
   # Check auth configuration
   cat src/auth.ts | grep -A 10 "jwt:"
   ```

---

## Form Validation Errors

### Issue: Form Submission Fails Silently

**Symptoms:**
- Submit button doesn't do anything
- No error message shown

**Solutions:**
1. **Check Zod schema validation:**
   ```typescript
   // In validation.ts
   export const createQuestionSchema = z.object({
     questionText: z.string().min(1, "Question text is required"),
     // ...
   })

   // In form.tsx
   const form = useForm({
     resolver: zodResolver(createQuestionSchema),
     mode: "onBlur", // Validate on blur
   })
   ```

2. **Display validation errors:**
   ```tsx
   {form.formState.errors.questionText && (
     <p className="text-xs text-destructive mt-1">
       {form.formState.errors.questionText.message}
     </p>
   )}
   ```

3. **Log form data on submit:**
   ```typescript
   const handleSubmit = async (data: any) => {
     console.log('Form data:', data)
     console.log('Form errors:', form.formState.errors)
     // ...
   }
   ```

### Issue: Options Not Saving

**Symptoms:**
- MCQ options disappear after submit
- "At least 2 options required" error

**Solutions:**
1. **Verify options state:**
   ```typescript
   const [options, setOptions] = useState([
     { text: "", isCorrect: false },
     { text: "", isCorrect: false },
   ])

   // Before submit
   console.log('Options:', options)
   console.log('Has correct answer:', options.some(o => o.isCorrect))
   ```

2. **Check FormData serialization:**
   ```typescript
   const formData = new FormData()
   formData.append('options', JSON.stringify(options))

   // In server action
   const parsed = JSON.parse(formData.get('options') as string)
   console.log('Parsed options:', parsed)
   ```

---

## Component Rendering Issues

### Issue: Components Not Updating After Data Change

**Symptoms:**
- Question list doesn't refresh after create/edit
- Stale data displayed

**Solutions:**
1. **Ensure revalidatePath is called:**
   ```typescript
   // In actions.ts
   export async function createQuestion(data: FormData) {
     // ... create logic
     revalidatePath('/mark/questions') // Must call this
     return { success: true }
   }
   ```

2. **Use router.refresh():**
   ```typescript
   // In client component
   const router = useRouter()

   const handleCreate = async (data) => {
     const result = await createQuestion(data)
     if (result.success) {
       router.refresh() // Force page refresh
       router.push(`/${locale}/mark/questions`)
     }
   }
   ```

### Issue: "Hydration Mismatch" Errors

**Symptoms:**
- Console errors about React hydration
- Content flashing/jumping on page load

**Solutions:**
1. **Avoid using Date/random on server:**
   ```typescript
   // ❌ WRONG - Different on server/client
   <p>{new Date().toLocaleDateString()}</p>

   // ✅ CORRECT - Use 'use client' and useEffect
   'use client'
   const [date, setDate] = useState<string>()
   useEffect(() => {
     setDate(new Date().toLocaleDateString())
   }, [])
   ```

2. **Check server/client component boundaries:**
   - Server components can't use hooks or event handlers
   - Client components ("use client") can use hooks

---

## Rate Limiting Problems

### Issue: Queue Length Growing Infinitely

**Symptoms:**
- `aiRateLimiter.getStats().queueLength` keeps increasing
- Requests never complete

**Solutions:**
1. **Check for failed requests:**
   ```typescript
   try {
     await aiRateLimiter.enqueue(() => gradeAnswer(id), 1)
   } catch (error) {
     console.error('AI request failed:', error)
     // Handle error - don't let it silently fail
   }
   ```

2. **Increase maxRetries:**
   ```typescript
   const limiter = new AIRateLimiter({
     maxConcurrent: 5,
     maxRetries: 5, // Increase from default 3
     backoffMultiplier: 2,
   })
   ```

3. **Monitor queue and clear if stuck:**
   ```typescript
   const stats = aiRateLimiter.getStats()
   if (stats.queueLength > 1000) {
     console.warn('Queue too large, may need to reset')
     aiRateLimiter.resetStats() // This clears stats but not queue
   }
   ```

---

## Debugging Tips

### Enable Detailed Logging

```typescript
// In src/lib/ai/openai.ts
const DEBUG = process.env.NODE_ENV === 'development'

export async function gradeEssayWithAI(params) {
  if (DEBUG) {
    console.log('gradeEssayWithAI called with:', params)
  }

  const response = await openai.chat.completions.create({...})

  if (DEBUG) {
    console.log('OpenAI response:', response)
    console.log('Usage:', response.usage)
    console.log('Cost estimate:', estimateCost(response.usage))
  }

  return result
}
```

### Test Individual Functions

```typescript
// Create a test route at app/api/test-marking/route.ts
export async function GET() {
  const result = await aiGradeAnswer('student-answer-id')
  return Response.json(result)
}
```

### Check Database State

```bash
# Connect to database
psql $DATABASE_URL

# Check question bank
SELECT id, "questionText", "questionType", "schoolId" FROM "QuestionBank" LIMIT 10;

# Check marking results
SELECT id, "pointsAwarded", "maxPoints", "aiConfidence", "needsReview" FROM "MarkingResult" LIMIT 10;

# Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%marking%';
```

### Verify Environment Variables

```bash
# Check .env.local has required variables
cat .env.local | grep -E "OPENAI_API_KEY|DATABASE_URL|NEXTAUTH_SECRET"

# Restart server after changes
pnpm dev
```

---

## Getting Help

If you've tried the solutions above and still have issues:

1. **Check logs:**
   - Development: Browser console + terminal output
   - Production: Vercel logs or Sentry error tracking

2. **Minimal reproduction:**
   - Create minimal example that reproduces issue
   - Include code snippets and error messages

3. **System information:**
   - Node version: `node -v`
   - pnpm version: `pnpm -v`
   - Package versions: `cat package.json | grep -E "next|react|prisma"`

4. **Database state:**
   - Export relevant data: `pnpm prisma studio`
   - Check migrations: `pnpm prisma migrate status`

---

**Last Updated:** October 27, 2025
**Version:** 2.0.0
