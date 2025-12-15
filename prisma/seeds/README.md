# Additive Seed System

> **ZERO-DELETE ARCHITECTURE**: Data is preserved and increased, NEVER decreased.

## Table of Contents

- [Philosophy](#philosophy)
- [Quick Start](#quick-start)
- [Safe Patterns](#how-it-works)
- [Module Reference](#module-reference)
- [Bilingual Content](#bilingual-content)
- [Auto-Translation](#auto-translation)
- [Cultural Events](#cultural-events)
- [Pre-Commit Safety](#pre-commit-safety)
- [Architecture](#architecture)

## Philosophy

This seed system follows an **additive-only** pattern:

- Running `pnpm db:seed` multiple times is **100% safe**
- Existing data is **never deleted**
- New records are added only if they don't exist
- No cleanup, no reset, no destructive operations

## Quick Start

```bash
# Add all demo data (safe to run multiple times)
pnpm db:seed

# Add specific module only
pnpm db:seed:single library
pnpm db:seed:single lessons
pnpm db:seed:single events
```

## How It Works

### Pattern 1: findFirst + create (Compound Unique Keys)

Used when the unique constraint involves multiple fields (e.g., `email + schoolId`):

```typescript
// Check if exists first
let user = await prisma.user.findFirst({
  where: { email, schoolId },
});

// Only create if not found
if (!user) {
  user = await prisma.user.create({
    data: { email, schoolId, ... }
  });
}
```

### Pattern 2: upsert (Simple Unique Keys)

Used when there's a single unique field or compound unique index:

```typescript
const teacher = await prisma.teacher.upsert({
  where: { schoolId_emailAddress: { schoolId, emailAddress: email } },
  update: { givenName, surname },  // Update if exists
  create: { schoolId, emailAddress, givenName, surname, ... }  // Create if not
});
```

### Pattern 3: createMany with skipDuplicates (Batch Inserts)

Used for bulk inserts where duplicates should be ignored:

```typescript
await prisma.studentClass.createMany({
  data: enrollments,
  skipDuplicates: true, // Silently skip existing records
})
```

## Module Reference

### Available Modules

| Module        | Command                             | What It Seeds                               |
| ------------- | ----------------------------------- | ------------------------------------------- |
| school        | `pnpm db:seed:single school`        | Demo school + branding                      |
| auth          | `pnpm db:seed:single auth`          | Admin users (dev, admin, accountant, staff) |
| academic      | `pnpm db:seed:single academic`      | School year, terms, periods, year levels    |
| departments   | `pnpm db:seed:single departments`   | 6 departments, 20 subjects                  |
| classrooms    | `pnpm db:seed:single classrooms`    | 17 rooms, classroom types                   |
| people        | `pnpm db:seed:single people`        | 25 teachers, 100 students, 200 guardians    |
| classes       | `pnpm db:seed:single classes`       | Class sections + enrollments                |
| library       | `pnpm db:seed:single library`       | 38 books (Arabic + English)                 |
| announcements | `pnpm db:seed:single announcements` | School announcements                        |
| events        | `pnpm db:seed:single events`        | School calendar events                      |
| fees          | `pnpm db:seed:single fees`          | Fee structures + assignments                |
| finance       | `pnpm db:seed:single finance`       | Accounts, payroll, banking, budgets         |
| exams         | `pnpm db:seed:single exams`         | Questions, templates, exams, results        |
| grades        | `pnpm db:seed:single grades`        | Academic results                            |
| timetable     | `pnpm db:seed:single timetable`     | Class schedules                             |
| stream        | `pnpm db:seed:single stream`        | LMS courses                                 |
| lessons       | `pnpm db:seed:single lessons`       | Lesson plans                                |
| reports       | `pnpm db:seed:single reports`       | Report cards                                |
| attendance    | `pnpm db:seed:single attendance`    | Attendance records                          |
| admission     | `pnpm db:seed:single admission`     | Admission campaigns + applications          |

### Module Dependencies

```
TIER 1 (no dependencies):
  school

TIER 2 (needs school):
  auth, academic, departments, classrooms, library, events

TIER 3 (needs people):
  people → needs school, departments, academic

TIER 4 (needs classes):
  classes → needs people, subjects, classrooms

TIER 5 (needs everything):
  fees, finance, exams, grades, timetable, stream, lessons,
  reports, attendance, admission → needs classes
```

## Incrementally Adding Data

### Example 1: Add More Books to Library

Edit `prisma/seeds/constants.ts` and add books to the `BOOKS` array:

```typescript
// In constants.ts, add to BOOKS array:
{
  isbn: "978-NEW-ISBN",
  title: "New Book Title",
  author: "Author Name",
  language: "en",
  category: "Fiction",
  // ... other fields
}
```

Then run:

```bash
pnpm db:seed:single library
```

**Result**: New books are added, existing books remain untouched.

### Example 2: Add More Students

Edit the `STUDENT_DISTRIBUTION` in `constants.ts`:

```typescript
// Increase count for any grade level
{ level: "Grade 10", count: 10 },  // Was 6, now 10
```

Then run:

```bash
pnpm db:seed:single people
```

**Result**: 4 new students added to Grade 10, existing 6 preserved.

### Example 3: Add New Events

Edit `prisma/seeds/events.ts` and add events to the array:

```typescript
const events = [
  // ... existing events
  {
    title: "New School Event",
    startDate: new Date("2025-06-15"),
    // ... other fields
  },
]
```

Then run:

```bash
pnpm db:seed:single events
```

**Result**: New event added, existing 16 events preserved.

## Output Interpretation

When you run the seed, look for these patterns:

```
✅ Library: 0 new books, 38 already existed     # All books preserved
✅ Created: 5 new books, 38 already existed      # 5 new + 38 preserved
✅ School already exists, using existing         # School preserved
✅ Created: 0/3 campaigns (3 existing)           # All campaigns preserved
```

## Verification

After running the seed, verify data wasn't lost:

```bash
# Check record counts
npx prisma studio
```

Or query directly:

```typescript
const count = await prisma.book.count({ where: { schoolId } })
console.log(`Books: ${count}`) // Should never decrease
```

## Safety Guarantees

1. **No `deleteMany()`** - Removed from all seed files
2. **No `cleanup.ts`** - File deleted entirely
3. **No reset commands** - Removed from run-single.ts
4. **Upsert pattern everywhere** - Creates or updates, never deletes
5. **skipDuplicates for batch ops** - Silently ignores existing records

## Troubleshooting

### "Unique constraint failed"

This means the upsert key doesn't match. Check:

1. The `where` clause uses the correct unique index
2. All required fields are in `create` and `update`

### "Record not found"

A dependency is missing. Run modules in order:

```bash
pnpm db:seed:single school
pnpm db:seed:single academic
pnpm db:seed:single departments
pnpm db:seed:single people
pnpm db:seed:single classes
# ... then other modules
```

### Want to truly reset? (Manual only)

```bash
# Nuclear option - USE WITH EXTREME CAUTION
npx prisma migrate reset --force
```

This is intentionally NOT available as a seed command.

## Bilingual Content

All seed data supports Arabic (AR) and English (EN) content using field suffixes:

### Field Pattern

```typescript
// Database schema
model Announcement {
  titleEn  String?
  titleAr  String?
  bodyEn   String?
  bodyAr   String?
}

// Seed data
{
  titleEn: "Welcome Back to School",
  titleAr: "أهلاً بعودتكم إلى المدرسة",
  bodyEn: "We are excited to welcome all students...",
  bodyAr: "يسعدنا أن نرحب بجميع الطلاب...",
}
```

### Bilingual Grade Scales

Located in `constants.ts`, grades support Sudanese/Arabic education:

| Grade | Arabic         | English        | Min % | GPA |
| ----- | -------------- | -------------- | ----- | --- |
| A+    | ممتاز مرتفع    | Excellent High | 95    | 4.0 |
| A     | ممتاز          | Excellent      | 90    | 4.0 |
| B+    | جيد جداً مرتفع | Very Good High | 85    | 3.5 |
| B     | جيد جداً       | Very Good      | 80    | 3.0 |
| C+    | جيد مرتفع      | Good High      | 75    | 2.5 |
| C     | جيد            | Good           | 70    | 2.0 |
| D+    | مقبول مرتفع    | Pass High      | 60    | 1.5 |
| D     | مقبول          | Pass           | 50    | 1.0 |
| F     | راسب           | Fail           | 0     | 0.0 |

### Report Categories

```typescript
{
  academic: { ar: "الأداء الأكاديمي", en: "Academic Performance" },
  behavior: { ar: "السلوك والانضباط", en: "Behavior & Discipline" },
  attendance: { ar: "الحضور والالتزام", en: "Attendance & Commitment" },
  extracurricular: { ar: "الأنشطة اللامنهجية", en: "Extracurricular Activities" },
  social: { ar: "المهارات الاجتماعية", en: "Social Skills" },
}
```

## Auto-Translation

When creating entities at runtime (not seeds), use the auto-translate wrapper for automatic bilingual content.

### Wrapper Location

`src/lib/auto-translate.ts`

### Usage in Server Actions

```typescript
import { withAutoTranslation } from "@/lib/auto-translate"

export async function createAnnouncement(input: {
  title: string
  body: string
  sourceLanguage: "en" | "ar"
}) {
  // Auto-translate to other language
  const translated = await withAutoTranslation(
    { title: input.title, body: input.body },
    ["title", "body"],
    input.sourceLanguage
  )

  // Create with both languages
  const announcement = await db.announcement.create({
    data: {
      titleEn: translated.data.titleEn,
      titleAr: translated.data.titleAr,
      bodyEn: translated.data.bodyEn,
      bodyAr: translated.data.bodyAr,
      schoolId,
    },
  })

  return announcement
}
```

### Display Logic

```typescript
import { getLocalizedField } from "@/lib/auto-translate"

// In components
const title = getLocalizedField(announcement, "title", locale)
const body = getLocalizedField(announcement, "body", locale)

// Returns localized version with fallback
// e.g., titleAr if locale="ar", otherwise titleEn
```

### Supported Entities

| Entity       | Translatable Fields |
| ------------ | ------------------- |
| Announcement | title, body         |
| Event        | name, description   |
| Assignment   | title, description  |
| Lesson       | title, objectives   |
| Exam         | name, instructions  |
| Book         | title, description  |
| Course       | name, description   |

## Cultural Events

Seeds include Islamic/Sudanese cultural events in `events.ts`:

| Event               | Arabic                     | Type        |
| ------------------- | -------------------------- | ----------- |
| Eid al-Fitr         | عيد الفطر المبارك          | CELEBRATION |
| Eid al-Adha         | عيد الأضحى المبارك         | CELEBRATION |
| Mawlid an-Nabi      | المولد النبوي الشريف       | CELEBRATION |
| Islamic New Year    | رأس السنة الهجرية          | CELEBRATION |
| Arabic Language Day | اليوم العالمي للغة العربية | CELEBRATION |
| Teachers' Day       | يوم المعلم                 | CELEBRATION |
| Mother's Day        | عيد الأم                   | CELEBRATION |
| Children's Day      | يوم الطفل                  | CELEBRATION |
| Quran Competition   | مسابقة حفظ القرآن الكريم   | COMPETITION |

### Adding New Cultural Events

```typescript
// In prisma/seeds/events.ts
{
  title: "عنوان الحدث | Event Title",
  description: `
    الوصف بالعربية...

    Description in English...
  `,
  eventType: EventType.CELEBRATION,
  startDate: new Date("2025-MM-DD"),
  // Islamic dates: use libraries like hijri-date for accuracy
}
```

## Pre-Commit Safety

**CRITICAL**: A pre-commit hook prevents destructive operations in seed files.

### Protected Operations

The following are **FORBIDDEN** in seed files:

| Pattern        | Risk                     | Alternative                        |
| -------------- | ------------------------ | ---------------------------------- |
| `deleteMany()` | Data loss                | `upsert()` with update             |
| `.delete()`    | Record deletion          | `findFirst()` + conditional create |
| `TRUNCATE`     | Table wipe               | Never needed in seeds              |
| `DROP`         | Table/schema destruction | Never needed                       |

### How It Works

When committing changes to `prisma/seeds/*.ts` or `prisma/generator/*.ts`:

```bash
# Pre-commit hook checks for destructive patterns
if git diff --cached | grep -E "deleteMany|\.delete\(|TRUNCATE|DROP"; then
  echo "❌ CRITICAL: Destructive operations detected in seed files!"
  exit 1
fi
```

### Safe Alternatives

```typescript
// ❌ FORBIDDEN - Deletes data
await prisma.student.deleteMany({ where: { schoolId } })
await prisma.student.delete({ where: { id } })

// ✅ SAFE - Upsert (create or update)
await prisma.student.upsert({
  where: { schoolId_email: { schoolId, email } },
  create: { schoolId, email, name },
  update: { name }, // Update if exists
})

// ✅ SAFE - Conditional create
const existing = await prisma.student.findFirst({ where: { email, schoolId } })
if (!existing) {
  await prisma.student.create({ data: { email, schoolId, name } })
}

// ✅ SAFE - Skip duplicates
await prisma.student.createMany({
  data: students,
  skipDuplicates: true,
})
```

### Emergency Override

If you absolutely need destructive operations (rare, discuss with team first):

```bash
git commit --no-verify -m "message"
```

**WARNING**: This bypasses all safety checks. Use only when:

- Team has approved the destructive operation
- You have a backup of the data
- This is a controlled development environment

## Architecture

```
prisma/seeds/
├── index.ts          # Main orchestrator (runs all phases)
├── ensure-demo.ts    # Auto-recovery (runs on build)
├── run-single.ts     # Single module runner
├── constants.ts      # Bilingual demo data (names, grades, config)
├── types.ts          # TypeScript types
│
├── # TIER 1: Core Setup
├── school.ts         # School + branding
├── auth.ts           # Admin users
│
├── # TIER 2: Academic Foundation
├── academic.ts       # Year, terms, periods, levels
├── departments.ts    # Departments + subjects
├── classrooms.ts     # Physical rooms
│
├── # TIER 3: People
├── people.ts         # Teachers, students, guardians
├── classes.ts        # Class sections + enrollments
│
├── # TIER 4: Operations
├── library.ts        # Books (AR/EN)
├── covers.ts         # Book cover URL updates (utility)
├── announcements.ts  # Announcements (bilingual)
├── events.ts         # Calendar events + cultural holidays
├── fees.ts           # Fee structures
├── finance.ts        # Accounting system
│
├── # TIER 5: Assessment
├── exams.ts          # Exams + questions
├── grades.ts         # Student grades
├── reports.ts        # Report cards
├── timetable.ts      # Schedules
│
├── # TIER 6: Learning
├── stream.ts         # LMS courses
├── lessons.ts        # Lesson plans
├── attendance.ts     # Attendance records
│
├── # TIER 7: Admission
└── admission.ts      # Admission campaigns
```

### Related Files

```
prisma/generator/
└── verify-qbank.ts   # Read-only verification utility (kept)

src/lib/
└── auto-translate.ts # Runtime auto-translation wrapper
```

## Demo School Details

- **Domain**: demo.databayt.org
- **System**: Sudanese K-12 Education
- **Languages**: Arabic (primary), English
- **Currency**: SDG (Sudanese Pound)
- **Password**: 1234 (all accounts)

## Login Credentials

| Role       | Email                      |
| ---------- | -------------------------- |
| Developer  | dev@databayt.org           |
| Admin      | admin@databayt.org         |
| Accountant | accountant@databayt.org    |
| Staff      | staff@databayt.org         |
| Teacher    | teacher1@demo.databayt.org |
| Student    | student1@demo.databayt.org |
| Guardian   | father1@demo.databayt.org  |
