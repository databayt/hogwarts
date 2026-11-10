// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { isLiveKitConfigured } from "./client"
import { stopEgress } from "./egress"
import { endRoom } from "./rooms"

/** A LiveKit call that does not answer must not hold a cron run open. */
const CALL_TIMEOUT_MS = 5_000

function withTimeout<T>(work: Promise<T>): Promise<T | void> {
  return Promise.race([
    work,
    new Promise<void>((resolve) => setTimeout(resolve, CALL_TIMEOUT_MS)),
  ])
}

/**
 * Close a class's SFU room: stop any recording still running, then end the
 * room. Best-effort on every step and never throws — the room may already be
 * gone, and the row's own state has been decided by the caller before this.
 *
 * It exists because the clock ended a class in the DATABASE only. The room —
 * and its recording — ran on for as long as one tab stayed open, and the
 * people in it were told "token expired" at their next heartbeat instead of
 * "the class has ended". Ending the room sends every client ROOM_DELETED,
 * which the room already shows as the ended screen.
 */
export async function closeRoom(
  roomName: string,
  egressIds: string[] = []
): Promise<void> {
  if (!isLiveKitConfigured()) return
  for (const id of egressIds) {
    await withTimeout(stopEgress(id).catch(() => {}))
  }
  await withTimeout(endRoom(roomName).catch(() => {}))
}
