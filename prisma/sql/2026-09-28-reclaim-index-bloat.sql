-- Applied to production (Neon square-hall-52214783, branch production) on 2026-09-28.
-- Restore point: br-sweet-dust-ad5exmt8 (restore-point-before-reindex-2026-09-28).
--
-- Why: the branch was 522 MB of the free plan's 512 MiB cap (97 %); at the cap
-- every write fails. The space was index bloat — attendances had 25 MB of rows
-- and 63 MB of indexes, student_classes 2.8 MB of rows and 12 MB of indexes
-- (btree estimate: 60–89 % empty pages). Result: all databases 484 MB → 383 MB.
--
-- Every statement is CONCURRENTLY and non-destructive to data. Re-run the whole
-- file whenever bulk seeds or deletes bloat the indexes again; it is idempotent.
-- Must run outside a transaction block, one statement at a time, and per index
-- on the big tables: REINDEX TABLE CONCURRENTLY attendances would need ~30 MB of
-- temporary space at once.

-- Never scanned in the recorded history; [schoolId, examId] serves their queries.
-- Also removed from prisma/models/school-exam.prisma so `db push` won't restore them.
DROP INDEX CONCURRENTLY IF EXISTS "exam_results_schoolId_examId_percentage_idx";
DROP INDEX CONCURRENTLY IF EXISTS "exam_results_schoolId_examId_marksObtained_idx";

REINDEX INDEX CONCURRENTLY "student_classes_schoolId_studentId_classId_key";
REINDEX INDEX CONCURRENTLY "student_classes_pkey";
REINDEX INDEX CONCURRENTLY "notifications_schoolId_userId_read_createdAt_idx";
REINDEX INDEX CONCURRENTLY "notifications_schoolId_type_createdAt_idx";
REINDEX INDEX CONCURRENTLY "notifications_pkey";
REINDEX INDEX CONCURRENTLY "notifications_expiresAt_idx";
REINDEX INDEX CONCURRENTLY "attendances_schoolId_studentId_classId_date_periodId_key";
REINDEX INDEX CONCURRENTLY "attendances_schoolId_studentId_sectionId_date_periodId_key";
REINDEX INDEX CONCURRENTLY "attendances_schoolId_studentId_date_idx";
REINDEX INDEX CONCURRENTLY "attendances_pkey";
REINDEX TABLE CONCURRENTLY "assignment_submissions";
REINDEX TABLE CONCURRENTLY "exam_results";
REINDEX TABLE CONCURRENTLY "notification_delivery_logs";
REINDEX TABLE CONCURRENTLY "TimesheetEntry";
REINDEX TABLE CONCURRENTLY "catalog_exam_questions";
REINDEX INDEX CONCURRENTLY "catalog_questions_pkey";
REINDEX INDEX CONCURRENTLY "catalog_lessons_chapterId_slug_key";
REINDEX INDEX CONCURRENTLY "User_email_schoolId_key";

-- Leftover check (a failed concurrent rebuild leaves an invalid *_ccnew index):
-- SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
--  WHERE NOT i.indisvalid;
