-- Backfill (idempotent, fills NULLs only — never overwrites). Run branch-first,
-- then on main with approval, AFTER migration 20261004160000_attendance_scope.
--
-- Gives attendance rows recorded against a class the student's section, so
-- section views, teacher scoping and reports see them. Only where the class
-- and the student's section are of the same grade (or the class has none):
-- a mark is never moved to a section in another grade. Rows left over keep
-- their class and are dealt with before classId is dropped (Phase 4).
--
-- Collision-safe: a daily row (periodId NULL) cannot clash on the section
-- unique key (NULLs are distinct); a period row is skipped if the student
-- already has a section row for that date and period.

UPDATE "attendances" AS a
SET "sectionId" = s."sectionId"
FROM "students" AS s, "sections" AS sec, "classes" AS c
WHERE a."studentId" = s."id"
  AND a."classId" = c."id"
  AND s."sectionId" = sec."id"
  AND a."schoolId" = s."schoolId"
  AND a."schoolId" = c."schoolId"
  AND a."sectionId" IS NULL
  AND (c."gradeId" IS NULL OR c."gradeId" = sec."gradeId")
  AND NOT EXISTS (
    SELECT 1 FROM "attendances" AS x
    WHERE x."schoolId" = a."schoolId"
      AND x."studentId" = a."studentId"
      AND x."sectionId" = s."sectionId"
      AND x."date" = a."date"
      AND x."periodId" = a."periodId"
  );

-- Hall passes kept from before: the student's section, same rule.
UPDATE "hall_passes" AS h
SET "sectionId" = s."sectionId"
FROM "students" AS s, "sections" AS sec, "classes" AS c
WHERE h."studentId" = s."id"
  AND h."classId" = c."id"
  AND s."sectionId" = sec."id"
  AND h."schoolId" = s."schoolId"
  AND h."sectionId" IS NULL
  AND (c."gradeId" IS NULL OR c."gradeId" = sec."gradeId");

-- Check: class rows still without a section (the cross-grade leftovers).
-- SELECT count(*) FROM "attendances" WHERE "classId" IS NOT NULL AND "sectionId" IS NULL;
