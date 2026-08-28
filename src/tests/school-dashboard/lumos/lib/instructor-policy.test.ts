// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import {
  applyInstructorPolicy,
  EMPTY_INSTRUCTOR_POLICY,
  instructorKeyOf,
  isInstructorKey,
  videoMatchesKey,
  type InstructorPolicy,
} from "@/components/lumos/lib/instructor-policy"

// The resolver itself is pure; the module only touches the db inside
// getInstructorPolicy, which these tests do not exercise.
vi.mock("@/lib/db", () => ({
  db: {
    schoolInstructorPolicy: { findUnique: vi.fn() },
    instructorBlock: { findMany: vi.fn() },
  },
}))

type V = {
  id: string
  userId: string
  schoolId: string | null
  isFeatured: boolean
}

const video = (
  id: string,
  userId: string,
  schoolId: string | null,
  isFeatured = false
): V => ({ id, userId, schoolId, isFeatured })

const PLATFORM = video("v-platform", "u-brand", null, true)
const OWN = video("v-own", "u-ali", "school-1")
const PARTNER = video("v-partner", "u-sara", "school-2")
const SOLO = video("v-solo", "u-omar", null)

// Incoming order is the query's ranking: [isFeatured desc, viewCount desc].
const ALL = [PLATFORM, OWN, PARTNER, SOLO]

const policy = (over: Partial<InstructorPolicy> = {}): InstructorPolicy => ({
  ...EMPTY_INSTRUCTOR_POLICY,
  blocked: new Set(),
  ...over,
})

const ids = (rows: V[]) => rows.map((r) => r.id)

describe("instructorKeyOf", () => {
  it("keys platform-featured content as the single platform row", () => {
    expect(instructorKeyOf(PLATFORM)).toBe("platform")
  })

  it("keys everyone else by person, school-attributed or not", () => {
    expect(instructorKeyOf(OWN)).toBe("teacher:u-ali")
    expect(instructorKeyOf(SOLO)).toBe("teacher:u-omar")
  })

  it("keys a featured video that belongs to a school as its teacher", () => {
    expect(instructorKeyOf(video("v", "u-ali", "school-1", true))).toBe(
      "teacher:u-ali"
    )
  })
})

describe("videoMatchesKey", () => {
  // The regression this exists for: comparing instructorKeyOf(v) === key would
  // make a school lock match nothing and degrade silently to "open".
  it("matches a school key against school-attributed videos", () => {
    expect(videoMatchesKey(OWN, "school-1")).toBe(false)
    expect(videoMatchesKey(OWN, "school:school-1")).toBe(true)
    expect(videoMatchesKey(PARTNER, "school:school-1")).toBe(false)
    expect(instructorKeyOf(OWN)).not.toBe("school:school-1")
  })

  it("matches a teacher key by user, regardless of school attribution", () => {
    expect(videoMatchesKey(OWN, "teacher:u-ali")).toBe(true)
    expect(videoMatchesKey(SOLO, "teacher:u-omar")).toBe(true)
    expect(videoMatchesKey(OWN, "teacher:u-omar")).toBe(false)
  })

  it("matches platform only for featured content with no school", () => {
    expect(videoMatchesKey(PLATFORM, "platform")).toBe(true)
    expect(videoMatchesKey(video("v", "u", "school-1", true), "platform")).toBe(
      false
    )
  })

  it("rejects an unrecognized key rather than matching everything", () => {
    expect(videoMatchesKey(OWN, "nonsense")).toBe(false)
  })
})

describe("isInstructorKey", () => {
  it("accepts the three key forms and nothing else", () => {
    expect(isInstructorKey("platform")).toBe(true)
    expect(isInstructorKey("teacher:abc-123")).toBe(true)
    expect(isInstructorKey("school:abc-123")).toBe(true)
    expect(isInstructorKey("teacher:")).toBe(false)
    expect(isInstructorKey("' OR 1=1")).toBe(false)
    expect(isInstructorKey(null)).toBe(false)
  })
})

describe("applyInstructorPolicy", () => {
  it("keeps the caller's ranking when no policy is set", () => {
    expect(ids(applyInstructorPolicy(ALL, policy()))).toEqual(ids(ALL))
  })

  it("drops a disabled instructor's videos entirely", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ blocked: new Set(["teacher:u-sara"]) })
    )
    expect(ids(result)).toEqual(["v-platform", "v-own", "v-solo"])
  })

  it("drops a school-attributed video when its teacher is disabled", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ blocked: new Set(["teacher:u-ali"]) })
    )
    expect(ids(result)).not.toContain("v-own")
  })

  it("drops a whole school when the school key is disabled", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ blocked: new Set(["school:school-2"]) })
    )
    expect(ids(result)).toEqual(["v-platform", "v-own", "v-solo"])
  })

  it("keeps only the locked instructor where they have a video", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ lockedKey: "teacher:u-ali" })
    )
    expect(ids(result)).toEqual(["v-own"])
  })

  it("locks to a whole school, matching every video it contributed", () => {
    const alsoOwn = video("v-own-2", "u-noor", "school-1")
    const result = applyInstructorPolicy(
      [...ALL, alsoOwn],
      policy({ lockedKey: "school:school-1" })
    )
    expect(ids(result)).toEqual(["v-own", "v-own-2"])
  })

  it("falls back to the allowed rest on a lesson the lock does not cover", () => {
    // The whole point of the soft lock: a video-less lesson plays the
    // placeholder, records no progress, and dents course completion.
    const result = applyInstructorPolicy(
      [PLATFORM, PARTNER],
      policy({ lockedKey: "teacher:u-ali" })
    )
    expect(ids(result)).toEqual(["v-platform", "v-partner"])
  })

  it("never resurrects a disabled instructor through the lock fallback", () => {
    const result = applyInstructorPolicy(
      [PARTNER],
      policy({
        lockedKey: "teacher:u-ali",
        blocked: new Set(["teacher:u-sara"]),
      })
    )
    expect(result).toEqual([])
  })

  it("floats the school-wide default to the top without hiding the rest", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ defaultKey: "teacher:u-omar" })
    )
    expect(ids(result)).toEqual(["v-solo", "v-platform", "v-own", "v-partner"])
  })

  it("lets the per-subject preference outrank the school-wide default", () => {
    const result = applyInstructorPolicy(
      ALL,
      policy({ defaultKey: "teacher:u-omar" }),
      { preferredSchoolId: "school-2", preferredUserId: null }
    )
    expect(ids(result)).toEqual(["v-partner", "v-solo", "v-platform", "v-own"])
  })

  it("reads a both-null preference as the stored 'platform default'", () => {
    const result = applyInstructorPolicy([OWN, PLATFORM, SOLO], policy(), {
      preferredSchoolId: null,
      preferredUserId: null,
    })
    expect(ids(result)).toEqual(["v-platform", "v-own", "v-solo"])
  })

  it("does not mutate the array it was given", () => {
    const input = [...ALL]
    applyInstructorPolicy(input, policy({ defaultKey: "teacher:u-omar" }))
    expect(ids(input)).toEqual(ids(ALL))
  })
})
