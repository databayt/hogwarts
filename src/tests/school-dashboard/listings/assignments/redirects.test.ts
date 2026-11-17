// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

const permanentRedirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`)
})
const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`)
})
vi.mock("next/navigation", () => ({ permanentRedirect, redirect }))

beforeEach(() => vi.clearAllMocks())

describe("/my-assignments", () => {
  it("permanently redirects to the role-based /assignments", async () => {
    const { default: Page } = await import(
      "@/app/[lang]/s/[subdomain]/(school-dashboard)/my-assignments/page"
    )
    await expect(
      Page({ params: Promise.resolve({ lang: "ar", subdomain: "s" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/ar/assignments")
    expect(permanentRedirect).toHaveBeenCalledWith("/ar/assignments")
  })
})

describe("/parent/children/[id]/assignments", () => {
  it("opens the assignments page on that child", async () => {
    const { default: Page } = await import(
      "@/app/[lang]/s/[subdomain]/(school-dashboard)/parent/children/[id]/assignments/page"
    )
    await expect(
      Page({ params: Promise.resolve({ lang: "en", subdomain: "s", id: "c1" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/en/assignments?child=c1")
  })
})
