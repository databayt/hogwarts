// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import {
  parseRoomHostsMetadata,
  type RoomHostsMetadata,
} from "@/components/school-dashboard/live/types"

import { getRoomServiceClient } from "./client"

/**
 * Ensure a LiveKit room exists. Idempotent — if the room is already there,
 * the existing room is returned and SFU does not reset it.
 */
export async function ensureRoom(opts: {
  roomName: string
  maxParticipants: number
  /** Auto-close the room after this many seconds of inactivity. Default 5 min. */
  emptyTimeoutSec?: number
}): Promise<void> {
  const svc = getRoomServiceClient()
  try {
    await svc.createRoom({
      name: opts.roomName,
      emptyTimeout: opts.emptyTimeoutSec ?? 5 * 60,
      // Keep the room open after the LAST participant leaves, so a teacher
      // whose connection blips while alone in the room comes back to the same
      // room (and the same egress) instead of a finished session.
      departureTimeout: 120,
      maxParticipants: opts.maxParticipants,
    })
  } catch (err) {
    // LiveKit returns AlreadyExists — safe to ignore.
    const msg = err instanceof Error ? err.message : String(err)
    if (!/already exists/i.test(msg)) {
      throw err
    }
  }
}

export async function endRoom(roomName: string): Promise<void> {
  const svc = getRoomServiceClient()
  await svc.deleteRoom(roomName)
}

export async function removeParticipant(
  roomName: string,
  identity: string
): Promise<void> {
  const svc = getRoomServiceClient()
  await svc.removeParticipant(roomName, identity)
}

export async function listParticipants(roomName: string) {
  const svc = getRoomServiceClient()
  return svc.listParticipants(roomName)
}

/**
 * Publish `identity` into the room's authoritative HOST set — ROOM metadata,
 * `{ hosts: string[] }` — idempotent set-union so a repeated call (every
 * ~4-min token refresh re-calls this for the same HOST/CO_HOST) is a no-op.
 *
 * This is the trust source `use-class-channel.ts` reads to decide whose
 * data-channel messages are host-authoritative. It must NOT be
 * `participant.attributes.role`: PARTICIPANT tokens hold
 * `canUpdateOwnMetadata` too (so a student can raise a hand), and that grant
 * lets a participant's own client rewrite ANY attribute key, `role`
 * included — the SFU only checks that the caller holds the grant, not which
 * key it touches. This function is the ONLY writer of room metadata, and it
 * runs `server-only` (called from `join-core.ts`, itself `server-only`)
 * through `RoomServiceClient`, authenticated with the LiveKit API
 * key/secret — a credential that never reaches the browser. No participant
 * token, regardless of its own grants (even a HOST's `roomAdmin: true`),
 * can call this; only server code holding the API secret can.
 *
 * Read-modify-write, not a compare-and-swap: two HOST/CO_HOST joins racing
 * within the same instant could each read the pre-update list and one write
 * could clobber the other's. Acceptable here — the next metadata write (the
 * next refresh, or any other participant joining) converges the set, and
 * losing a few seconds of trust for one co-host is not a security hole
 * (their messages are simply ignored, never accepted from someone else).
 */
export async function addRoomHost(
  roomName: string,
  identity: string
): Promise<void> {
  const svc = getRoomServiceClient()
  const [room] = await svc.listRooms([roomName])
  const hosts = parseRoomHostsMetadata(room?.metadata)
  if (hosts.includes(identity)) return
  const next: RoomHostsMetadata = { hosts: [...hosts, identity] }
  await svc.updateRoomMetadata(roomName, JSON.stringify(next))
}
