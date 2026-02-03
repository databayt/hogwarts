# Auto-Generate Block - Issues & Troubleshooting

**Common issues and solutions for exam generation**

Part of the [Exam Block System](../README.md) | [Generate Block README](./README.md)

---

## Common Issues

### Issue: Not Enough Questions to Meet Distribution

**Symptoms:**

- Template requires 10 HARD MCQ questions
- Question bank only has 5
- Generation fails

**Solution:** Graceful degradation or warning

```typescript
// utils.ts
export async function validateDistribution(
  templateId: string
): Promise<ValidationResult> {
  const template = await getExamTemplate(templateId)
  const warnings: string[] = []

  for (const [type, diffMap] of Object.entries(template.distribution)) {
    for (const [diff, count] of Object.entries(diffMap)) {
      const available = await db.questionBank.count({
        where: {
          schoolId,
          subjectId: template.subjectId,
          questionType: type,
          difficulty: diff,
        },
      })

      if (available < count) {
        warnings.push(
          `Need ${count} ${diff} ${type} questions, only ${available} available`
        )
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}
```

---

### Issue: Generated Exam Always Same Questions

**Symptoms:**

- Generate exam multiple times
- Same questions selected each time
- Randomization enabled but not working

**Solution:** Use proper randomization seed

```typescript
// actions.ts
export async function generateExamFromTemplate(params) {
  const { randomize, seed } = params.options

  if (randomize) {
    // Use seed for reproducible randomization
    const rng = seedrandom(seed || `${Date.now()}`)

    questions.sort(() => rng() - 0.5) // Shuffle
  } else {
    // Use least-used questions
    questions.sort((a, b) => a.timesUsed - b.timesUsed)
  }

  return selected.slice(0, required)
}
```

---

### Issue: Bloom Distribution Not Respected

**Symptoms:**

- Template specifies 50% REMEMBER, 30% UNDERSTAND
- Generated exam has different distribution
- Questions don't match Bloom requirements

**Solution:** Enforce Bloom filtering

```typescript
// utils.ts
function filterByBloomLevel(
  questions: QuestionBank[],
  bloomDist: BloomDistribution
): QuestionBank[] {
  const selected: QuestionBank[] = []
  const total = Object.values(bloomDist).reduce((a, b) => a + b, 0)

  for (const [level, count] of Object.entries(bloomDist)) {
    const matching = questions.filter((q) => q.bloomLevel === level)

    if (matching.length < count) {
      throw new Error(
        `Need ${count} ${level} questions, only ${matching.length} available`
      )
    }

    selected.push(...matching.slice(0, count))
  }

  return selected
}
```

---

### Issue: Template Saves But Shows Wrong Total Marks

**Symptoms:**

- Configure distribution with 50 questions
- Each question 2 points
- Template shows 75 marks instead of 100

**Solution:** Recalculate on distribution change

```typescript
// distribution-editor.tsx
const totalMarks = useMemo(() => {
  let total = 0

  for (const [type, diffMap] of Object.entries(distribution)) {
    for (const [diff, count] of Object.entries(diffMap)) {
      const points = calculateDefaultPoints(type, diff)
      total += points * count
    }
  }

  return total
}, [distribution])
```

---

## Known Limitations

1. **No Partial Distribution Filling**
   - If 10 questions needed but only 7 available, fails entirely
   - Workaround: Validate before generating

2. **No Question Replacement**
   - Cannot replace specific question after generation
   - Workaround: Regenerate entire exam

3. **Single Template Per Exam**
   - Cannot combine multiple templates
   - Workaround: Create composite template

---

## FAQ

**Q: Can I manually adjust generated exam?**
A: Yes, after generation you can add/remove questions in the manage block.

**Q: How does randomization work?**
A: Uses seeded RNG for reproducible shuffling.

**Q: Can I reuse a template across subjects?**
A: No, templates are subject-specific. Clone and modify if needed.

---

**Last Updated:** 2025-10-27
**Version:** 2.0
