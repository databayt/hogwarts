/**
 * Bulk Invoice Generation - Enhanced (Placeholder)
 *
 * This file has been temporarily stubbed out because it depends on
 * actions-enhanced.ts files that were deleted due to schema incompatibility.
 *
 * TODO: Regenerate bulk generation functionality from correct Prisma schema
 */

interface BulkGenerateFormProps {
  terms: { id: string; name: string }[]
  yearLevels: { id: string; name: string }[]
  classes: { id: string; name: string }[]
  feeStructures: { id: string; name: string; amount: number }[]
}

export function BulkGenerateForm({
  terms,
  yearLevels,
  classes,
  feeStructures,
}: BulkGenerateFormProps) {
  return (
    <div className="text-muted-foreground p-8 text-center">
      <p>Bulk invoice generation is currently unavailable.</p>
      <p className="mt-2 text-sm">Please generate invoices individually.</p>
    </div>
  )
}
