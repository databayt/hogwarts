// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who a person in the room is told they are waiting for. On 2026-11-10 the
 * first class with students had the teacher and the students arrive at
 * different times for half an hour; each read "you are alone" and left.
 */

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import {
  waitingFor,
  waitingText,
} from "@/components/school-dashboard/live/room/waiting"

let others: Array<{ attributes?: Record<string, string> }> = []
const updateOn: unknown[] = []
vi.mock("@livekit/components-react", () => ({
  useRemoteParticipants: (opts?: { updateOnlyOn?: unknown[] }) => {
    updateOn.push(opts?.updateOnlyOn)
    return others
  },
}))

const { WaitingNotice } =
  await import("@/components/school-dashboard/live/room/waiting-notice")

const labels = resolveRoomLabels(undefined)
const seat = (role?: string) => ({ attributes: role ? { role } : {} })

beforeEach(() => {
  others = []
  updateOn.length = 0
})

describe("waitingFor", () => {
  it("a teacher waits for students, whoever else is there", () => {
    expect(waitingFor("HOST", [])).toBe("students")
    expect(waitingFor("HOST", ["OBSERVER", "CO_HOST"])).toBe("students")
    expect(waitingFor("CO_HOST", ["HOST"])).toBe("students")
    expect(waitingFor("HOST", ["OBSERVER", "PARTICIPANT"])).toBeNull()
  })

  it("a student waits for a teacher, even among classmates", () => {
    expect(waitingFor("PARTICIPANT", [])).toBe("teacher")
    expect(waitingFor("PARTICIPANT", ["PARTICIPANT", "OBSERVER"])).toBe(
      "teacher"
    )
    expect(waitingFor("PARTICIPANT", ["CO_HOST"])).toBeNull()
    expect(waitingFor("PARTICIPANT", ["HOST", "PARTICIPANT"])).toBeNull()
  })

  it("a watching parent waits for the teacher too", () => {
    expect(waitingFor("OBSERVER", ["PARTICIPANT"])).toBe("teacher")
    expect(waitingFor("OBSERVER", ["HOST"])).toBeNull()
  })

  it("treats a seat with no role as nobody in particular", () => {
    expect(waitingFor("HOST", [undefined])).toBe("students")
    expect(waitingFor("PARTICIPANT", [undefined])).toBe("teacher")
  })
})

describe("waitingText", () => {
  it("picks the sentence for the seat", () => {
    expect(waitingText(labels, "HOST", "students")).toBe(
      labels.waitingForStudents
    )
    expect(waitingText(labels, "PARTICIPANT", "teacher")).toBe(
      labels.waitingForTeacher
    )
    // A parent cannot be asked to "stay": they only watch.
    expect(waitingText(labels, "OBSERVER", "teacher")).toBe(labels.teacherNotIn)
    expect(waitingText(labels, "HOST", null)).toBeNull()
  })
})

describe("WaitingNotice", () => {
  it("tells a teacher alone in the room that students have been called", () => {
    render(<WaitingNotice role="HOST" labels={labels} />)
    expect(screen.getByRole("status").textContent).toBe(
      labels.waitingForStudents
    )
  })

  it("tells a student the teacher is not in yet", () => {
    others = [seat("PARTICIPANT")]
    render(<WaitingNotice role="PARTICIPANT" labels={labels} />)
    expect(screen.getByRole("status").textContent).toBe(
      labels.waitingForTeacher
    )
  })

  it("says nothing once the other side is in", () => {
    others = [seat("HOST"), seat("PARTICIPANT")]
    const { container, rerender } = render(
      <WaitingNotice role="PARTICIPANT" labels={labels} />
    )
    expect(container.firstChild).toBeNull()
    rerender(<WaitingNotice role="HOST" labels={labels} />)
    expect(container.firstChild).toBeNull()
  })

  it("steps aside when the stage prints the sentence, and re-renders only on arrivals", () => {
    render(<WaitingNotice role="HOST" labels={labels} />)
    expect(screen.getByRole("status").className).toContain(
      "group-has-[[data-stage-alone]]/stage:hidden"
    )
    expect(updateOn[0]).toEqual(
      expect.arrayContaining(["participantConnected", "participantDisconnected"])
    )
  })
})
