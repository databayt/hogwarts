# Port Sudan School - Database Seeding Guide

**Purpose:** Populate Port Sudan International School with full timetable data

**Status:** ✅ Ready to deploy (database connection required)

---

## Quick Start

```bash
# When database is accessible, run this command:
cd D:/repo/hogwarts
npx tsx prisma/seed-portsudan-complete.ts
```

**Expected Duration:** 30-60 seconds
**Idempotent:** ✅ Yes (can run multiple times safely)

---

## What Will Be Created

### School Setup
- **School:** Port Sudan International School
- **Domain:** portsudan.databayt.org
- **Phone:** +249-91-234-5678

### Academic Structure
- **Academic Year:** 2024-2025 (Sep 1, 2024 - Jun 30, 2025)
- **Terms:** 2 terms
  - Term 1: Sep 1 - Dec 20, 2024
  - Term 2: Jan 5 - Mar 28, 2025
- **Grade Levels:** 12 (Grades 1-12)
- **Periods per Day:** 6
  - Period 1: 08:00-08:45
  - Period 2: 08:50-09:35
  - Period 3: 09:40-10:25
  - Period 4: 10:30-11:15
  - Period 5: 11:20-12:05
  - Period 6: 12:10-12:55

### Departments & Subjects
- **Departments:** 5
  - Mathematics (MATH)
  - Sciences (SCI)
  - Languages (LANG)
  - Social Studies (SOC)
  - Arts (ART)

- **Subjects:** 12
  - Mathematics, Algebra
  - Physics, Chemistry, Biology
  - Arabic, English
  - History, Geography, Islamic Studies
  - Art, Music

### Infrastructure
- **Classrooms:** 20 (Room 1 - Room 20, capacity 30 each)
- **Classroom Types:** 1 (Standard)

### People
- **Teachers:** 15
  - Assigned to random departments
  - Mix of male/female (gender alternating)
  - Email pattern: `firstname.surname.teacher{N}@portsudan.edu.sd`
  - Password: `password123` (hashed with bcryptjs)

- **Students:** 50
  - Ages 12-17 (born 2008-2013)
  - Mix of male/female (gender alternating)
  - Email pattern: `firstname.surname.student{N}@portsudan.edu.sd`
  - Each has 2 guardians (Father + Mother)
  - Password: `password123`

- **Guardians:** 100 (50 fathers + 50 mothers)
  - Email pattern: `father{N}@portsudan.edu.sd`, `mother{N}@portsudan.edu.sd`
  - Linked to students via StudentGuardian table
  - Mother is primary contact
  - Password: `password123`

### Classes & Enrollment
- **Classes:** 12 (Grades 1-6, sections A & B)
  - Grade 1A, Grade 1B
  - Grade 2A, Grade 2B
  - ... up to Grade 6B
  - Each class assigned: Teacher, Subject, Classroom
  - Capacity: 30 students per class

- **Student Enrollments:**
  - 4 students per class (48 total enrolled)
  - Distributed across Grade 1-6

### Timetable
- **Week Configuration:**
  - Working Days: Sunday to Thursday (0-4)
  - Weekend: Friday & Saturday
  - Lunch: After Period 4

- **Timetable Slots:** ~240 slots
  - 12 classes × 5 days × 4 periods
  - Each slot includes: Class, Teacher, Classroom, Day, Period
  - All slots for Term 1
  - Week offset: 0 (current week)

---

## Database Tables Populated

| Entity | Count | Notes |
|--------|-------|-------|
| School | 1 | Port Sudan |
| SchoolYear | 1 | 2024-2025 |
| Term | 2 | Fall & Spring |
| YearLevel | 12 | Grades 1-12 |
| Period | 6 | Daily schedule |
| Department | 5 | Academic divisions |
| Subject | 12 | Course catalog |
| ClassroomType | 1 | Standard |
| Classroom | 20 | Physical rooms |
| GuardianType | 2 | Father, Mother |
| **User** | **165** | **15 teachers + 50 students + 100 guardians** |
| Teacher | 15 | Faculty |
| TeacherDepartment | 15 | Assignments |
| Student | 50 | Enrolled |
| Guardian | 100 | Parents |
| StudentGuardian | 100 | Relationships |
| Class | 12 | Grade sections |
| StudentClass | 48 | Enrollments |
| **Timetable** | **~240** | **Schedule slots** |
| SchoolWeekConfig | 1 | Week setup |

**Total Records:** ~750+ across all tables

---

## Safety Features

### Idempotent Design
All operations use `upsert` instead of `create`:
```typescript
await prisma.school.upsert({
  where: { domain: 'portsudan' },
  update: {},  // Does nothing if exists
  create: { /* new data */ }
})
```

