// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  parseRoomName,
  roomNameFor,
} from "@/components/school-dashboard/conference/livekit/room-naming"

describe("roomNameFor", () => {
  it("composes 'sch-{schoolId}-lc-{sessionId}'", () => {
    expect(roomNameFor("abc", "xyz")).toBe("sch-abc-lc-xyz")
  })
  it("supports cuid-style ids", () => {
    const name = roomNameFor("ckxyz9876543210abcdefg", "ckabc1234567890zyxwvut")
    expect(name).toBe("sch-ckxyz9876543210abcdefg-lc-ckabc1234567890zyxwvut")
  })
  it("throws on empty schoolId or sessionId", () => {
    expect(() => roomNameFor("", "x")).toThrow()
    expect(() => roomNameFor("x", "")).toThrow()
  })
})

describe("parseRoomName", () => {
  it("round-trips schoolId and sessionId", () => {
    const round = parseRoomName(roomNameFor("school-A", "session-B"))
    expect(round).toEqual({ schoolId: "school-A", sessionId: "session-B" })
  })
  it("returns null for unknown prefix", () => {
    expect(parseRoomName("foo-bar")).toBeNull()
  })
  it("returns null when separator missing", () => {
    expect(parseRoomName("sch-abc-xyz")).toBeNull()
  })
  it("returns null for empty schoolId", () => {
    expect(parseRoomName("sch--lc-x")).toBeNull()
  })
  it("does not cross-tenant: a session id can't impersonate a different school", () => {
    const name = roomNameFor("schoolA", "sess1")
    const parsed = parseRoomName(name)
    expect(parsed?.schoolId).toBe("schoolA")
    expect(parsed?.schoolId).not.toBe("schoolB")
  })
})
