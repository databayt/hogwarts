"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Fragment, memo, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * The few markdown shapes an answer uses — numbered steps, bullets,
 * paragraphs, **bold** (the guides bold the names of buttons and menus) — as
 * React nodes. No HTML is ever parsed, so a tag in an answer stays text.
 * Replaces the per-line markdown strip the server did, which threw the bold
 * button names away.
 */

const URL_RE = /(https?:\/\/[^\s<>()]+[^\s<>().,،؛:!?])/g

/**
 * Only our own hosts become links. School data and visitors' words reach the
 * model, so a URL it repeats could be anyone's — shown as text, not a link.
 */
const LINK_ROOTS = ["balqalam.com", "databayt.org"]

export function linkable(url: string, here?: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== "https:" && protocol !== "http:") return false
    const current =
      here ?? (typeof window === "undefined" ? "" : window.location.hostname)
    if (hostname === current) return true
    return LINK_ROOTS.some((r) => hostname === r || hostname.endsWith(`.${r}`))
  } catch {
    return false
  }
}

function bold(text: string, key: string): ReactNode[] {
  // Mid-stream a pair may not be closed yet: hide the dangling marker.
  const pairs = text.split("**").length - 1
  const even = pairs % 2 ? text.replace(/\*\*(?!.*\*\*)/, "") : text
  return even.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={`${key}b${i}`} className="font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={`${key}t${i}`}>{part}</Fragment>
    )
  )
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  text.split(URL_RE).forEach((part, i) => {
    if (i % 2 === 0) out.push(...bold(part, `${key}-${i}`))
    else if (!linkable(part)) out.push(part)
    else
      out.push(
        <a
          key={`${key}-${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className="text-primary break-all underline underline-offset-2"
        >
          {part}
        </a>
      )
  })
  return out
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ol"; start: number; items: string[] }
  | { kind: "ul"; items: string[] }

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let gap = true
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "")
    const last = blocks.at(-1)
    const ol = line.match(/^\s*(\d{1,3})[.)]\s+(.*)$/)
    if (ol) {
      if (last?.kind === "ol") last.items.push(ol[2]!)
      else blocks.push({ kind: "ol", start: Number(ol[1]), items: [ol[2]!] })
      gap = false
      continue
    }
    const ul = line.match(/^\s*[-*•]\s+(.*)$/)
    if (ul) {
      if (last?.kind === "ul") last.items.push(ul[1]!)
      else blocks.push({ kind: "ul", items: [ul[1]!] })
      gap = false
      continue
    }
    if (!line.trim()) {
      gap = true
      continue
    }
    // A heading reads as its words: answers are short, headings shout.
    const words = line.replace(/^\s*#{1,6}\s+/, "")
    if (!gap && last?.kind === "p") last.lines.push(words)
    else blocks.push({ kind: "p", lines: [words] })
    gap = false
  }
  return blocks
}

export const MarkdownLite = memo(function MarkdownLite({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <div
      className={cn("space-y-2 text-sm leading-relaxed break-words", className)}
    >
      {parseBlocks(text).map((block, i) => {
        if (block.kind === "ol")
          return (
            <ol
              key={i}
              start={block.start}
              className="list-decimal space-y-1 ps-5"
            >
              {block.items.map((item, j) => (
                <li key={j}>{inline(item, `${i}.${j}`)}</li>
              ))}
            </ol>
          )
        if (block.kind === "ul")
          return (
            <ul key={i} className="list-disc space-y-1 ps-5">
              {block.items.map((item, j) => (
                <li key={j}>{inline(item, `${i}.${j}`)}</li>
              ))}
            </ul>
          )
        return (
          <p key={i}>
            {block.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, `${i}.${j}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
})
