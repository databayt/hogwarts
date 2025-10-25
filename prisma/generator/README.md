# Prisma Seed Files

This directory contains seed files for populating the database with demo and test data.

## Available Seed Files

### 1. `seed-demo.ts` - Demo School Seed (RECOMMENDED)

**Purpose:** Create a fully-featured demo school for demonstrations and testing.

**What it creates:**
- **School:** Demo International School (domain: `demo`)
- **Users:** 150 students, 25 teachers, 150 guardians + fixed demo accounts
- **Academics:** 6 year levels (Grades 7-12), 8 departments, 20 subjects, 24 classes
- **Library:** 100 books with realistic catalog
- **Assessments:** 60 assignments, 12 exams with results
- **Attendance:** Full month of attendance data for all classes
- **Fees:** Complete fee structures and payment records for all students
- **LMS:** 10 courses (8 free, 2 paid) with chapters and lessons
- **Additional:** Announcements, school branding, classroom types

**Access:**
- URL: `demo.databayt.org`
- Password for ALL users: `1234`

**Fixed Demo Credentials:**
```
Admin:      admin@demo.databayt.org / 1234
Accountant: accountant@demo.databayt.org / 1234
Teacher:    teacher@demo.databayt.org / 1234
Student:    student@demo.databayt.org / 1234
Parent:     parent@demo.databayt.org / 1234
```

**Additional Users:**
All 150 students, 25 teachers, and 150 guardians have accounts with:
- Email pattern: `{firstname}.{surname}.{index}@demo.databayt.org`
- Password: `1234` (same for everyone)
- Names: Arabic/Sudanese names (Ahmed, Fatima, Hassan, etc.)

**Run Command:**
```bash
pnpm db:seed:demo
```

---

### 2. `seed.ts` - Port Sudan School Seed

**Purpose:** Create Port Sudan International School with comprehensive data.

**What it creates:**
- **School:** Port Sudan International School (domain: `portsudan`)
- **Users:** 60 students, 15 teachers
- **Academics:** Full academic structure with realistic Sudanese data
- **Password:** `Password123!` for all users

**Access:**
- URL: `portsudan.databayt.org`
- Admin: `admin@portsudan.school.sd / Password123!`

**Run Command:**
```bash
pnpm db:seed:portsudan
```

---

### 3. Other Seed Files

- `seed-portsudan-complete.ts` - Complete Port Sudan seed with timetable
- `seed-portsudan-simple.ts` - Minimal Port Sudan seed
- `seed-portsudan-fix.ts` - Bug fix seed for Port Sudan
- `seed-stream-only.ts` - LMS/Stream courses only

---

## Usage Guide

### First Time Setup

1. **Generate Prisma Client:**
   ```bash
   pnpm prisma generate
   ```

2. **Run Demo Seed:**
   ```bash
   pnpm db:seed:demo
   ```

3. **Access Demo:**
   - Local development: `http://demo.localhost:3000` (set `NEXT_PUBLIC_ROOT_DOMAIN=localhost`)
   - Production: `https://demo.databayt.org`

### Reset Demo Data

To reset and re-seed the demo school:

```bash
# Method 1: Delete demo school and re-seed
pnpm db:seed:demo

# Method 2: Full database reset (CAUTION: deletes ALL data)
pnpm prisma migrate reset --force
pnpm db:seed:demo
```

### Seed Multiple Schools

You can run multiple seed scripts to create different schools:

```bash
# Seed demo school
pnpm db:seed:demo

# Seed Port Sudan school
pnpm db:seed:portsudan
```

Each school will have its own subdomain:
- `demo.databayt.org`
- `portsudan.databayt.org`

---

## Demo School Details

### Academic Structure
- **Year Levels:** 6 (Grades 7-12)
- **Departments:** 8 (Languages, Sciences, Mathematics, Humanities, Arts, PE, Religious Studies, ICT)
- **Subjects:** 20 (covering all departments)
- **Periods:** 8 (8:00 AM - 3:00 PM)
- **Classes:** 24 (4 per grade level)
- **Classrooms:** 16 (various types: lecture, lab, computer, art, gym)

### People
- **Students:** 150 (25 per grade, evenly distributed across grades 7-12)
- **Teachers:** 25 (covering all subjects and departments)
- **Guardians:** 150 (1-2 per student, fathers and mothers)
- **Admin Staff:** 5 (admin, accountant, and 3 demo accounts)

### Module Coverage (100%)

| Module | Items | Status |
|--------|-------|--------|
| Assignments | 60 | ✅ With submissions |
| Exams | 12 | ✅ With results for 150 students |
| Attendance | 3,000+ records | ✅ Full month for all classes |
| Library | 100 books | ✅ With borrow records |
| Fees | 150 assignments | ✅ With payments |
| LMS Courses | 10 courses | ✅ With chapters/lessons |
| Announcements | 15 | ✅ School-wide and class-specific |
| Branding | Complete | ✅ Colors, settings configured |

