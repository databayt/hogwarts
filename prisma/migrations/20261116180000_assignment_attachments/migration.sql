-- Teacher-attached files (images / PDFs) on an assignment. Additive.
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
