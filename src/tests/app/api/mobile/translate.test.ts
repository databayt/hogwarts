// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Mocks
//
// The route reads canonical text via `db` and translates via `translate`
// from @/components/translation/actions (the cache lookup uses the
// `db.translation` accessor with the composite unique key). These mocks
// mirror the CURRENT API surface — the legacy `db.translationCache` /
// `translateWithCache` names are gone.
// ---------------------------------------------------------------------------

const { translate } = vi.hoisted(() => ({ translate: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    announcement: { findFirst: vi.fn() },
    assignment: { findFirst: vi.fn() },
    event: { findFirst: vi.fn() },
    exam: { findFirst: vi.fn() },
    translation: { findUnique: vi.fn() },
  },
}))

vi.mock("@/components/translation/actions", () => ({ translate }))

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

  it("returns 400 when target_lang is not a supported language", async () => {
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "fr",
      })
    )
    expect(res.status).toBe(400)
  })

  it("returns 404 when the announcement is not in this school (tenant guard)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue(null as never)
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
    expect(translate).not.toHaveBeenCalled()
  })

  it("returns cached=true when the translation already exists in the Translation cache", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "مرحبا",
      body: "أهلاً",
      lang: "ar",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue({
      id: "cache-1",
    } as never)
    translate.mockResolvedValue("Hello\n\nWelcome")

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
    // The cache probe must use the composite unique key scoped by schoolId.
    expect(db.translation.findUnique).toHaveBeenCalledWith({
      where: {
        schoolId_sourceText_sourceLanguage_targetLanguage: {
          schoolId: SCHOOL_ID,
          sourceText: "مرحبا\n\nأهلاً",
          sourceLanguage: "ar",
          targetLanguage: "en",
        },
      },
      select: { id: true },
    })
  })

  it("returns cached=false on a fresh translation (no prior cache row) and calls translate with (text, source, target, schoolId)", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "مرحبا",
      body: "أهلاً",
      lang: "ar",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null as never)
    translate.mockResolvedValue("Hello")

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
    // Cache-miss path delegates to translate with the school context so the
    // result is persisted under the right tenant.
    expect(translate).toHaveBeenCalledWith(
      "مرحبا\n\nأهلاً",
      "ar",
      "en",
      SCHOOL_ID
    )
  })

  it("joins announcement title and body with a blank line", async () => {
    vi.mocked(db.announcement.findFirst).mockResolvedValue({
      title: "Title",
      body: "Body",
      lang: "ar",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null as never)
    translate.mockResolvedValue("ignored")

    const { POST } = await import("@/app/api/mobile/translate/route")
    await POST(
      buildRequest({
        entity_type: "announcement",
        entity_id: "ann-1",
        target_lang: "en",
      })
    )
    // The text handed to translate is "title\n\nbody".
    expect(translate).toHaveBeenCalledWith(
      "Title\n\nBody",
      "ar",
      "en",
      SCHOOL_ID
    )
  })

  it("handles assignment entities — catalog-global, looked up by id ONLY (no schoolId)", async () => {
    vi.mocked(db.assignment.findFirst).mockResolvedValue({
      title: "Homework",
      description: "Chapter 3",
      lang: "en",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null as never)
    translate.mockResolvedValue("واجب\n\nالفصل 3")

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
    // Assignment is a shared catalog template — the where clause must NOT
    // include schoolId (it would never match a global row).
    expect(db.assignment.findFirst).toHaveBeenCalledWith({
      where: { id: "asg-1" },
      select: { title: true, description: true, lang: true },
    })
  })

  it("handles event entities — school-scoped, looked up by id + schoolId", async () => {
    vi.mocked(db.event.findFirst).mockResolvedValue({
      title: "Sports Day",
      description: "Annual event",
      lang: "en",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null as never)
    translate.mockResolvedValue("يوم رياضي\n\nحدث سنوي")

    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "event",
        entity_id: "evt-1",
        target_lang: "ar",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      source_lang: string
    }
    expect(res.status).toBe(200)
    expect(json.source_lang).toBe("en")
    expect(json.translated_text).toBe("يوم رياضي\n\nحدث سنوي")
    // Event is tenant-scoped — the where clause must carry schoolId.
    expect(db.event.findFirst).toHaveBeenCalledWith({
      where: { id: "evt-1", schoolId: SCHOOL_ID },
      select: { title: true, description: true, lang: true },
    })
    expect(translate).toHaveBeenCalledWith(
      "Sports Day\n\nAnnual event",
      "en",
      "ar",
      SCHOOL_ID
    )
  })

  it("returns 404 when the event is not in this school (tenant guard)", async () => {
    vi.mocked(db.event.findFirst).mockResolvedValue(null as never)
    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "event",
        entity_id: "evt-x",
        target_lang: "en",
      })
    )
    expect(res.status).toBe(404)
    expect(db.event.findFirst).toHaveBeenCalledWith({
      where: { id: "evt-x", schoolId: SCHOOL_ID },
      select: { title: true, description: true, lang: true },
    })
  })

  it("handles exam entities — catalog-global, looked up by id ONLY (no schoolId)", async () => {
    vi.mocked(db.exam.findFirst).mockResolvedValue({
      title: "Midterm",
      description: "Units 1-4",
      lang: "en",
    } as never)
    vi.mocked(db.translation.findUnique).mockResolvedValue(null as never)
    translate.mockResolvedValue("نصف الفصل\n\nالوحدات 1-4")

    const { POST } = await import("@/app/api/mobile/translate/route")
    const res = await POST(
      buildRequest({
        entity_type: "exam",
        entity_id: "exm-1",
        target_lang: "ar",
      })
    )
    const json = (await res.json()) as {
      translated_text: string
      source_lang: string
    }
    expect(res.status).toBe(200)
    expect(json.source_lang).toBe("en")
    expect(json.translated_text).toBe("نصف الفصل\n\nالوحدات 1-4")
    // Exam (catalog_exams) has NO schoolId — looked up by id only, same as
    // assignment.
    expect(db.exam.findFirst).toHaveBeenCalledWith({
      where: { id: "exm-1" },
      select: { title: true, description: true, lang: true },
    })
    expect(translate).toHaveBeenCalledWith(
      "Midterm\n\nUnits 1-4",
      "en",
      "ar",
      SCHOOL_ID
    )
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
    // Nothing to translate.
    expect(translate).not.toHaveBeenCalled()
  })
})
