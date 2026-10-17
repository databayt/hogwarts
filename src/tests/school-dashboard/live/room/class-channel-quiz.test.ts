// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import {
  applyMessage,
  initialClassState,
  snapshotOf,
} from "@/components/school-dashboard/live/room/class-channel"

const host = { identity: "t1", name: "Teacher", isHost: true }
const amira = { identity: "s1", name: "Amira", isHost: false }
const quiz = { id: "qa-1", title: "Exit ticket", kind: "quick" as const }

describe("a quiz launched in the room", () => {
  it("opens and closes only on the host's word", () => {
    const forged = applyMessage(
      initialClassState(),
      { t: "quiz.open", quiz },
      amira
    )
    expect(forged.quiz).toBeNull()

    const open = applyMessage(
      initialClassState(),
      { t: "quiz.open", quiz },
      host
    )
    expect(open.quiz).toEqual(quiz)

    expect(applyMessage(open, { t: "quiz.close", id: "qa-1" }, amira).quiz)
      .toEqual(quiz)
    expect(
      applyMessage(open, { t: "quiz.close", id: "other" }, host).quiz
    ).toEqual(quiz)
    expect(
      applyMessage(open, { t: "quiz.close", id: "qa-1" }, host).quiz
    ).toBeNull()
  })

  it("refuses an unknown kind", () => {
    const s = applyMessage(
      initialClassState(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { t: "quiz.open", quiz: { ...quiz, kind: "url" as any } },
      host
    )
    expect(s.quiz).toBeNull()
  })

  it("reaches a late joiner through the snapshot", () => {
    const open = applyMessage(
      initialClassState(),
      { t: "quiz.open", quiz },
      host
    )
    const late = applyMessage(initialClassState(), snapshotOf(open), host)
    expect(late.quiz).toEqual(quiz)
  })
})