**Benefits:**
- ✅ Can run multiple times without errors
- ✅ No duplicate data
- ✅ Safe to re-run after failures
- ✅ No "Unique constraint failed" errors

### Conflict Prevention
- All unique constraints respected
- Uses composite keys for multi-tenant safety
- Email + schoolId uniqueness enforced
- userId uniqueness enforced

---

## Expected Output

```bash
🌱 Starting comprehensive seed for Port Sudan International School...

📚 Setting up school...
✅ School: Port Sudan International School

📅 Creating academic structure...
✅ Academic structure: 12 grades, 6 periods, 2 terms

📖 Creating departments and subjects...
✅ 5 departments, 12 subjects

🏫 Creating classrooms...
✅ 20 classrooms

👨‍🏫 Creating teachers...
✅ 15 teachers

👨‍🎓 Creating students and guardians...
✅ 50 students with guardians

📚 Creating classes...
✅ 12 classes with student enrollments

📅 Creating timetable...
✅ 240 timetable slots

═══════════════════════════════════════════════════════
🎉 SEED COMPLETE FOR PORT SUDAN INTERNATIONAL SCHOOL
═══════════════════════════════════════════════════════
📚 School: Port Sudan International School
🌐 Domain: portsudan
📊 Year Levels: 12
📅 Periods: 6
📖 Subjects: 12
👨‍🏫 Teachers: 15
👨‍🎓 Students: 50
🏫 Classrooms: 20
📚 Classes: 12
📅 Timetable Slots: 240
═══════════════════════════════════════════════════════

✅ Ready to view timetable at: https://portsudan.databayt.org/en/timetable
🔑 Test login: Any teacher/student email with password: password123
```

---

## Verification Steps

After seeding, verify the data:

### 1. Check Database (Prisma Studio)
```bash
npx prisma studio
```

Navigate to:
- **School** table → should show "Port Sudan International School"
- **Timetable** table → should show ~240 records
- **Student** table → should show 50 records
- **Teacher** table → should show 15 records

### 2. Test Login
Visit: https://portsudan.databayt.org/en/auth/signin

Try logging in with:
- **Email:** `ahmed.al-hassan.teacher0@portsudan.edu.sd`
- **Password:** `password123`
- **Role:** Teacher

### 3. View Timetable
After logging in, navigate to:
https://portsudan.databayt.org/en/timetable

**Expected Result:**
- ✅ Timetable loads without errors
- ✅ Shows Sunday-Thursday schedule
- ✅ Shows 4-6 periods per day
- ✅ Each cell shows subject and teacher
- ✅ Can toggle between current/next week

---

## Troubleshooting

### Database Connection Error
```
Can't reach database server at ep-fancy-art-aemvq040-pooler...
```

**Solution:** Check `.env` file has correct `DATABASE_URL`
```bash
# .env
DATABASE_URL="postgresql://..."
```

### Unique Constraint Error (Should NOT happen)
```
Unique constraint failed on the fields: (`userId`)
```

**Why this won't happen:** Script uses `upsert` everywhere

**If it does happen:** Check for concurrent seed runs

### Slow Performance
**Normal:** 30-60 seconds for 750+ records
**Slow:** >2 minutes

**Solution:**
- Check network latency to Neon database
- Run from server closer to database region
- Use connection pooling

---

## Deployment Checklist

- [ ] Database is accessible
- [ ] `.env` has correct `DATABASE_URL`
- [ ] Prisma client is generated (`pnpm prisma generate`)
- [ ] Run seed script: `npx tsx prisma/seed-portsudan-complete.ts`
- [ ] Verify data in Prisma Studio
- [ ] Test login with teacher account
- [ ] View timetable at https://portsudan.databayt.org/en/timetable
- [ ] Verify schedule displays correctly
- [ ] Test week toggle functionality

---

## Post-Deployment

### Update Test Accounts
After seeding, admins should:
1. Change default passwords
2. Add real teacher/student data
3. Update guardian contact information
4. Customize timetable slots
5. Configure school branding

### Production Considerations
- **Security:** Change all default passwords immediately
- **Data:** Replace seed data with real information
- **Backup:** Take database backup before modifications
- **Monitoring:** Watch for performance issues with 50+ students

---

## Related Documentation

- **Timetable Review:** [TIMETABLE_REVIEW.md](./TIMETABLE_REVIEW.md)
- **Timetable README:** [src/components/platform/timetable/README.md](./src/components/platform/timetable/README.md)
- **Timetable Issues:** [src/components/platform/timetable/ISSUE.md](./src/components/platform/timetable/ISSUE.md)

---

**Script Location:** `prisma/seed-portsudan-complete.ts`
**Created:** 2025-10-21
**Status:** ✅ Ready for production deployment
