-- Canonicalize curriculum codes to the scheme documented in /docs/catalog
-- "Curricula & codes": a bare ISO 3166-1 country code for a national curriculum
-- (US, SD, GB, SA, EG, AE, QA, KW, JO) and `{body}-{programme}` for a
-- transnational programme (IB-DP). Replaces the legacy `Curriculum.code` /
-- `Subject.curriculum` values ("us-k12", "national" [collided across countries],
-- "ib"). Slugs (`Curriculum.slug` = "gb-national", "us-k12", …) are NOT changed.
--
-- DEPLOY ORDERING: run this AFTER the canonicalized code is deployed. The
-- deployed `inferCurriculum()` and the seeded `Subject.curriculum` must agree on
-- the canonical value; applying this while old code is live would make
-- findSubjects() mismatch and fall back to the US baseline.
--
-- IDEMPOTENT: each statement only matches the legacy values, so re-running after
-- the first apply is a no-op. Non-destructive (value UPDATEs + one DEFAULT change).

-- Curriculum.code (catalog_curricula): "country" disambiguates the collided "national"
UPDATE "catalog_curricula" SET "code" = 'US'        WHERE "code" = 'us-k12';
UPDATE "catalog_curricula" SET "code" = 'IB-DP'     WHERE "code" = 'ib';
UPDATE "catalog_curricula" SET "code" = "country"   WHERE "code" = 'national';

-- Subject.curriculum (catalog_subjects): mirrors Curriculum.code (seeded from cur.code)
UPDATE "catalog_subjects" SET "curriculum" = 'US'         WHERE "curriculum" = 'us-k12';
UPDATE "catalog_subjects" SET "curriculum" = 'IB-DP'      WHERE "curriculum" = 'ib';
UPDATE "catalog_subjects" SET "curriculum" = "country"    WHERE "curriculum" = 'national';

-- New column default (was 'national') to match the canonical scheme + country default
ALTER TABLE "catalog_subjects" ALTER COLUMN "curriculum" SET DEFAULT 'SD';
