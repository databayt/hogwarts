// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { cache } from "react"

import { db } from "@/lib/db"

export interface CatalogPendingCounts {
  questionPending: number
  bookPending: number
  materialPending: number
  assignmentPending: number
  videoPending: number
  proposalPending: number
  /** Everything the /catalog/approvals queue lists (proposals have their own tab). */
  totalApprovalsPending: number
}

/**
 * Pending review counts across the whole platform. Cross-tenant on purpose —
 * this is the saas-dashboard block's documented exception to schoolId scoping.
 *
 * Wrapped in React `cache()` so the catalog layout and the outer dashboard
 * layout share one set of queries per request instead of running six each.
 * Not `"use server"`: a server-only read, never a browser-reachable RPC.
 */
export const getCatalogPendingCounts = cache(
  async (): Promise<CatalogPendingCounts> => {
    const [
      questionPending,
      bookPending,
      materialPending,
      assignmentPending,
      videoPending,
      proposalPending,
    ] = await Promise.all([
      db.question.count({ where: { approvalStatus: "PENDING" } }),
      db.book.count({ where: { approvalStatus: "PENDING" } }),
      db.material.count({ where: { approvalStatus: "PENDING" } }),
      db.assignment.count({ where: { approvalStatus: "PENDING" } }),
      db.video.count({ where: { approvalStatus: "PENDING" } }),
      db.proposal.count({ where: { status: "SUBMITTED" } }),
    ])

    return {
      questionPending,
      bookPending,
      materialPending,
      assignmentPending,
      videoPending,
      proposalPending,
      totalApprovalsPending:
        questionPending +
        bookPending +
        materialPending +
        assignmentPending +
        videoPending,
    }
  }
)
