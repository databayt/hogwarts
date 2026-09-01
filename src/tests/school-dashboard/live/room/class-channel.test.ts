// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The classroom protocol. The host's messages shape the room; a student's
 * copy of a host-only message must change nothing for anyone; votes tally on
 * the host; strokes never exceed the data-channel cap.
 */

import { describe, expect, it } from "vitest"

import {
  applyMessage,
  decodeMessage,
  encodeMessage,
  fitStroke,
  initialClassState,
  MAX_MESSAGE_BYTES,
  snapshotOf,
  type ClassState,
} from "@/components/school-dashboard/live/room/class-channel"

const HOST = { identity: "teacher-1", name: "Ms. Amal", isHost: true }
const STUDENT = { identity: "student-1", name: "Sara", isHost: false }
const OTHER = { identity: "student-2", name: "Omar", isHost: false }

describe("codec", () => {
  it("round-trips a message and rejects garbage", () => {
    const msg = { t: "q" as const, id: "q1", text: "why?", at: 1 }
    expect(decodeMessage(encodeMessage(msg))).toEqual(msg)
    expect(decodeMessage(new TextEncoder().encode("nope"))).toBeNull()
    expect(decodeMessage(new TextEncoder().encode('{"x":1}'))).toBeNull()
  })

  it("thins a long stroke until it fits under the cap", () => {
    const points = Array.from(
      { length: 5000 },
      (_, i) => [i / 5000, (i % 7) / 7] as [number, number]
    )
    const stroke = fitStroke({ id: "s1", points, color: "#000", width: 3 })
    expect(
      encodeMessage({ t: "wb.stroke", stroke }).byteLength
    ).toBeLessThanOrEqual(MAX_MESSAGE_BYTES)
    // endpoints survive the thinning
    expect(stroke.points[0]).toEqual(points[0])
    expect(stroke.points.at(-1)).toEqual(points.at(-1))
  })
})

describe("questions", () => {
  it("anyone may ask; only the host marks answered; duplicates are ignored", () => {
    let s = applyMessage(
      initialClassState(),
      { t: "q", id: "q1", text: " why? ", at: 1 },
      STUDENT
    )
    expect(s.questions).toEqual([
      {
        id: "q1",
        from: "student-1",
        name: "Sara",
        text: "why?",
        at: 1,
        answered: false,
      },
    ])
    s = applyMessage(s, { t: "q", id: "q1", text: "again", at: 2 }, STUDENT)
    expect(s.questions).toHaveLength(1)
    const byStudent = applyMessage(s, { t: "q.answered", id: "q1" }, OTHER)
    expect(byStudent.questions[0].answered).toBe(false)
    const byHost = applyMessage(s, { t: "q.answered", id: "q1" }, HOST)
    expect(byHost.questions[0].answered).toBe(true)
  })
})

describe("polls", () => {
  const opened = applyMessage(
    initialClassState(),
    { t: "poll.open", id: "p1", question: "2+2?", options: ["3", "4"] },
    HOST
  )

  it("only the host opens a poll", () => {
    const s = applyMessage(
      initialClassState(),
      { t: "poll.open", id: "p1", question: "x", options: ["a", "b"] },
      STUDENT
    )
    expect(s.poll).toBeNull()
    expect(opened.poll).toMatchObject({
      id: "p1",
      open: true,
      counts: [0, 0],
      total: 0,
    })
  })

  it("tallies votes on the host, one per identity, re-vote replaces", () => {
    let s = applyMessage(
      opened,
      { t: "poll.vote", id: "p1", option: 1 },
      STUDENT
    )
    s = applyMessage(s, { t: "poll.vote", id: "p1", option: 1 }, OTHER)
    expect(s.poll?.counts).toEqual([0, 2])
    s = applyMessage(s, { t: "poll.vote", id: "p1", option: 0 }, STUDENT)
    expect(s.poll?.counts).toEqual([1, 1])
    expect(s.poll?.total).toBe(2)
  })

  it("rejects votes for an unknown option or a closed poll", () => {
    const bad = applyMessage(
      opened,
      { t: "poll.vote", id: "p1", option: 7 },
      STUDENT
    )
    expect(bad.poll?.total).toBe(0)
    const closed = applyMessage(opened, { t: "poll.close", id: "p1" }, HOST)
    expect(closed.poll?.open).toBe(false)
    const late = applyMessage(
      closed,
      { t: "poll.vote", id: "p1", option: 1 },
      STUDENT
    )
    expect(late.poll?.total).toBe(0)
  })

  it("a student cannot close a poll or forge a tally", () => {
    expect(
      applyMessage(opened, { t: "poll.close", id: "p1" }, STUDENT).poll?.open
    ).toBe(true)
    expect(
      applyMessage(
        opened,
        { t: "poll.tally", id: "p1", counts: [9, 9], total: 18 },
        STUDENT
      ).poll?.total
    ).toBe(0)
    expect(
      applyMessage(
        opened,
        { t: "poll.tally", id: "p1", counts: [1, 2], total: 3 },
        HOST
      ).poll?.counts
    ).toEqual([1, 2])
  })
})

describe("whiteboard and slides", () => {
  it("host strokes accumulate, dedupe by id, and clear", () => {
    const stroke = {
      id: "s1",
      points: [
        [0, 0],
        [1, 1],
      ] as Array<[number, number]>,
      color: "#000",
      width: 3,
    }
    let s = applyMessage(initialClassState(), { t: "wb.stroke", stroke }, HOST)
    s = applyMessage(s, { t: "wb.stroke", stroke }, HOST)
    expect(s.strokes).toHaveLength(1)
    expect(
      applyMessage(
        s,
        { t: "wb.stroke", stroke: { ...stroke, id: "s2" } },
        STUDENT
      ).strokes
    ).toHaveLength(1)
    expect(applyMessage(s, { t: "wb.clear" }, HOST).strokes).toHaveLength(0)
  })

  it("showing the board hides the slides and vice versa", () => {
    let s = applyMessage(
      initialClassState(),
      { t: "slides", slides: { url: "/x", title: "Deck", page: 1 } },
      HOST
    )
    expect(s.slides?.page).toBe(1)
    s = applyMessage(s, { t: "wb.show", on: true }, HOST)
    expect(s.whiteboard).toBe(true)
    expect(s.slides).toBeNull()
    s = applyMessage(
      s,
      { t: "slides", slides: { url: "/x", title: "Deck", page: 3 } },
      HOST
    )
    expect(s.whiteboard).toBe(false)
    expect(s.slides?.page).toBe(3)
  })
})

describe("late-join snapshot", () => {
  it("carries everything but strokes, which follow one per message", () => {
    let s: ClassState = applyMessage(
      initialClassState(),
      { t: "poll.open", id: "p1", question: "q", options: ["a", "b"] },
      HOST
    )
    s = applyMessage(s, { t: "q", id: "q1", text: "?", at: 1 }, STUDENT)
    s = applyMessage(
      s,
      {
        t: "wb.stroke",
        stroke: { id: "s1", points: [[0, 0]], color: "#000", width: 1 },
      },
      HOST
    )
    const snap = snapshotOf(s)
    expect(snap).toMatchObject({
      t: "sync.state",
      strokeCount: 1,
      questions: s.questions,
      poll: s.poll,
    })
    const joiner = applyMessage(initialClassState(), snap, HOST)
    expect(joiner.questions).toHaveLength(1)
    expect(joiner.poll?.id).toBe("p1")
    // a student cannot impersonate the snapshot
    expect(
      applyMessage(initialClassState(), snap, STUDENT).questions
    ).toHaveLength(0)
  })
})
