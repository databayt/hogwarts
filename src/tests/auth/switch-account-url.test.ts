import { describe, expect, it } from "vitest"

import { loginUrlFor } from "@/components/auth/switch-account-url"

describe("loginUrlFor", () => {
  it("is the plain login page without a callback", () => {
    expect(loginUrlFor("ar")).toBe("/ar/login")
  })

  it("carries the class link as an encoded callbackUrl", () => {
    expect(loginUrlFor("ar", "/ar/live/join/abc123")).toBe(
      "/ar/login?callbackUrl=%2Far%2Flive%2Fjoin%2Fabc123"
    )
  })
})
