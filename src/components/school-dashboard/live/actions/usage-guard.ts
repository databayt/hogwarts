// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The LiveKit minutes guard — a once-a-day look at the month's meter.
//
// Live classes run on LiveKit Cloud's FREE Build plan until LiveKit is
// self-hosted (D-20261109-livekit-free-tier-bridge). Its 5,000 participant-
// minutes a month are a HARD cap shared by every school: once they are used,
// new connections fail — every school's classes, until the monthly reset. The
// only thing that can see that coming is a meter someone reads. This reads it
// (`getPlatformLiveUsage`, the same accounting as the DEVELOPER observability
// page) and emails the platform once a day while usage is at or past 80% of
// the configured tier, saying which schools are spending it. Below 80% it
// says nothing. On a paid or self-hosted tier, set `LIVEKIT_TIER_*` to match.
//
// Stateless on purpose: it runs on the first reminders-cron tick after 06:00
// UTC, so "once a day" needs no marker row — and a day it fails to run costs
// one missing email, not a stuck flag.
import "server-only"

import { currentMonthStart, getPlatformLiveUsage } from "./usage"

/** The UTC hour the daily check runs in (its first quarter-hour tick). */
const GUARD_HOUR_UTC = 6

export type MinutesGuardResult =
  | { ran: false }
  | { ran: true; percent: number; level: 0 | 80 | 100; emailed: boolean }

/** True on the one reminders-cron tick per day the guard owns. */
export function isGuardTick(now: Date): boolean {
  return now.getUTCHours() === GUARD_HOUR_UTC && now.getUTCMinutes() < 15
}

export async function runLiveMinutesGuard(
  now: Date = new Date()
): Promise<MinutesGuardResult> {
  if (!isGuardTick(now)) return { ran: false }

  const usage = await getPlatformLiveUsage(currentMonthStart(now), now)
  const percent = Math.max(
    usage.percentOfTier.webrtc,
    usage.percentOfTier.recording
  )
  const level: 0 | 80 | 100 = percent >= 100 ? 100 : percent >= 80 ? 80 : 0
  if (level === 0) return { ran: true, percent, level, emailed: false }

  const top = [...usage.rows]
    .sort((a, b) => b.participantMinutes - a.participantMinutes)
    .slice(0, 5)
    .map(
      (r) =>
        `${r.name} (${r.subdomain}): ${r.participantMinutes} participant-min, ${r.recordingMinutes} recording-min`
    )
  const message = [
    `Live classes have used ${percent}% of the LiveKit plan this month.`,
    `Participant minutes: ${usage.totals.participantMinutes} of ${usage.tier.webrtcMinutes} (${usage.percentOfTier.webrtc}%).`,
    `Recording minutes: ${usage.totals.recordingMinutes} of ${usage.tier.recordingMinutes} (${usage.percentOfTier.recording}%).`,
    level === 100
      ? "Over the included minutes: overage is billing now."
      : "Approaching the included minutes.",
    "",
    "Top schools:",
    ...top,
  ].join("\n")

  let emailed = false
  try {
    // Imported here, not at the top: `@/lib/email` constructs its Resend
    // client at module load and throws without a key — which would take the
    // whole reminders cron (this module's importer) down with it, on every
    // run, for a guard that emails on at most one tick a day.
    const { sendEmail } = await import("@/lib/email")
    await sendEmail({
      to: process.env.OPS_ALERT_EMAIL || "hi@databayt.org",
      subject: `[hogwarts] LiveKit minutes at ${percent}% of plan`,
      template: "plain",
      data: { message },
    })
    emailed = true
  } catch (err) {
    console.error("[live-minutes-guard] alert email failed", {
      percent,
      err: err instanceof Error ? err.message : String(err),
    })
  }
  console.warn("[live-minutes-guard]", { percent, level, emailed })
  return { ran: true, percent, level, emailed }
}
