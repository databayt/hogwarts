// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  filterPinnedSubjectIds,
  getApprovedSubjectProposals,
} from "@/components/school-dashboard/listings/subjects/catalog/queries"

vi.mock("@/lib/db", () => ({
  db: {
    proposal: {
      findMany: vi.fn(),
    },
  },
}))

describe("Catalog pinned-subjects queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getApprovedSubjectProposals", () => {
    it("queries only this school's PUBLISHED SUBJECT proposals with a catalog entity", async () => {
      vi.mocked(db.proposal.findMany).mockResolvedValue([] as any)

      await getApprovedSubjectProposals("school-1")

      expect(db.proposal.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: "school-1",
          type: "SUBJECT",
          status: "PUBLISHED",
          catalogEntityId: { not: null },
        },
        orderBy: { reviewedAt: "desc" },
        select: { catalogEntityId: true },
      })
    })

    it("returns the rows from the db", async () => {
      vi.mocked(db.proposal.findMany).mockResolvedValue([
        { catalogEntityId: "cs-1" },
      ] as any)

      const result = await getApprovedSubjectProposals("school-1")

      expect(result).toEqual([{ catalogEntityId: "cs-1" }])
    })
  })

  describe("filterPinnedSubjectIds", () => {
    it("excludes subjects the school already selected", () => {
      const pinned = filterPinnedSubjectIds(
        [{ catalogEntityId: "cs-1" }, { catalogEntityId: "cs-2" }],
        new Set(["cs-1"])
      )

      expect(pinned).toEqual(["cs-2"])
    })

    it("drops null entity ids and dedupes, preserving newest-first order", () => {
      const pinned = filterPinnedSubjectIds(
        [
          { catalogEntityId: "cs-2" },
          { catalogEntityId: null },
          { catalogEntityId: "cs-1" },
          { catalogEntityId: "cs-2" },
        ],
        new Set()
      )

      expect(pinned).toEqual(["cs-2", "cs-1"])
    })

    it("returns empty when everything is already selected", () => {
      const pinned = filterPinnedSubjectIds(
        [{ catalogEntityId: "cs-1" }],
        new Set(["cs-1"])
      )

      expect(pinned).toEqual([])
    })
  })
})
