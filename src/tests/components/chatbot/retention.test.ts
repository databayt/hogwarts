// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { GET } from "@/app/api/cron/chatbot-retention/route"

vi.mock("@/lib/db", () => ({
  db: { $queryRaw: vi.fn(), $executeRaw: vi.fn() },
}))
vi.mock("@/components/chatbot/identity", () => ({ VISITOR_TTL_DAYS: 90 }))

const call = (query = "", secret = "s3cret") =>
  GET(
    new NextRequest(`https://balqalam.com/api/cron/chatbot-retention${query}`, {
      headers: { authorization: `Bearer ${secret}` },
    })
  )

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = "s3cret"
})

describe("chatbot retention", () => {
  it("needs the cron secret", async () => {
    expect((await call("", "wrong")).status).toBe(401)
    expect(db.$executeRaw).not.toHaveBeenCalled()
  })

  it("only counts on a dry run", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ count: BigInt(7) }] as never)
    const body = await (await call("?dryRun=1")).json()
    expect(body).toMatchObject({ dryRun: true, wouldDelete: 7 })
    expect(db.$executeRaw).not.toHaveBeenCalled()
  })

  it("deletes in batches until a short one", async () => {
    vi.mocked(db.$executeRaw)
      .mockResolvedValueOnce(1000 as never)
      .mockResolvedValueOnce(12 as never)
    const body = await (await call()).json()
    expect(body.deleted).toEqual({ visitorProfiles: 1012 })
    expect(db.$executeRaw).toHaveBeenCalledTimes(2)
  })
})
