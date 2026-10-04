// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  suggestAssignments,
  type CandidateTeacher,
  type WaitingPair,
} from "@/components/school-dashboard/timetable/assignments/suggest"

const pair = (
  sectionId: string,
  subjectId: string,
  periods = 5,
  gradeId = sectionId.slice(0, 2)
): WaitingPair => ({ sectionId, gradeId, subjectId, periods })

const teacher = (
  teacherId: string,
  subjectIds: string[],
  load = 0,
  cap = 25
): CandidateTeacher => ({ teacherId, subjectIds, load, cap })

describe("suggestAssignments", () => {
  it("gives a grade's subject to one teacher when they have room", () => {
    const out = suggestAssignments(
      [pair("g7-A", "math"), pair("g7-B", "math")],
      [teacher("t1", ["math"])]
    )
    expect(out).toEqual([
      { teacherId: "t1", subjectId: "math", sectionIds: ["g7-A", "g7-B"] },
    ])
  })

  it("never goes past a teacher's weekly cap", () => {
    const out = suggestAssignments(
      [pair("g7-A", "math"), pair("g7-B", "math")],
      [teacher("t1", ["math"], 20)]
    )
    expect(out).toEqual([
      { teacherId: "t1", subjectId: "math", sectionIds: ["g7-A"] },
    ])
  })

  it("splits sections across qualified teachers when nobody can take all", () => {
    const out = suggestAssignments(
      [pair("g7-A", "math", 10), pair("g7-B", "math", 10)],
      [teacher("t1", ["math"], 10), teacher("t2", ["math"], 10)]
    )
    expect(out.map((s) => s.sectionIds)).toEqual([["g7-A"], ["g7-B"]])
  })

  it("leaves a subject with no qualified teacher waiting", () => {
    expect(
      suggestAssignments([pair("g7-A", "art")], [teacher("t1", ["math"])])
    ).toEqual([])
  })

  it("lets the most constrained subject pick first", () => {
    // Physics has one qualified teacher; math has two. t1 can do either but
    // only has room for one subject.
    const out = suggestAssignments(
      [pair("g7-A", "math", 10), pair("g7-A", "physics", 10)],
      [teacher("t1", ["math", "physics"], 10), teacher("t2", ["math"], 0)]
    )
    expect(out).toEqual([
      { teacherId: "t2", subjectId: "math", sectionIds: ["g7-A"] },
      { teacherId: "t1", subjectId: "physics", sectionIds: ["g7-A"] },
    ])
  })

  it("is deterministic", () => {
    const pairs = [pair("g7-A", "math"), pair("g8-A", "math")]
    const teachers = [teacher("t2", ["math"]), teacher("t1", ["math"])]
    expect(suggestAssignments(pairs, teachers)).toEqual(
      suggestAssignments(pairs, teachers)
    )
  })
})
