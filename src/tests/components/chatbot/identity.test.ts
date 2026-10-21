// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { ensurePlatformSchool } from "@/lib/platform-tenant"
import {
  forgetVisitor,
  keyHash,
  profileFor,
  VISITOR_COOKIE,
} from "@/components/chatbot/identity"

const jar = new Map<string, string>()
const setCookie = vi.fn((name: string, value: string) => jar.set(name, value))
const deleteCookie = vi.fn((name: string) => jar.delete(name))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: setCookie,
    delete: deleteCookie,
  }),
}))
vi.mock("@/lib/platform-tenant", () => ({
  PLATFORM_SCHOOL_ID: "platform",
  ensurePlatformSchool: vi.fn(async () => {}),
}))
vi.mock("@/lib/db", () => ({
  db: {
    chatbotProfile: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

const SCHOOL = {
  kind: "school",
  schoolId: "s1",
  subdomain: "kingfahd",
} as const
const PLATFORM = { kind: "platform", schoolId: "platform" } as const
const p = vi.mocked(db.chatbotProfile)
const row = { id: "p1", schoolId: "s1", memoryEnabled: true }
const KEY = "abcdefghijklmnopqrstuv" // 22 base64url characters

beforeEach(() => {
  vi.clearAllMocks()
  jar.clear()
  p.findFirst.mockResolvedValue(null as never)
  p.create.mockImplementation((async (args: { data: object }) => ({
    ...row,
    ...args.data,
  })) as never)
})

describe("visitors", () => {
  it("never mints an identity on a read", async () => {
    expect(await profileFor({ tenant: SCHOOL, write: false })).toBeNull()
    expect(p.create).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("stores only the hash of a new key, in a host-only cookie", async () => {
    const profile = await profileFor({ tenant: SCHOOL, write: true })
    expect(profile?.visitor).toBe(true)
    const [name, key, options] = setCookie.mock.calls[0]!
    expect(name).toBe(VISITOR_COOKIE)
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60,
    })
    expect(options).not.toHaveProperty("domain")
    const data = p.create.mock.calls[0]![0].data as { keyHash: string }
    expect(data.keyHash).toBe(keyHash(key as string))
    expect(data.keyHash).not.toBe(key)
  })

  it("finds a returning visitor only within this tenant, and rolls the cookie", async () => {
    jar.set(VISITOR_COOKIE, KEY)
    p.findFirst.mockResolvedValue(row as never)
    const profile = await profileFor({ tenant: SCHOOL, write: true })
    expect(profile?.id).toBe("p1")
    expect(p.findFirst.mock.calls[0]![0]).toMatchObject({
      where: { keyHash: keyHash(KEY), schoolId: "s1" },
    })
    expect(p.updateMany).toHaveBeenCalled()
    expect(setCookie).toHaveBeenCalledWith(
      VISITOR_COOKIE,
      KEY,
      expect.anything()
    )
  })

  it("mints a fresh key when the cookie's profile is gone", async () => {
    jar.set(VISITOR_COOKIE, KEY)
    await profileFor({ tenant: SCHOOL, write: true })
    const fresh = setCookie.mock.calls[0]![1]
    expect(fresh).not.toBe(KEY)
  })

  it("ignores a malformed cookie", async () => {
    jar.set(VISITOR_COOKIE, "not a key")
    expect(await profileFor({ tenant: SCHOOL, write: false })).toBeNull()
    expect(p.findFirst).not.toHaveBeenCalled()
  })

  it("forgets a device: its profile and its cookie", async () => {
    jar.set(VISITOR_COOKIE, KEY)
    expect(await forgetVisitor(SCHOOL)).toBe(true)
    expect(p.deleteMany).toHaveBeenCalledWith({
      where: { keyHash: keyHash(KEY), schoolId: "s1" },
    })
    expect(deleteCookie).toHaveBeenCalledWith(VISITOR_COOKIE)
  })
})

describe("members", () => {
  it("is one profile per member per school", async () => {
    await profileFor({ tenant: SCHOOL, userId: "u1", write: true })
    expect(p.findFirst.mock.calls[0]![0]).toMatchObject({
      where: { userId: "u1", schoolId: "s1" },
    })
    expect(p.create.mock.calls[0]![0].data).toEqual({
      userId: "u1",
      schoolId: "s1",
    })
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("survives two first messages racing to create it", async () => {
    p.create.mockRejectedValue(
      Object.assign(new Error("dup"), { code: "P2002" })
    )
    p.findFirst
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(row as never)
    const profile = await profileFor({
      tenant: SCHOOL,
      userId: "u1",
      write: true,
    })
    expect(profile?.id).toBe("p1")
  })

  it("makes sure the platform tenant exists on the main domain", async () => {
    await profileFor({ tenant: PLATFORM, userId: "u1", write: true })
    expect(ensurePlatformSchool).toHaveBeenCalled()
  })
})

it("has no profile on an unknown host", async () => {
  expect(
    await profileFor({ tenant: { kind: "unknown" }, userId: "u1", write: true })
  ).toBeNull()
})
