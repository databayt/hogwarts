// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ConferenceParticipantRole } from "@/components/school-dashboard/live/types"

import type { RoomLabels } from "./labels"

/**
 * Who the reader is still waiting for.
 *
 * The first class with students (2026-11-10) had the teacher and the students
 * in the room at different times for half an hour: each came in, read «أنت
 * وحدك في هذه الغرفة», and left within two minutes. "You are alone" is true
 * and useless. What the reader needs is who is missing and a reason to stay.
 *
 * Roles come from each participant's `role` attribute (livekit/token.ts). That
 * attribute is a label, not a trust signal — fine for a sentence on the
 * stage, never for a permission.
 */
export type WaitingFor = "students" | "teacher" | null

const isHost = (role: string | undefined) =>
  role === "HOST" || role === "CO_HOST"

export function waitingFor(
  self: ConferenceParticipantRole,
  /** The `role` attribute of everyone else in the room. */
  others: ReadonlyArray<string | undefined>
): WaitingFor {
  if (isHost(self)) {
    return others.some((role) => role === "PARTICIPANT") ? null : "students"
  }
  // A student among classmates and a watching parent both wait for the teacher.
  return others.some(isHost) ? null : "teacher"
}

export function waitingText(
  labels: RoomLabels,
  self: ConferenceParticipantRole,
  waiting: WaitingFor
): string | null {
  if (waiting === "students") return labels.waitingForStudents
  if (waiting === "teacher") {
    return self === "OBSERVER" ? labels.teacherNotIn : labels.waitingForTeacher
  }
  return null
}
