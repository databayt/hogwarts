// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

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
