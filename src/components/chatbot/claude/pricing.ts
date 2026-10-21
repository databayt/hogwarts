// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What one Claude answer cost. Claude Haiku 5.5, USD per million tokens,
 * for prompts up to 100K tokens (platform.claude.com pricing, checked
 * 2026-10-21). Each usage field has its own price — mkan's reader billed
 * cache reads and writes at the base input price, wrong in both directions.
 */
export const HAIKU_55 = {
  input: 0.1,
  write5m: 0.125,
  write1h: 0.2,
  read: 0.01,
  output: 0.5,
} as const

/** Above this many prompt tokens Haiku 5.5 bills every field at 5×. */
export const LONG_PROMPT_TOKENS = 100_000

export interface ClaudeUsage {
  /** Uncached input tokens. */
  input: number
  /** Cache hits. */
  read: number
  /** Cache writes, both lifetimes. */
  write: number
  /** Of `write`, the 1-hour ones. */
  write1h: number
  output: number
}

export function costUsd(u: ClaudeUsage, price = HAIKU_55): number {
  const prompt = u.input + u.read + u.write
  const rate = prompt > LONG_PROMPT_TOKENS ? 5 : 1
  const write5m = Math.max(0, u.write - u.write1h)
  return (
    (rate *
      (u.input * price.input +
        write5m * price.write5m +
        u.write1h * price.write1h +
        u.read * price.read +
        u.output * price.output)) /
    1e6
  )
}

/** An answer cut short has no final usage: its words are about 3 chars a token. */
export const estimateOutputTokens = (chars: number) => Math.ceil(chars / 3)
