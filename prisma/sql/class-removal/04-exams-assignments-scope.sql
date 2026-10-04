-- Class removal, Phase 4 precondition: give the last class-only work its scope
-- before the classId columns go (S17).
--
-- Exams and assignments created through a class (the seeded demo: 401 exams,
-- 764 assignments on prod) were still read through the legacy class arm.
-- They become whole-grade work: the class's grade and term, set by the
-- class's teacher. An exam keeps its own subjectId — its results already
-- agree with it (209 seeded exams disagree with their class's subject).
-- Announcements sent to a class go to the class's grade.
--
-- Idempotent: only rows with no grade yet are touched.

UPDATE exams e
SET
  "gradeId"     = c."gradeId",
  "termId"      = COALESCE(e."termId", c."termId"),
  "createdById" = COALESCE(e."createdById", t."userId")
FROM classes c
LEFT JOIN teachers t ON t.id = c."teacherId"
WHERE e."classId" = c.id
  AND e."schoolId" = c."schoolId"
  AND e."gradeId" IS NULL
  AND c."gradeId" IS NOT NULL;

UPDATE assignments a
SET
  "gradeId"     = c."gradeId",
  "subjectId"   = COALESCE(a."subjectId", c."subjectId"),
  "termId"      = COALESCE(a."termId", c."termId"),
  "createdById" = COALESCE(a."createdById", t."userId")
FROM classes c
LEFT JOIN teachers t ON t.id = c."teacherId"
WHERE a."classId" = c.id
  AND a."schoolId" = c."schoolId"
  AND a."gradeId" IS NULL
  AND c."gradeId" IS NOT NULL;

UPDATE announcements an
SET
  "gradeId" = c."gradeId",
  scope     = 'grade'
FROM classes c
WHERE an."classId" = c.id
  AND an."schoolId" = c."schoolId"
  AND an."gradeId" IS NULL
  AND an."sectionId" IS NULL
  AND c."gradeId" IS NOT NULL;
