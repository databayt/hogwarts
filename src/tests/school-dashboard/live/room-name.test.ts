// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The name a person carries into a room. It was `username ?? email`, and a
 * school member's username is their LOGIN CODE — a class saw "260049 raised a
 * hand", and half of that student's credentials with it.
 */
import { describe, expect, it } from "vitest"

import { roomDisplayName } from "@/components/school-dashboard/live/room-name"

const asil = { firstName: "اسيل", middleName: "عبد الغفار", lastName: "محمد" }

describe("roomDisplayName", () => {
  it("names a student from their own record, never from the login code", () => {
    const name = roomDisplayName(
      { username: "260049", student: asil },
      "STUDENT",
      "first-second",
      "ar"
    )
    expect(name).toContain("اسيل")
    expect(name).not.toContain("260049")
  })

  it("follows the school's name display", () => {
    const user = { username: "260049", student: asil }
    const second = roomDisplayName(user, "STUDENT", "first-second", "ar")
    const last = roomDisplayName(user, "STUDENT", "first-last", "ar")
    expect(second.startsWith("اسيل")).toBe(true)
    expect(last).toBe("اسيل محمد")
    expect(second).not.toBe(last)
  })

  it("picks the record of the role the person is in the room as", () => {
    const both = {
      username: "260019",
      teacher: { firstName: "ابتسام", lastName: "حسن" },
      guardian: { firstName: "أم", lastName: "أحمد" },
    }
    expect(roomDisplayName(both, "TEACHER", null, "ar")).toContain("ابتسام")
    expect(roomDisplayName(both, "GUARDIAN", null, "ar")).toContain("أم")
  })

  it("falls back to whichever record exists when the role's own is missing", () => {
    const name = roomDisplayName(
      { username: "260070", teacher: { firstName: "محمد", lastName: "نور" } },
      "ADMIN",
      null,
      "ar"
    )
    expect(name).toContain("محمد")
  })

  it("keeps a username that is a real display name", () => {
    expect(
      roomDisplayName({ username: "إدارة الابداع" }, "ADMIN", null, "ar")
    ).toBe("إدارة الابداع")
  })

  it("never prints a login code or an address: the role's word instead", () => {
    expect(roomDisplayName({ username: "260003" }, "STUDENT", null, "ar")).toBe(
      "طالب"
    )
    expect(
      roomDisplayName({ username: "x@student.local" }, "STUDENT", null, "en")
    ).toBe("Student")
    expect(roomDisplayName(null, "GUARDIAN", null, "en")).toBe("Parent")
    expect(roomDisplayName({ username: "  " }, "TEACHER", null, "ar")).toBe(
      "معلّم"
    )
  })

  it("an unknown school display falls back to the default instead of throwing", () => {
    expect(
      roomDisplayName({ student: asil }, "STUDENT", "nonsense", "ar")
    ).toContain("اسيل")
  })
})