### LMS Courses (Stream)

1. **Introduction to Programming** - Free
2. **Advanced Mathematics** - Free
3. **Physics Fundamentals** - Free
4. **English Language Mastery** - Free
5. **Arabic Language & Literature** - Free
6. **Islamic Studies** - Free
7. **Chemistry Basics** - Free
8. **World History** - Free
9. **Digital Art & Design** - $49.99
10. **Advanced Programming** - $29.99

Each course has:
- 3 chapters
- 15 lessons (5 per chapter)
- Durations: 30-50 minutes per lesson

---

## Testing Workflows

### 1. Login Flow
```bash
# Navigate to demo
http://demo.localhost:3000/en/login

# Login as admin
Email: admin@demo.databayt.org
Password: 1234

# Or login as any student (example)
Email: ahmed.hassan.1@demo.databayt.org
Password: 1234
```

### 2. Test Attendance
```bash
# Login as teacher
# Navigate to: /en/s/demo/attendance
# Select a class and mark attendance
# All students will be pre-loaded
```

### 3. Test Library
```bash
# Navigate to: /en/s/demo/library
# Browse 100 books
# Test borrow/return flows
```

### 4. Test Fees
```bash
# Login as parent
# Navigate to: /en/s/demo/fees
# View fee assignments
# Check payment records
```

### 5. Test LMS
```bash
# Navigate to: /en/s/demo/stream
# Browse 10 courses
# Enroll in free courses
# Check course content (chapters/lessons)
```

---

## Troubleshooting

### "Cannot find school with domain 'demo'"

**Solution:** Run the demo seed:
```bash
pnpm db:seed:demo
```

### "Invalid password"

**Issue:** All demo users use password `1234` (not `Password123!` or other variants)

**Solution:** Use `1234` as password for all demo accounts.

### "No students found"

**Issue:** Seed may not have completed successfully.

**Solution:**
```bash
# Check if demo school exists
pnpm dlx prisma studio
# Look for school with domain "demo"

# If missing, run seed again
pnpm db:seed:demo
```

### Seed takes too long

**Normal:** The demo seed creates 150+ students with all relationships. It may take 2-5 minutes.

**If it hangs:**
1. Check database connection
2. Ensure Prisma client is generated: `pnpm prisma generate`
3. Check for foreign key constraint errors in console

---

## Development Tips

### Quick Test User

For quick testing, use one of these fixed credentials:

```bash
# Admin (full access)
admin@demo.databayt.org / 1234

# Teacher (classroom features)
teacher@demo.databayt.org / 1234

# Student (student portal)
student@demo.databayt.org / 1234

# Parent (parent portal)
parent@demo.databayt.org / 1234
```

### Find Specific Users

All users follow predictable email patterns:

```typescript
// Teachers
{firstname}.{surname}@demo.databayt.org
// Examples: ahmed.hassan@demo.databayt.org, fatima.ali@demo.databayt.org

// Students
{firstname}.{surname}.{index}@demo.databayt.org
// Examples: omar.mohamed.1@demo.databayt.org, aisha.ibrahim.2@demo.databayt.org

// Guardians
{firstname}.{surname}.{father|mother}.{index}@demo.databayt.org
// Examples: ahmed.hassan.father.1@demo.databayt.org
```

### View All Seeded Data

Use Prisma Studio to browse all data:

```bash
pnpm dlx prisma studio
```

Then navigate to:
- **School** table → find "Demo International School"
- **User** table → filter by schoolId
- **Student** table → see all 150 students
- **Book** table → see all 100 library books

---

## Seed File Structure

Each seed file follows this pattern:

```typescript
1. Import dependencies (Prisma client, bcrypt, faker)
2. Define school configuration
3. Define helper functions
4. Create school
5. Create users (admin, teachers, students, guardians)
6. Create academic structure (years, terms, periods, levels)
7. Create departments and subjects
8. Create classrooms
9. Create classes and enrollments
10. Populate module data (library, fees, exams, etc.)
11. Run and log summary
```

---

## Contributing

When creating new seed files:

1. **Follow naming convention:** `seed-{schoolname}.ts`
2. **Use upsert/skipDuplicates:** Make seeds idempotent
3. **Add summary logging:** Show what was created
4. **Document credentials:** In this README
5. **Test thoroughly:** Run seed multiple times to ensure it works

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm db:seed:demo` | Seed demo school (150 students, full data) |
| `pnpm db:seed:portsudan` | Seed Port Sudan school (60 students) |
| `pnpm dlx prisma studio` | Open database browser |
| `pnpm prisma generate` | Regenerate Prisma client |
| `pnpm prisma migrate reset` | Reset database (deletes all data!) |

---

**Last Updated:** October 2025
**Maintainer:** Development Team
**Contact:** For issues, check the main project README
