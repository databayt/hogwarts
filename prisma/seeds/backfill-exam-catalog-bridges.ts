/**
 * Backfill catalogSubjectId on existing Exam records (OBSOLETE)
 *
 * The Subject model has been removed. Exam.subjectId now points
 * directly to Subject, so no backfill is needed.
 *
 * This function is kept as a no-op for backward compatibility
 * with single.ts registry.
 */

export async function backfillExamCatalogBridges() {
  console.log("\n--- Backfill Exam Catalog Bridges ---")
  console.log(
    "  No-op: Subject model removed. Exam.subjectId now points directly to Subject."
  )
}

// Direct execution
if (require.main === module) {
  backfillExamCatalogBridges()
}
