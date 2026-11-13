// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import { deliverCredentials } from "@/lib/credentials-delivery"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.user.findUnique).mockResolvedValue({
    email: "noor@example.com",
  } as never)
})

const school = (over: Record<string, unknown> = {}) => ({
  preferredLanguage: "ar",
  name: "مدارس الإبداع",
  domain: "alabidae",
  ...over,
})

describe("deliverCredentials — the sign-in link", () => {
  it("points at the school's own host on the live root, not the retired one", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(school() as never)

    const r = await deliverCredentials({
      schoolId: "s1",
      userId: "u1",
      username: "260070",
      tempPassword: "1122",
      isFirstTime: true,
    })

    expect(r).toEqual({ notified: true })
    const sent = vi.mocked(dispatchNotification).mock.calls[0]![0]
    expect(sent.body).toContain("https://alabidae.balqalam.com/ar/login")
    expect(sent.body).not.toContain("databayt.org")
    expect(sent.metadata).toMatchObject({
      loginUrl: "https://alabidae.balqalam.com/ar/login",
      url: "https://alabidae.balqalam.com/ar/login",
    })
  })

  it("uses the school's language in the path", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(
      school({ preferredLanguage: "en", domain: "kingfahd" }) as never
    )

    await deliverCredentials({
      schoolId: "s1",
      userId: "u1",
      username: "260070",
      tempPassword: "1122",
      isFirstTime: false,
    })

    const sent = vi.mocked(dispatchNotification).mock.calls[0]![0]
    expect(sent.body).toContain("https://kingfahd.balqalam.com/en/login")
  })

  it("falls back to the live platform host for a school with no subdomain", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(
      school({ domain: null }) as never
    )

    await deliverCredentials({
      schoolId: "s1",
      userId: "u1",
      username: "260070",
      tempPassword: null,
      isFirstTime: false,
    })

    const sent = vi.mocked(dispatchNotification).mock.calls[0]![0]
    expect(sent.body).toContain("https://balqalam.com/ar/login")
    expect(sent.body).not.toContain("databayt.org")
  })
})
