/**
 * Post to private #hogwarts-funnel through `hermes send` — Hermes' no-LLM
 * path (reuses the gateway's Slack bot token; no model, no running gateway
 * needed). Best effort: a card that fails to post must never fail the loop
 * step that produced it, but it is reported, never swallowed silently.
 */
import { spawnSync } from "node:child_process"

export const FUNNEL_CHANNEL = "slack:C0BRXUREB8W"
const HERMES = `${process.env.HOME}/.local/bin/hermes`

export function postCard(text: string, subject?: string): boolean {
  const res = spawnSync(
    HERMES,
    [
      "send",
      "--to",
      FUNNEL_CHANNEL,
      "--quiet",
      ...(subject ? ["--subject", subject] : []),
      text,
    ],
    { encoding: "utf8", timeout: 60_000 }
  )
  if (res.status !== 0) {
    console.log(
      `  (slack card not posted: ${(res.stderr || res.stdout || "").slice(0, 200)})`
    )
    return false
  }
  return true
}
