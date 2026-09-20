-- Rename the shared visual concepts to generic one-word slugs (2026-09-20).
--
-- The concept slug is stored in four places, and EVERY one of them must move
-- together, because `conceptArchive()` falls back to the raw concept name when
-- it is not in CONCEPT_TO_ARCHIVE — so a row left on an old name silently
-- resolves to a clickview key that does not exist (a 0x0 broken image, not an
-- error). The child tables are the easy ones to miss: catalog_chapters and
-- catalog_lessons carry their own `thumbnailKey`, 9,195 rows of it locally.
--
--   1. <table>.concept                              (subjects, chapters, lessons)
--   2. catalog_subjects.cover      catalog/concepts/<concept>/cover
--   3. catalog_subjects.thumbnailKey / .bannerUrl   catalog/concepts/g<N>-<concept>/{thumbnail,banner}
--   4. catalog_chapters.thumbnailKey / catalog_lessons.thumbnailKey  (same legacy shape)
--
-- Idempotent: re-running matches nothing. Run against prod at deploy time,
-- behind a Neon restore point — the code ships the new names and prod's rows
-- are still on the old ones until this runs.
--
--   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f scripts/catalog/rename-concepts.sql

BEGIN;

CREATE TEMP TABLE concept_rename(old text PRIMARY KEY, new text) ON COMMIT DROP;
INSERT INTO concept_rename(old, new) VALUES
  ('earth-science','earth'), ('languages','language'), ('arts','art'),
  ('biology','life'), ('life-skills','skills'), ('pe','sport'),
  ('economics','economy'), ('sociology','society'), ('teacher-pd','teaching'),
  ('career-tech','career'), ('computer-science','computer'),
  ('celebrations','celebration'), ('psychology','mind'), ('civics','civic'),
  ('religion','faith');

-- 1. the concept columns
UPDATE catalog_subjects s SET concept = r.new FROM concept_rename r WHERE s.concept = r.old;
UPDATE catalog_chapters c SET concept = r.new FROM concept_rename r WHERE c.concept = r.old;
UPDATE catalog_lessons  l SET concept = r.new FROM concept_rename r WHERE l.concept = r.old;

-- 2. the flat concept cover key
UPDATE catalog_subjects s SET cover = 'catalog/concepts/' || r.new || '/cover'
FROM concept_rename r WHERE s.cover = 'catalog/concepts/' || r.old || '/cover';

-- 3 + 4. the legacy grade-scoped art keys, on all three tables that carry them
UPDATE catalog_subjects s
SET "thumbnailKey" = regexp_replace(s."thumbnailKey", '^catalog/concepts/(g[0-9]+)-' || r.old || '/(thumbnail|banner)$', 'catalog/concepts/\1-' || r.new || '/\2')
FROM concept_rename r
WHERE s."thumbnailKey" ~ ('^catalog/concepts/g[0-9]+-' || r.old || '/(thumbnail|banner)$');

UPDATE catalog_subjects s
SET "bannerUrl" = regexp_replace(s."bannerUrl", '^catalog/concepts/(g[0-9]+)-' || r.old || '/(thumbnail|banner)$', 'catalog/concepts/\1-' || r.new || '/\2')
FROM concept_rename r
WHERE s."bannerUrl" ~ ('^catalog/concepts/g[0-9]+-' || r.old || '/(thumbnail|banner)$');

UPDATE catalog_chapters c
SET "thumbnailKey" = regexp_replace(c."thumbnailKey", '^catalog/concepts/(g[0-9]+)-' || r.old || '/(thumbnail|banner)$', 'catalog/concepts/\1-' || r.new || '/\2')
FROM concept_rename r
WHERE c."thumbnailKey" ~ ('^catalog/concepts/g[0-9]+-' || r.old || '/(thumbnail|banner)$');

UPDATE catalog_lessons l
SET "thumbnailKey" = regexp_replace(l."thumbnailKey", '^catalog/concepts/(g[0-9]+)-' || r.old || '/(thumbnail|banner)$', 'catalog/concepts/\1-' || r.new || '/\2')
FROM concept_rename r
WHERE l."thumbnailKey" ~ ('^catalog/concepts/g[0-9]+-' || r.old || '/(thumbnail|banner)$');

COMMIT;
