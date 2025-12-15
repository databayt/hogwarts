/**
 * Reconciliation Panel - Enhanced (Placeholder)
 *
 * This file has been temporarily stubbed out because it depends on
 * actions-enhanced.ts files that were deleted due to schema incompatibility.
 *
 * TODO: Regenerate enhanced reconciliation functionality from correct Prisma schema
 */

interface ReconciliationPanelProps {
  accounts: any[]
  selectedAccountId?: string
  reconciliationHistory?: any
}

export function ReconciliationPanel({
  accounts,
  selectedAccountId,
  reconciliationHistory,
}: ReconciliationPanelProps) {
  return (
    <div className="text-muted-foreground p-8 text-center">
      <p>Enhanced reconciliation panel is currently unavailable.</p>
      <p className="mt-2 text-sm">
        Please use the standard reconciliation interface.
      </p>
    </div>
  )
}
