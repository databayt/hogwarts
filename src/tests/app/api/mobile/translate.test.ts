// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    announcement: { findFirst: vi.fn() },
    assignment: { findFirst: vi.fn() },
    translationCache: { findUnique: vi.fn() },
  },
}))

vi.mock("@/components/translation/actions", () => ({
  translateWithCache: vi.fn(),
}))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) =>
    typeof r === "object" &&
    r !== null &&
    "status" in r &&
    typeof (r as { status: unknown }).status === "number",
}))

const SCHOOL_ID = "school-1"
const USER_ID = "user-1"

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/mobile/translate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })
}

async function authOk() {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER_ID,
    email: "u@example.com",
    schoolId: SCHOOL_ID,
    role: "STUDENT",
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/mobile/translate (issue #276)", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await authOk()
  })

  it("returns 400 when entity_type is not in the whitelist", async () => {
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "secret_table",
        entity_id: "x",
        target_lang: "en",
      })
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toContain("Invalid")
  })

  it("returns 400 on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/mobile/translate", {
      method: "POST",
      body: "{not json",
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
      },
    })
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 404 when the announcement is not in this school (tenant guard)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue(null)
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    expect(res.status).toBe(404)
    // Verify the lookup was scoped by schoolId from the auth context (no
    // way to fetch an entity from a different tenant via this endpoint).
    expect(db.announcement.findFirst).toHaveBeenCalledWith({
      where: { id: "ann-1", schoolId: SCHOOL_ID },
      select: { title: true, body: true, lang: true },
    })
  })

  it("returns the source text unchanged when source_lang === target_lang (and reports cached=true)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "Hello",
      body: "World",
      lang: "en",
    } as never)
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      cached: boolean
      source_lang: string
    }
    expect(res.status).toBe(200)
    expect(json.translated_text).toBe("Hello\n\nWorld")
    expect(json.cached).toBe(true)
    expect(json.source_lang).toBe("en")
    // No translation call should fire — same-language is a free path.
    const translation = await import("@/components/translation/actions")
    expect(translation.translateWithCache).not.toHaveBeenCalled()
  })

  it("returns cached=true when the translation already exists in TranslationCache", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "مرحبا",
      body: "أهلاً",
      lang: "ar",
    } as never)
    vi.mocked(db.translationCache.findUnique).mockResolvedValue({
      id: "cache-1",
    } as never)
    const translation = await import("@/components/translation/actions")
    vi.mocked(translation.translateWithCache).mockResolvedValue(
      "Hello\n\nWelcome"
    )

    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      cached: boolean
      source_lang: string
    }
    expect(res.status).toBe(200)
    expect(json.translated_text).toBe("Hello\n\nWelcome")
    expect(json.cached).toBe(true)
    expect(json.source_lang).toBe("ar")
  })

  it("returns cached=false on a fresh translation (no prior cache row)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "مرحبا",
      body: "أهلاً",
      lang: "ar",
    } as never)
    vi.mocked(db.translationCache.findUnique).mockResolvedValue(null)
    const translation = await import("@/components/translation/actions")
    vi.mocked(translation.translateWithCache).mockResolvedValue("Hello")

    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    const json = (await res.json()) as { cached: boolean }
    expect(res.status).toBe(200)
    expect(json.cached).toBe(false)
  })

  it("handles assignment entities the same way", async () => {
    vi.mocked(db.assignment.findFirst).mockResolvedValue({
      title: "Homework",
      description: "Chapter 3",
      lang: "en",
    } as never)
    vi.mocked(db.translationCache.findUnique).mockResolvedValue(null)
    const translation = await import("@/components/translation/actions")
    vi.mocked(translation.translateWithCache).mockResolvedValue(
      "واجب\n\nالفصل 3"
    )

    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "assignment",
        entity_id: "asg-1",
        target_lang: "ar",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      source_lang: string
    }
    expect(res.status).toBe(200)
    expect(json.source_lang).toBe("en")
    expect(json.translated_text).toBe("واجب\n\nالفصل 3")
    expect(db.assignment.findFirst).toHaveBeenCalledWith({
      where: { id: "asg-1", schoolId: SCHOOL_ID },
      select: { title: true, description: true, lang: true },
    })
  })

  it("returns 200 with empty text when the entity has empty title and body (cacheable on the client)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: null,
      body: null,
      lang: "en",
    } as never)
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "ar",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      cached: boolean
    }
    expect(res.status).toBe(200)
    expect(json.translated_text).toBe("")
    expect(json.cached).toBe(true)
  })

  it("returns 401 when auth fails (delegates to authenticate)", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }) as never
    )
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    expect(res.status).toBe(401)
  })
})
