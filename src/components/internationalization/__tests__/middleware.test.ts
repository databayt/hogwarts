// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { localizationMiddleware } from "../middleware"

describe("localizationMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createRequest(
    pathname: string,
    options?: {
      cookies?: Record<string, string>
      acceptLanguage?: string
    }
  ) {
    const url = `http://localhost:3000${pathname}`
    const headers: Record<string, string> = {}
    if (options?.acceptLanguage) {
      headers["accept-language"] = options.acceptLanguage
    }
    const cookieEntries = Object.entries(options?.cookies ?? {})
    if (cookieEntries.length > 0) {
      headers["cookie"] = cookieEntries.map(([k, v]) => `${k}=${v}`).join("; ")
    }
    return new NextRequest(url, { headers })
  }

  describe("locale detection", () => {
    it("passes through when URL already has /ar/ locale", () => {
      const req = createRequest("/ar/dashboard")
      const res = localizationMiddleware(req)

      expect(res.headers.get("x-middleware-next")).toBe("1")
    })

    it("passes through when URL already has /en/ locale", () => {
      const req = createRequest("/en/dashboard")
      const res = localizationMiddleware(req)

      expect(res.headers.get("x-middleware-next")).toBe("1")
    })

    it("passes through for bare locale path /ar", () => {
      const req = createRequest("/ar")
      const res = localizationMiddleware(req)

      expect(res.headers.get("x-middleware-next")).toBe("1")
    })

    it("passes through for bare locale path /en", () => {
      const req = createRequest("/en")
      const res = localizationMiddleware(req)

      expect(res.headers.get("x-middleware-next")).toBe("1")
    })
  })

  describe("cookie-based locale", () => {
    it("redirects to cookie locale when NEXT_LOCALE cookie is set to en", () => {
      const req = createRequest("/dashboard", {
        cookies: { NEXT_LOCALE: "en" },
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/en/dashboard")
    })

    it("redirects to cookie locale when NEXT_LOCALE cookie is set to ar", () => {
      const req = createRequest("/dashboard", {
        cookies: { NEXT_LOCALE: "ar" },
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/ar/dashboard")
    })

    it("ignores invalid cookie locale and falls back to Accept-Language", () => {
      const req = createRequest("/dashboard", {
        cookies: { NEXT_LOCALE: "fr" },
        acceptLanguage: "en-US,en;q=0.9",
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/en/dashboard")
    })
  })

  describe("Accept-Language header detection", () => {
    it("redirects to en when Accept-Language prefers English", () => {
      const req = createRequest("/dashboard", {
        acceptLanguage: "en-US,en;q=0.9",
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/en/dashboard")
    })

    it("redirects to ar when Accept-Language prefers Arabic", () => {
      const req = createRequest("/dashboard", {
        acceptLanguage: "ar-SA,ar;q=0.9",
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/ar/dashboard")
    })

    it("falls back to default locale (ar) when no Accept-Language", () => {
      const req = createRequest("/dashboard")
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/ar/dashboard")
    })
  })

  describe("cookie setting on redirect", () => {
    it("sets NEXT_LOCALE cookie on redirect response", () => {
      const req = createRequest("/dashboard", {
        acceptLanguage: "en-US",
      })
      const res = localizationMiddleware(req)

      const cookie = res.cookies.get("NEXT_LOCALE")
      expect(cookie).toBeDefined()
      expect(cookie?.value).toBe("en")
    })
  })

  describe("edge cases", () => {
    it("handles root path /", () => {
      const req = createRequest("/")
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      const location = res.headers.get("Location")
      expect(location).toContain("/ar/")
    })

    it("handles deeply nested paths", () => {
      const req = createRequest("/s/demo/dashboard/students", {
        acceptLanguage: "en",
      })
      const res = localizationMiddleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain(
        "/en/s/demo/dashboard/students"
      )
    })

    it("handles unsupported locale in Accept-Language gracefully", () => {
      const req = createRequest("/dashboard", {
        acceptLanguage: "fr-FR,de;q=0.9",
      })
      const res = localizationMiddleware(req)

      // Falls back to default locale (ar)
      expect(res.status).toBe(307)
      expect(res.headers.get("Location")).toContain("/ar/dashboard")
    })
  })
})
