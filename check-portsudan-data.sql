-- Check Port Sudan International School data
SELECT
  'School' as entity,
  COUNT(*) as count
FROM schools
WHERE domain = 'portsudan'

UNION ALL

SELECT
  'Terms' as entity,
  COUNT(*) as count
FROM terms
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan')

UNION ALL

SELECT
  'Classes' as entity,
  COUNT(*) as count
FROM classes
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan')

UNION ALL

SELECT
  'Subjects' as entity,
  COUNT(*) as count
FROM subjects
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan')

UNION ALL

SELECT
  'Teachers' as entity,
  COUNT(*) as count
FROM teachers
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan')

UNION ALL

SELECT
  'Periods' as entity,
  COUNT(*) as count
FROM periods
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan')

UNION ALL

SELECT
  'Timetable Slots' as entity,
  COUNT(*) as count
FROM timetables
WHERE "schoolId" IN (SELECT id FROM schools WHERE domain = 'portsudan');
