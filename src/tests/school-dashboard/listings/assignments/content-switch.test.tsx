// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"
import AssignmentsContent from "@/components/school-dashboard/listings/assignments/content"
import { MyAssignmentsContent } from "@/components/school-dashboard/listings/assignments/my-assignments-content"
import StaffAssignmentsContent from "@/components/school-dashboard/listings/assignments/staff-content"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  }),
}))
vi.mock(
  "@/components/school-dashboard/listings/assignments/staff-content",
  () => ({ default: () => null })
)
vi.mock(
  "@/components/school-dashboard/listings/assignments/my-assignments",
  () => ({
    getMyAssignments: vi.fn(async () => [{ id: "mine" }]),
    getAssignmentsForStudent: vi.fn(async () => [{ id: "kid" }]),
  })
)
vi.mock("@/components/school-dashboard/listings/assignments/access", () => ({
  getGuardianChildren: vi.fn(async () => [
    { id: "c1", name: "A" },
    { id: "c2", name: "B" },
  ]),
  pickChild: (kids: { id: string }[], id: string) =>
    kids.find((k) => k.id === id) ?? kids[0] ?? null,
}))

const props = {
  searchParams: Promise.resolve({ child: "c2" }),
  dictionary: { school: { assignments: {} } } as never,
  lang: "ar" as const,
}

function as(role: string) {
  vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role } } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: "s1" } as never)
})

describe("/assignments renders by session role", () => {
  it.each(["ADMIN", "TEACHER", "STAFF", "DEVELOPER"])(
    "%s gets the management view",
    async (role) => {
      as(role)
      const el: any = await AssignmentsContent(props)
      expect(el.type).toBe(StaffAssignmentsContent)
    }
  )

  it("a STUDENT gets their own list, with hand-in", async () => {
    as("STUDENT")
    const el: any = await AssignmentsContent(props)
    expect(el.type).toBe(MyAssignmentsContent)
    expect(el.props.mode).toBeUndefined()
    expect(el.props.assignments).toEqual([{ id: "mine" }])
  })

  it("a GUARDIAN gets the chosen child's list, read-only, with a switcher", async () => {
    as("GUARDIAN")
    const el: any = await AssignmentsContent(props)
    expect(el.type).toBe(MyAssignmentsContent)
    expect(el.props.mode).toBe("guardian")
    expect(el.props.childId).toBe("c2")
    expect(el.props.assignments).toEqual([{ id: "kid" }])
    expect(el.props.switcher).toBeTruthy()
  })

  it("an ACCOUNTANT gets the empty state, not another role's data", async () => {
    as("ACCOUNTANT")
    const el: any = await AssignmentsContent(props)
    expect(el.type).not.toBe(StaffAssignmentsContent)
    expect(el.type).not.toBe(MyAssignmentsContent)
  })

  it("signed-out visitors go to login", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    await expect(AssignmentsContent(props)).rejects.toThrow(
      "NEXT_REDIRECT:/ar/login"
    )
  })
})
