-- Backfill (idempotent, fills NULLs only — never overwrites). Run branch-first,
-- then on main with approval, AFTER migration 20261004140000_result_scope.
--
-- Gives legacy gradebook rows the scope new rows carry, so report cards and
-- the grades UI stop needing the class: the term and grade of the row's class,
-- the class's subject, and the student's section.
--
-- Note: some seeded rows carry a subjectId that disagrees with their class's
-- subject. This script leaves those alone; report cards trust the class while
-- it exists. Reconcile them before classId is dropped (Phase 4).

UPDATE "results" AS r
SET
  "termId"          = COALESCE(r."termId", c."termId"),
  "subjectId"       = COALESCE(r."subjectId", c."subjectId"),
  "academicGradeId" = COALESCE(r."academicGradeId", c."gradeId", s."academicGradeId"),
  "sectionId"       = COALESCE(r."sectionId", s."sectionId")
FROM "classes" AS c, "students" AS s
WHERE r."classId" = c."id"
  AND r."studentId" = s."id"
  AND r."schoolId" = c."schoolId"
  AND (
    r."termId" IS NULL
    OR r."subjectId" IS NULL
    OR r."academicGradeId" IS NULL
    OR (r."sectionId" IS NULL AND s."sectionId" IS NOT NULL)
  );

-- Check: rows that still lack a term (should be 0 for rows with a class).
-- SELECT count(*) FROM "results" WHERE "classId" IS NOT NULL AND "termId" IS NULL;
