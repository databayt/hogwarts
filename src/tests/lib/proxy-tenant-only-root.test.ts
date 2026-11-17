import { NextRequest } from "next/server"
import { proxy } from "@/proxy"
import { describe, expect, it, vi } from "vitest"

import { isTenantOnlyPath, safeTenantNext } from "@/lib/tenant-paths"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A school-only path (live room, timetable, ...) opened on the bare root
 * domain has no page there and 404s — including on every reload of a live
 * room. The proxy must send a signed-in visitor to /<lang>/my-school?next=...
 * (which forwards to the school's own host) instead.
 */
// The suite aliases "next/server" to a light mock; the proxy needs the real
// request/response classes (nextUrl.clone, cookies, rewrite headers).
vi.mock("next/server", async () => {
  const real =
    await import("../../../node_modules/next/dist/server/web/exports/index.js")
  return real
})

vi.mock("@/lib/custom-domain", () => ({
  resolveCustomDomain: vi.fn(async () => null),
}))

function req(url: string, cookies = "") {
  const headers: Record<string, string> = { host: new URL(url).host }
  if (cookies) headers.cookie = cookies
  return new NextRequest(url, { headers })
}

const SIGNED_IN = "authjs.session-token=x; authjs.role=TEACHER"

describe("proxy — tenant-only path on the bare root", () => {
  it("signed in on balqalam.com /live/join → 307 to my-school with next", async () => {
    const res = await proxy(
      req("https://balqalam.com/ar/live/join/tt1?x=1", SIGNED_IN)
    )
    expect(res.status).toBe(307)
    const loc = new URL(res.headers.get("location")!)
    expect(loc.origin).toBe("https://balqalam.com")
    expect(loc.pathname).toBe("/ar/my-school")
    expect(loc.searchParams.get("next")).toBe("/ar/live/join/tt1?x=1")
  })

  it("live room path is covered too", async () => {
    const res = await proxy(
      req("https://balqalam.com/en/live/abc/room", SIGNED_IN)
    )
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get("location")!).searchParams.get("next")).toBe(
      "/en/live/abc/room"
    )
  })

  it("unauthenticated keeps the login redirect", async () => {
    const res = await proxy(req("https://balqalam.com/ar/live/join/tt1"))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get("location")!).pathname).toBe("/ar/login")
  })

  it("marketing paths on the root are untouched", async () => {
    for (const p of ["/ar", "/ar/pricing", "/ar/features"]) {
      const res = await proxy(req(`https://balqalam.com${p}`, SIGNED_IN))
      expect(res.headers.get("location")).toBeNull()
    }
  })

  it("already on the school subdomain → rewritten, not redirected", async () => {
    const res = await proxy(
      req("https://alabidae.balqalam.com/ar/live/join/tt1", SIGNED_IN)
    )
    expect(res.headers.get("location")).toBeNull()
    expect(res.headers.get("x-middleware-rewrite")).toContain(
      "/ar/s/alabidae/live/join/tt1"
    )
  })
})

describe("tenant-paths", () => {
  it("classifies tenant-only vs root-served paths", () => {
    expect(isTenantOnlyPath("/live")).toBe(true)
    expect(isTenantOnlyPath("/live/join/x")).toBe(true)
    expect(isTenantOnlyPath("/timetable")).toBe(true)
    expect(isTenantOnlyPath("/livestream")).toBe(false)
    expect(isTenantOnlyPath("/pricing")).toBe(false)
    expect(isTenantOnlyPath("/dashboard")).toBe(false)
    expect(isTenantOnlyPath("/")).toBe(false)
  })

  it("only accepts same-site absolute paths as next", () => {
    expect(safeTenantNext("/ar/live/x?y=1")).toBe("/ar/live/x?y=1")
    expect(safeTenantNext("//evil.com")).toBeNull()
    expect(safeTenantNext("https://evil.com")).toBeNull()
    expect(safeTenantNext("/\\evil.com")).toBeNull()
    expect(safeTenantNext(undefined)).toBeNull()
  })
})
