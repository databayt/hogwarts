// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * LiveKit room naming convention — single source of truth.
 *
 * Format: `sch-{schoolId}-lc-{sessionId}`
 *
 * Globally unique by construction (cuid sessionIds), and embeds `schoolId`
 * so the SFU namespace can't collide across tenants and the webhook handler
 * can recover the tenant from the room name alone.
 */

const PREFIX = "sch-"
const SEP = "-lc-"

export function roomNameFor(schoolId: string, sessionId: string): string {
  if (!schoolId || !sessionId) {
    throw new Error("roomNameFor requires both schoolId and sessionId")
  }
  return `${PREFIX}${schoolId}${SEP}${sessionId}`
}

export type ParsedRoomName = {
  schoolId: string
  sessionId: string
}

export function parseRoomName(roomName: string): ParsedRoomName | null {
  if (!roomName?.startsWith(PREFIX)) return null
  const rest = roomName.slice(PREFIX.length)
  const sepIdx = rest.indexOf(SEP)
  if (sepIdx <= 0) return null
  const schoolId = rest.slice(0, sepIdx)
  const sessionId = rest.slice(sepIdx + SEP.length)
  if (!schoolId || !sessionId) return null
  return { schoolId, sessionId }
}
