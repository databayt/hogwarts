# Phase 2: Configuration Epic - Detailed Implementation Plan

## Executive Summary

Phase 2 focuses on **school configuration features** required before academic operations can begin. Based on codebase exploration:

| Task                            | Status                  | Action Required                       |
| ------------------------------- | ----------------------- | ------------------------------------- |
| P2.1 School Profile Management  | ✅ **ALREADY COMPLETE** | None - exists in Settings General tab |
| P2.2 Academic Year Setup        | ⏳ Schema Only          | Build UI + Actions                    |
| P2.3 Grade Levels & Departments | ⏳ Schema Only          | Build UI + Actions                    |

**Design Guidelines (Per User Request):**

- Follow Anthropic design patterns (https://www.anthropic.com)
- Use icons from `components/icons/anthropic.tsx`
- Use shadcn/ui and its ecosystem
- Match existing marketing/platform page patterns

---

## P2.1 School Profile Management - COMPLETE ✅

**Location:** `src/components/platform/settings/content.tsx`

Already implemented features:

- School name editing
- Timezone selection (20 MENA + international zones)
- Locale selection (ar/en)
- Logo URL upload
- Multi-tab settings interface

**No action required.**

---

## P2.2 Academic Year Setup - TO BUILD

### Overview

Create UI for managing:

1. **SchoolYear** - Academic years (e.g., "2024-2025")
2. **Term** - Semesters/quarters within a year
3. **Period** - Daily time slots (e.g., "Period 1: 8:00-8:45")

### Prisma Models (Already Exist)

```prisma
model SchoolYear {
  id        String   @id @default(cuid())
  schoolId  String
  yearName  String   // e.g., "2024-2025"
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)

  terms   Term[]
  periods Period[]
}

model Term {
  id         String   @id @default(cuid())
  schoolId   String
  yearId     String
  termNumber Int      // 1, 2, 3...
  termName   String?  // Optional custom name
  startDate  DateTime
  endDate    DateTime
  isActive   Boolean  @default(false)
}

model Period {
  id        String @id @default(cuid())
  schoolId  String
  yearId    String
  name      String // "Period 1", "Period 2"
  startTime String // "08:00"
  endTime   String // "08:45"
}
```

### File Structure (Mirror Pattern)

```
src/
├── app/[lang]/s/[subdomain]/(platform)/settings/academic/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
│
└── components/platform/settings/academic/
    ├── content.tsx          # Main composition
    ├── actions.ts           # Server actions
    ├── validation.ts        # Zod schemas
    ├── types.ts             # TypeScript types
    ├── year-form.tsx        # Year CRUD form
    ├── year-list.tsx        # Year listing
    ├── term-form.tsx        # Term CRUD form
    ├── term-list.tsx        # Term listing
    ├── period-form.tsx      # Period CRUD form
    └── period-list.tsx      # Period listing
```

### UI Design

**Layout:** 3-column grid (Years | Terms | Periods)

```
┌─────────────────────────────────────────────────────────────┐
│ Academic Year Configuration                                  │
├───────────────┬────────────────────┬────────────────────────┤
│ Academic Years│ Terms              │ Daily Periods          │
│ ┌───────────┐ │ ┌────────────────┐ │ ┌──────────────────┐   │
│ │ 2024-2025 │◄│ │ Term 1         │ │ │ Period 1 (8:00)  │   │
│ │ ★ Active  │ │ │ Sep 1 - Jan 15 │ │ │ Period 2 (8:45)  │   │
│ └───────────┘ │ │ ★ Active       │ │ │ Period 3 (9:30)  │   │
│ ┌───────────┐ │ ├────────────────┤ │ │ ...              │   │
│ │ 2023-2024 │ │ │ Term 2         │ │ │ Period 8 (14:00) │   │
│ │           │ │ │ Jan 16 - May 30│ │ └──────────────────┘   │
│ └───────────┘ │ └────────────────┘ │ [+ Add Period]         │
│ [+ Add Year]  │ [+ Add Term]       │                        │
└───────────────┴────────────────────┴────────────────────────┘
```

### Server Actions

```typescript
// actions.ts
"use server"

// Academic Years
export async function createSchoolYear(input: CreateYearInput)
export async function updateSchoolYear(input: UpdateYearInput)
export async function deleteSchoolYear(input: { id: string })
export async function setActiveYear(input: { id: string })
export async function getSchoolYears()

// Terms
export async function createTerm(input: CreateTermInput)
export async function updateTerm(input: UpdateTermInput)
export async function deleteTerm(input: { id: string })
export async function setActiveTerm(input: { id: string })
export async function getTermsForYear(input: { yearId: string })

// Periods
export async function createPeriod(input: CreatePeriodInput)
export async function updatePeriod(input: UpdatePeriodInput)
export async function deletePeriod(input: { id: string })
export async function getPeriodsForYear(input: { yearId: string })
export async function bulkCreatePeriods(input: BulkPeriodInput)
```

### Validation Schemas

```typescript
// validation.ts
export const yearSchema = z
  .object({
    yearName: z.string().min(1, "Year name required"),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((d) => d.endDate > d.startDate, "End date must be after start")

export const termSchema = z.object({
  yearId: z.string().min(1),
  termNumber: z.number().int().min(1).max(4),
  termName: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
})

export const periodSchema = z.object({
  yearId: z.string().min(1),
  name: z.string().min(1, "Period name required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time"),
})
```

---

## P2.3 Grade Levels & Departments - TO BUILD

### Overview

Create UI for managing:

1. **YearLevel** - Grade levels (K, 1, 2... 12)
2. **Department** - Academic departments (Math, Science, Languages...)

### Prisma Models (Already Exist)

```prisma
model YearLevel {
  id          String  @id @default(cuid())
  schoolId    String
  levelName   String  // "Grade 1", "Year 7"
  levelNameAr String? // Arabic name
  levelOrder  Int     // For sorting
}

model Department {
  id             String  @id @default(cuid())
  schoolId       String
  departmentName String
  departmentNameAr String?

  subjects Subject[]
}
```

### File Structure

```
src/
├── app/[lang]/s/[subdomain]/(platform)/settings/organization/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
│
└── components/platform/settings/organization/
    ├── content.tsx           # Main composition
    ├── actions.ts            # Server actions
    ├── validation.ts         # Zod schemas
    ├── types.ts              # TypeScript types
    ├── year-level-form.tsx   # Grade level CRUD
    ├── year-level-list.tsx   # Grade level listing
    ├── department-form.tsx   # Department CRUD
    └── department-list.tsx   # Department listing
```

### UI Design

**Layout:** 2-column grid (Grade Levels | Departments)

```
┌─────────────────────────────────────────────────────────────┐
│ Organization Structure                                       │
├───────────────────────────────┬─────────────────────────────┤
│ Grade Levels                  │ Departments                  │
│ ┌───────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ 🎓 Kindergarten      (K)  │ │ │ 📐 Mathematics          │ │
│ │ 🎓 Grade 1           (1)  │ │ │ 🔬 Science              │ │
│ │ 🎓 Grade 2           (2)  │ │ │ 📚 Languages            │ │
│ │ 🎓 Grade 3           (3)  │ │ │ 🎨 Arts                 │ │
│ │ ...                       │ │ │ 🏃 Physical Education   │ │
│ │ 🎓 Grade 12         (12)  │ │ │ 💻 Technology           │ │
│ └───────────────────────────┘ │ └─────────────────────────┘ │
│ [+ Add Level]                 │ [+ Add Department]          │
│ [📋 Use Template]             │ [📋 Use Template]           │
└───────────────────────────────┴─────────────────────────────┘
```

### Server Actions

```typescript
// actions.ts
"use server"

// Year Levels
export async function createYearLevel(input: CreateLevelInput)
export async function updateYearLevel(input: UpdateLevelInput)
export async function deleteYearLevel(input: { id: string })
export async function reorderYearLevels(input: ReorderInput)
export async function getYearLevels()
export async function applyLevelTemplate(input: {
  template: "k12" | "primary" | "secondary"
})

// Departments
export async function createDepartment(input: CreateDeptInput)
export async function updateDepartment(input: UpdateDeptInput)
export async function deleteDepartment(input: { id: string })
export async function getDepartments()
export async function applyDepartmentTemplate(input: {
  template: "standard" | "stem" | "arts"
})
```

### Templates

**Grade Level Templates:**

- K-12 (Kindergarten through Grade 12)
- Primary (K-6)
- Secondary (7-12)
- British System (Year 1-13)

**Department Templates:**

- Standard (Math, Science, Languages, Social Studies, Arts, PE)
- STEM Focus (Math, Physics, Chemistry, Biology, Computer Science, Engineering)
- Arts Focus (Visual Arts, Music, Drama, Dance, Media Arts)

---

## Implementation Order

### Step 1: P2.2 Academic Year Setup (Days 1-2)

1. Create route `settings/academic/page.tsx`
2. Create `settings/academic/` component directory
3. Implement actions.ts with all CRUD operations
4. Build year-form.tsx and year-list.tsx
5. Build term-form.tsx and term-list.tsx
6. Build period-form.tsx and period-list.tsx
7. Compose in content.tsx with 3-column layout
8. Add loading.tsx and error.tsx

### Step 2: P2.3 Organization Structure (Days 3-4)

1. Create route `settings/organization/page.tsx`
2. Create `settings/organization/` component directory
3. Implement actions.ts with CRUD + templates
4. Build year-level-form.tsx and year-level-list.tsx
5. Build department-form.tsx and department-list.tsx
6. Add template selector modals
7. Compose in content.tsx with 2-column layout
8. Add loading.tsx and error.tsx

### Step 3: Settings Navigation Update

1. Add "Academic" and "Organization" tabs to main settings
2. Update sidebar navigation if needed
3. Add permission checks (ADMIN only)

---

## Design Tokens to Use

```css
/* Backgrounds */
bg-background, bg-card, bg-muted, bg-accent

/* Text */
text-foreground, text-muted-foreground

/* Borders */
border-border, border-input

/* Interactive */
bg-primary, bg-secondary, bg-destructive

/* Status */
Badge variants: default, secondary, outline, destructive
```

## Components to Use

From shadcn/ui:

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button` (default, outline, ghost, destructive variants)
- `Input`, `Label`, `Select`, `Switch`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`
- `Table`, `TableHeader`, `TableRow`, `TableCell`
- `Badge` for status indicators
- `Separator` for sections
- `Skeleton` for loading states

From Anthropic icons:

- Calendar icon for dates
- Settings icon for configuration
- Plus icon for add actions
- Check icon for active status

---

## Files to Create

### P2.2 Academic Year Setup

```
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/academic/page.tsx
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/academic/loading.tsx
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/academic/error.tsx
NEW: src/components/platform/settings/academic/content.tsx
NEW: src/components/platform/settings/academic/actions.ts
NEW: src/components/platform/settings/academic/validation.ts
NEW: src/components/platform/settings/academic/types.ts
NEW: src/components/platform/settings/academic/year-form.tsx
NEW: src/components/platform/settings/academic/year-list.tsx
NEW: src/components/platform/settings/academic/term-form.tsx
NEW: src/components/platform/settings/academic/term-list.tsx
NEW: src/components/platform/settings/academic/period-form.tsx
NEW: src/components/platform/settings/academic/period-list.tsx
```

### P2.3 Organization Structure

```
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/organization/page.tsx
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/organization/loading.tsx
NEW: src/app/[lang]/s/[subdomain]/(platform)/settings/organization/error.tsx
NEW: src/components/platform/settings/organization/content.tsx
NEW: src/components/platform/settings/organization/actions.ts
NEW: src/components/platform/settings/organization/validation.ts
NEW: src/components/platform/settings/organization/types.ts
NEW: src/components/platform/settings/organization/year-level-form.tsx
NEW: src/components/platform/settings/organization/year-level-list.tsx
NEW: src/components/platform/settings/organization/department-form.tsx
NEW: src/components/platform/settings/organization/department-list.tsx
NEW: src/components/platform/settings/organization/template-selector.tsx
```

### Navigation Update

```
EDIT: src/components/platform/settings/content-enhanced.tsx (add tabs)
```

---

## Success Criteria

- [ ] Academic Year CRUD works
- [ ] Terms can be created per year
- [ ] Periods can be configured per year
- [ ] Only one year/term can be active at a time
- [ ] Grade levels can be created and reordered
- [ ] Departments can be created
- [ ] Templates work for quick setup
- [ ] All queries scoped by schoolId (multi-tenant safe)
- [ ] Mobile responsive (2-column on tablet, 1-column on mobile)
- [ ] Arabic/English labels from dictionary
- [ ] No TypeScript errors
