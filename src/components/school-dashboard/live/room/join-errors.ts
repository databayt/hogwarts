// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Every code `joinLiveClass` can refuse the pre-join card with.
 *
 * The room page turns each one into a translated sentence and hands the map to
 * the client, because `resolveLiveClassError` wants the whole dictionary and
 * shipping that to the browser to render one sentence is not a trade worth
 * making.
 *
 * Two rules meet in this little file, and both are why it is not simply a
 * `const` inside `room.tsx`:
 *
 *   1. `room.tsx` is `"use client"`. A Server Component importing a plain
 *      value from a client module receives a client-reference PROXY, not the
 *      array — `for (const code of JOIN_ERROR_CODES)` throws "is not
 *      iterable" at request time, with nothing said at build time.
 *   2. `ACTION_ERRORS` itself lives in a `server-only` module, so the literals
 *      are retyped here rather than imported — the same rule `DENY_CODES` in
 *      `room.tsx` already follows.
 *
 * Keep it in step with the `actionError` calls in `actions/join-core.ts` and
 * the concurrent-cap helper it calls.
 */
export const JOIN_ERROR_CODES = [
  "NOT_AUTHENTICATED",
  "MISSING_SCHOOL",
  "SCHOOL_NOT_FOUND",
  "UNAUTHORIZED",
  "LIVE_CLASS_NOT_FOUND",
  "LIVE_CLASS_PARTICIPANT_DENIED",
  "LIVE_CLASS_INVALID_STATE",
  "LIVE_CLASS_PROVIDER_UNAVAILABLE",
  "LIVE_CLASS_MAX_CONCURRENT",
  "LIVE_CLASS_ROOM_FULL",
] as const
