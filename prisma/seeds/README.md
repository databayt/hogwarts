# Additive Seed System

> **ZERO-DELETE ARCHITECTURE**: Data is preserved and increased, NEVER decreased.

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
  skipDuplicates: true  // Silently skip existing records
});
```

## Module Reference

### Available Modules

| Module | Command | What It Seeds |
|--------|---------|---------------|
| school | `pnpm db:seed:single school` | Demo school + branding |
| auth | `pnpm db:seed:single auth` | Admin users (dev, admin, accountant, staff) |
| academic | `pnpm db:seed:single academic` | School year, terms, periods, year levels |
| departments | `pnpm db:seed:single departments` | 6 departments, 20 subjects |
| classrooms | `pnpm db:seed:single classrooms` | 17 rooms, classroom types |
| people | `pnpm db:seed:single people` | 25 teachers, 100 students, 200 guardians |
| classes | `pnpm db:seed:single classes` | Class sections + enrollments |
| library | `pnpm db:seed:single library` | 38 books (Arabic + English) |
| announcements | `pnpm db:seed:single announcements` | School announcements |
| events | `pnpm db:seed:single events` | School calendar events |
| fees | `pnpm db:seed:single fees` | Fee structures + assignments |
| finance | `pnpm db:seed:single finance` | Accounts, payroll, banking, budgets |
| exams | `pnpm db:seed:single exams` | Questions, templates, exams, results |
| grades | `pnpm db:seed:single grades` | Academic results |
| timetable | `pnpm db:seed:single timetable` | Class schedules |
| stream | `pnpm db:seed:single stream` | LMS courses |
| lessons | `pnpm db:seed:single lessons` | Lesson plans |
| reports | `pnpm db:seed:single reports` | Report cards |
| attendance | `pnpm db:seed:single attendance` | Attendance records |
| admission | `pnpm db:seed:single admission` | Admission campaigns + applications |

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
  }
];
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
const count = await prisma.book.count({ where: { schoolId } });
console.log(`Books: ${count}`);  // Should never decrease
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

## Architecture

```
prisma/seeds/
├── index.ts          # Main orchestrator (runs all phases)
├── run-single.ts     # Single module runner
├── constants.ts      # Bilingual demo data configuration
├── types.ts          # TypeScript types
├── school.ts         # Phase 1: School
├── auth.ts           # Phase 1: Admin users
├── academic.ts       # Phase 2: Academic structure
├── departments.ts    # Phase 2: Departments + subjects
├── classrooms.ts     # Phase 2: Physical rooms
├── people.ts         # Phase 3: Teachers, students, guardians
├── classes.ts        # Phase 4: Class sections
├── library.ts        # Phase 5: Books
├── announcements.ts  # Phase 5: Announcements
├── events.ts         # Phase 5: Calendar events
├── fees.ts           # Phase 6: Fee structures
├── finance.ts        # Phase 6: Full finance module
├── exams.ts          # Phase 7: Exam system
├── grades.ts         # Phase 7: Academic results
├── timetable.ts      # Phase 8: Schedules
├── stream.ts         # Phase 9: LMS courses
├── lessons.ts        # Phase 9: Lesson plans
├── reports.ts        # Phase 9: Report cards
├── attendance.ts     # Phase 10: Attendance
└── admission.ts      # Phase 11: Admissions
```

## Demo School Details

- **Domain**: demo.databayt.org
- **System**: Sudanese K-12 Education
- **Languages**: Arabic (primary), English
- **Currency**: SDG (Sudanese Pound)
- **Password**: 1234 (all accounts)

## Login Credentials

| Role | Email |
|------|-------|
| Developer | dev@databayt.org |
| Admin | admin@databayt.org |
| Accountant | accountant@databayt.org |
| Staff | staff@databayt.org |
| Teacher | teacher1@demo.databayt.org |
| Student | student1@demo.databayt.org |
| Guardian | father1@demo.databayt.org |
