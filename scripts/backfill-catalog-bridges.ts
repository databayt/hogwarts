/**
 * Backfill Subject.catalogSubjectId (OBSOLETE)
 *
 * The Subject model has been removed. All FKs now point directly
 * to CatalogSubject. This script is kept as a no-op.
 *
 * Usage: npx tsx scripts/backfill-catalog-bridges.ts
 */

export {}

async function main() {
  console.log(
    "No-op: Subject model removed. All FKs now point directly to CatalogSubject."
  )
}

main()
