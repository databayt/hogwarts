-- Class removal, Phase 4 (S17) — DESTRUCTIVE. Approved by Abdout 2026-10-04.
-- Run only after 04-exams-assignments-scope.sql, behind a Neon restore point
-- (kept 14 days), rehearsed on a branch first. One transaction: any failure
-- leaves the database untouched.
--
-- Preconditions (each must be 0 before this runs — see the guard below):
--   exams / assignments with classId but no gradeId
--   results with classId but no grade or section
--   timetables with classId but no section
--   announcements with classId but no grade or section

BEGIN;

DO $$
DECLARE n bigint;
BEGIN
  SELECT
    (SELECT count(*) FROM exams WHERE "classId" IS NOT NULL AND "gradeId" IS NULL)
  + (SELECT count(*) FROM assignments WHERE "classId" IS NOT NULL AND "gradeId" IS NULL)
  + (SELECT count(*) FROM results WHERE "classId" IS NOT NULL AND "academicGradeId" IS NULL AND "sectionId" IS NULL)
  + (SELECT count(*) FROM timetables WHERE "classId" IS NOT NULL AND "sectionId" IS NULL)
  + (SELECT count(*) FROM announcements WHERE "classId" IS NOT NULL AND "gradeId" IS NULL AND "sectionId" IS NULL)
  INTO n;
  IF n > 0 THEN
    RAISE EXCEPTION 'class removal precondition failed: % class-only rows remain', n;
  END IF;
END $$;

-- Leftover demo rows that never mapped to a section: cross-grade attendance
-- marks and class competition entries.
DELETE FROM attendances WHERE "classId" IS NOT NULL AND "sectionId" IS NULL;
DELETE FROM class_competition_entries WHERE "classId" IS NOT NULL AND "sectionId" IS NULL;

-- classId columns (their foreign keys and indexes go with them)
ALTER TABLE announcements             DROP COLUMN IF EXISTS "classId";
ALTER TABLE announcement_templates    DROP COLUMN IF EXISTS "classId";
ALTER TABLE assignments               DROP COLUMN IF EXISTS "classId";
ALTER TABLE attendance_sessions       DROP COLUMN IF EXISTS "classId";
ALTER TABLE attendances               DROP COLUMN IF EXISTS "classId";
ALTER TABLE class_competition_entries DROP COLUMN IF EXISTS "classId";
ALTER TABLE conversations             DROP COLUMN IF EXISTS "classId";
ALTER TABLE exams                     DROP COLUMN IF EXISTS "classId";
ALTER TABLE "FeeStructure"            DROP COLUMN IF EXISTS "classId";
ALTER TABLE hall_passes               DROP COLUMN IF EXISTS "classId";
ALTER TABLE progress_report_schedules DROP COLUMN IF EXISTS "classId";
ALTER TABLE qr_code_sessions          DROP COLUMN IF EXISTS "classId";
ALTER TABLE quick_assessments         DROP COLUMN IF EXISTS "classId";
ALTER TABLE results                   DROP COLUMN IF EXISTS "classId";
ALTER TABLE timetables                DROP COLUMN IF EXISTS "classId";
ALTER TABLE whatsapp_groups           DROP COLUMN IF EXISTS "classId";
ALTER TABLE notification_batches      DROP COLUMN IF EXISTS "targetClassId";
ALTER TABLE schedule_exceptions       DROP COLUMN IF EXISTS "affectedClassIds";

-- The class tables themselves. No CASCADE: anything still pointing at them
-- must fail the transaction rather than be dropped silently.
DROP TABLE IF EXISTS class_teachers;
DROP TABLE IF EXISTS student_classes;
DROP TABLE IF EXISTS classes;
DROP TYPE IF EXISTS "EvaluationType";

COMMIT;
