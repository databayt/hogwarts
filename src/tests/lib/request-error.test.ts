// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import { describeRequestError, isControlFlow } from "@/lib/request-error"

const NOW = new Date("2026-11-14T10:00:00.000Z")
const CONTEXT = {
  routerKind: "App Router",
  routePath: "/[lang]/s/[subdomain]/(school-dashboard)/timetable",
  routeType: "render",
  renderSource: "react-server-components",
}

describe("describeRequestError", () => {
  it("names the school, the route and the code the error page shows", () => {
    const error = Object.assign(
      new Error("column periods.untimed does not exist"),
      {
        digest: "2841907731",
      }
    )
    const line = describeRequestError(
      error,
      {
        path: "/ar/timetable",
        method: "GET",
        headers: { host: "alabidae.balqalam.com" },
      },
      CONTEXT,
      NOW
    )
    expect(line).toMatchObject({
      level: "error",
      event: "request_error",
      at: "2026-11-14T10:00:00.000Z",
      message: "column periods.untimed does not exist",
      name: "Error",
      digest: "2841907731",
      method: "GET",
      path: "/ar/timetable",
      host: "alabidae.balqalam.com",
      school: "alabidae",
      routePath: "/[lang]/s/[subdomain]/(school-dashboard)/timetable",
      routeType: "render",
    })
  })

  it("never carries the query string — it can hold a one-time token", () => {
    const line = describeRequestError(
      new Error("boom"),
      {
        path: "/ar/new-password?token=9f8c2d1e-secret#x",
        method: "GET",
        headers: { host: "balqalam.com" },
      },
      CONTEXT,
      NOW
    )
    expect(line.path).toBe("/ar/new-password")
    expect(JSON.stringify(line)).not.toContain("9f8c2d1e")
  })

  it("carries no header but the host", () => {
    const line = describeRequestError(
      new Error("boom"),
      {
        path: "/ar/dashboard",
        method: "POST",
        headers: {
          host: "demo.balqalam.com",
          cookie: "authjs.session-token=SECRETCOOKIE",
          authorization: "Bearer SECRETBEARER",
        },
      },
      CONTEXT,
      NOW
    )
    const text = JSON.stringify(line)
    expect(text).not.toContain("SECRETCOOKIE")
    expect(text).not.toContain("SECRETBEARER")
  })

  it("prefers the forwarded host and reads no school from the apex or www", () => {
    const at = (headers: Record<string, string | string[]>) =>
      describeRequestError(new Error("x"), { path: "/", headers }, {}, NOW)
    expect(
      at({
        host: "container.internal",
        "x-forwarded-host": "kingfahd.balqalam.com",
      }).school
    ).toBe("kingfahd")
    expect(at({ host: "balqalam.com" }).school).toBeUndefined()
    expect(at({ host: "www.balqalam.com" }).school).toBeUndefined()
    expect(at({ host: "demo.localhost:3000" }).school).toBe("demo")
    expect(at({ host: ["alabidae.balqalam.com", "x"] }).school).toBe("alabidae")
    expect(at({}).school).toBeUndefined()
  })

  it("survives a thrown value that is not an Error", () => {
    const line = describeRequestError("just a string", {}, {}, NOW)
    expect(line.message).toBe("just a string")
    expect(line.name).toBeUndefined()
    expect(line.stack).toBeUndefined()
    expect(line.path).toBe("")
  })

  it("bounds the message and the stack", () => {
    const error = new Error("m".repeat(5000))
    error.stack = "s".repeat(5000)
    const line = describeRequestError(error, { path: "/x" }, {}, NOW)
    expect(line.message.length).toBe(500)
    expect(line.stack?.length).toBe(1200)
  })
})

describe("isControlFlow", () => {
  it("is true for the redirects and not-found Next raises on purpose", () => {
    expect(
      isControlFlow({ digest: "NEXT_REDIRECT;replace;/ar/login;307;" })
    ).toBe(true)
    expect(isControlFlow({ digest: "NEXT_NOT_FOUND" })).toBe(true)
    expect(isControlFlow({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" })).toBe(true)
    expect(isControlFlow({ digest: "DYNAMIC_SERVER_USAGE" })).toBe(true)
  })

  it("is false for a real error, with or without a digest", () => {
    expect(isControlFlow(new Error("boom"))).toBe(false)
    expect(
      isControlFlow(Object.assign(new Error("boom"), { digest: "2841907731" }))
    ).toBe(false)
    expect(isControlFlow("text")).toBe(false)
    expect(isControlFlow(null)).toBe(false)
  })
})
