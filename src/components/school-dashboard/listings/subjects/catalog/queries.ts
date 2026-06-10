// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * Subjects this school requested (Proposal type SUBJECT) that the operator has
 * approved+published to the global catalog. The catalog picker pins these on
 * top with an "Add" CTA until the school adopts them (opt-in flow — approval
 * does NOT auto-bridge).
 */
export async function getApprovedSubjectProposals(
  schoolId: string
): Promise<Array<{ catalogEntityId: string | null }>> {
  return db.proposal.findMany({
    where: {
      schoolId,
      type: "SUBJECT",
      status: "PUBLISHED",
      catalogEntityId: { not: null },
    },
    orderBy: { reviewedAt: "desc" },
    select: { catalogEntityId: true },
  })
}

/**
 * Pure filter: approved-proposal subject ids that the school has NOT yet
 * selected (for any grade), deduped, newest-approval first.
 */
export function filterPinnedSubjectIds(
  proposals: Array<{ catalogEntityId: string | null }>,
  selectedSubjectIds: ReadonlySet<string>
): string[] {
  const seen = new Set<string>()
  const pinned: string[] = []
  for (const p of proposals) {
    const id = p.catalogEntityId
    if (id && !selectedSubjectIds.has(id) && !seen.has(id)) {
      seen.add(id)
      pinned.push(id)
    }
  }
  return pinned
}
