# Add Real Course Content to ClickView Courses (Skilljar-style)

## Context

ClickView courses have null descriptions, generic objectives (just chapter name listing), and generic "who this is for" / prerequisites. Each subject needs real, Skilljar-style course content with 5 sections: short desc, long desc, objectives, prerequisites, who it's for.

Reference: https://anthropic.skilljar.com/claude-code-in-action

## Files

| #   | File                                               | Change                                                                                                |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `prisma/seeds/clickview-catalog.ts`                | `SUBJECT_DESCRIPTIONS` (DONE), wire into upsert                                                       |
| 2   | `src/components/stream/courses/[slug]/content.tsx` | Add `SUBJECT_COURSE_DATA` map with all 5 sections per subject, replace chapter-listing with real data |

## Data Flow: 5 Sections

| Section                                    | Source                                | Where rendered                              | Current state              |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------- | -------------------------- |
| **Description** (short, 1-line)            | DB `description` field via seed       | Hero `<p>` below title (line 147)           | `null` → empty             |
| **About** (long, 2-3 sentences)            | Client-side map `SUBJECT_COURSE_DATA` | "About this course" section (line 322)      | Falls back to generic      |
| **Objectives** (4-6 bullet points)         | Client-side map `SUBJECT_COURSE_DATA` | "Learning objectives" section (line 341)    | Lists chapter names        |
| **Prerequisites** (1-2 sentences)          | Client-side map `SUBJECT_COURSE_DATA` | "Prerequisites" section (line 364)          | Generic "no prerequisites" |
| **Who this course is for** (1-2 sentences) | Client-side map `SUBJECT_COURSE_DATA` | "Who this course is for" section (line 373) | Generic learner text       |

## Changes

### 1. `clickview-catalog.ts` — Wire short descriptions into DB

`SUBJECT_DESCRIPTIONS` map already added. Wire into upsert `update` + `create`:

```ts
description: SUBJECT_DESCRIPTIONS[entry.subjectName] ?? null,
```

### 2. `content.tsx` — Add `SUBJECT_COURSE_DATA` map (37 subjects)

Client-side constant keyed by `course.title` (= subject name). Example entry:

```ts
const SUBJECT_COURSE_DATA: Record<
  string,
  {
    about: string
    objectives: string[]
    prerequisites: string
    audience: string
  }
> = {
  Math: {
    about:
      "This course builds strong mathematical foundations through problem-solving, critical thinking, and real-world applications. Students progress from core concepts to advanced techniques with video lessons and interactive resources.",
    objectives: [
      "Apply number operations and algebraic reasoning to solve multi-step problems",
      "Interpret and analyze data using graphs, charts, and statistical measures",
      "Understand geometric relationships, measurement, and spatial reasoning",
      "Develop logical thinking and proof-based reasoning skills",
    ],
    prerequisites: "Basic numeracy and familiarity with arithmetic operations.",
    audience:
      "Students building math skills across elementary, middle, and high school levels.",
  },
  // ... all 37 subjects
}
```

### 3. `content.tsx` — Hero description (line 147)

**Before**: `{course.description && (<p>...)}`
**After**: Always render, fallback to dict:

```tsx
<p style={{ color: colors.muted }}>
  {course.description ||
    (dict?.stream?.courseDetail?.thisCourseDescription ??
      "This comprehensive course is designed to take you from beginner to advanced level.")}
</p>
```

### 4. `content.tsx` — About section (line 322)

**Before**: `course.description || generic fallback`
**After**: Use `about` from map, then `course.description`, then dict fallback:

```tsx
{courseData?.about || course.description || dict fallback}
```

### 5. `content.tsx` — Learning objectives (line 341)

**Before**: Lists chapter titles `{course.chapters.map(ch => ch.title)}`
**After**: Lists real objectives from map, fallback to chapter titles if no map entry:

```tsx
{
  ;(courseData?.objectives ?? course.chapters.map((ch) => ch.title)).map(
    (obj) => (
      <li>
        <Check />
        <span>{obj}</span>
      </li>
    )
  )
}
```

### 6. `content.tsx` — Prerequisites (line 364)

**Before**: Generic "No specific prerequisites..."
**After**: Use map value, fallback to generic:

```tsx
{courseData?.prerequisites || dict?.stream?....?.learnersDescription || "No specific prerequisites..."}
```

### 7. `content.tsx` — Who this course is for (line 373)

**Before**: Generic "Learners who want to..."
**After**: Use map value, fallback to generic:

```tsx
{courseData?.audience || dict fallback}
```

### 8. Re-seed

`pnpm db:seed:single clickview-catalog`

## Verification

1. `pnpm tsc --noEmit`
2. Seed: `pnpm db:seed:single clickview-catalog`
3. Visit course detail page — all 5 sections show real, subject-specific content
