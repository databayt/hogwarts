// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { capUntilNextMonth } from "./spend"

/**
 * The breaker in front of Claude: three failures within a minute stop
 * trying for five minutes; a bad key or model stops it for half an hour; a
 * spent budget stops it until next month. Per process — one container.
 * Revoking the key in the Console is the instant kill switch: the next call
 * gets a 401 and the breaker opens.
 */
let failures: number[] = []
let openUntil = 0

export function claudeAvailable(): boolean {
  return Date.now() >= openUntil
}

export function noteClaudeFailure(kind: "count" | "open" | "cap" | "none") {
  const now = Date.now()
  if (kind === "open") openUntil = now + 30 * 60_000
  else if (kind === "cap") capUntilNextMonth()
  else if (kind === "count") {
    failures = failures.filter((t) => now - t < 60_000)
    failures.push(now)
    if (failures.length >= 3) {
      openUntil = now + 5 * 60_000
      failures = []
    }
  }
}

/** Tests only. */
export function __resetBreaker() {
  failures = []
  openUntil = 0
}
