"use client"

import { useEffect, useState } from "react"

import { getMobileCallsFeed } from "../../actions"
import type { MobileCallRow } from "../../mobile-tabs-queries"
import { IosListRow } from "../ios-list-row"
import { WaIcon } from "../wa-icon"
import { IosSectionHeading, IosTabEmpty, IosTabPage } from "../ios-tab-page"
import { relativeTime } from "./updates-view"

type Props = {
  title: string
  locale: "ar" | "en"
  onOpen?: (sessionId: string) => void
  labels: {
    recent: string
    joined: string
    missed: string
    upcoming: string
    live: string
    emptyTitle: string
    emptyBody: string
    encrypted: string
    loadFailed: string
  }
}

/**
 * WhatsApp's Calls list, carrying this school's live classes.
 *
 * Incoming / outgoing / missed has no meaning for a scheduled class, so the
 * outcomes are the honest ones: the reader was in the room, the room ran
 * without them, it is running now, or it has not started. Missed is drawn in
 * red exactly as the reference draws a missed call.
 *
 * The reference's "Add favourite" row is left out — it would be a control that
 * does nothing here.
 */
export function CallsView({ title, locale, onOpen, labels }: Props) {
  const [items, setItems] = useState<MobileCallRow[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let alive = true
    getMobileCallsFeed()
      .then((res) => {
        if (!alive) return
        if (res.success) {
          setItems(res.data.items)
          setState("ready")
        } else {
          setState("error")
        }
      })
      .catch(() => alive && setState("error"))
    return () => {
      alive = false
    }
  }, [])

  const outcomeLabel: Record<MobileCallRow["outcome"], string> = {
    joined: labels.joined,
    missed: labels.missed,
    upcoming: labels.upcoming,
    live: labels.live,
  }

  return (
    <IosTabPage title={title}>
      {state === "error" && (
        <IosTabEmpty title={labels.loadFailed} body={labels.emptyBody} />
      )}

      {state === "ready" && items.length === 0 && (
        <IosTabEmpty title={labels.emptyTitle} body={labels.emptyBody} />
      )}

      {state === "ready" && items.length > 0 && (
        <>
          <IosSectionHeading>{labels.recent}</IosSectionHeading>
          {items.map((row) => (
            <IosListRow
              key={`${row.id}-${row.at}`}
              title={row.title}
              tone={row.outcome === "missed" ? "danger" : "default"}
              subtitle={[outcomeLabel[row.outcome], row.subtitle]
                .filter(Boolean)
                .join(" · ")}
              subtitleIcon={<CallGlyph outcome={row.outcome} />}
              avatarIcon="ic-wa-video-32"
              avatarVariant={row.outcome === "live" ? "product" : "person"}
              meta={relativeTime(row.at, locale)}
              onClick={onOpen ? () => onOpen(row.id) : undefined}
            />
          ))}

          {/* Not `IosInfoEncrypt`: that atom ends in a hardcoded English
              "end-to-end encrypted", which would read as English inside an
              Arabic page. This line comes wholly from the dictionary. */}
          <div className="flex w-full items-center justify-center gap-[4px] pt-[18px] pb-[8px]">
            <WaIcon
              name="ic-wa-lock-12"
              className="size-[12px] shrink-0 text-[color:var(--wa-text-secondary)]"
            />
            <p className="text-center text-[11px] leading-tight text-[color:var(--wa-text-secondary)]">
              {labels.encrypted}
            </p>
          </div>
        </>
      )}
    </IosTabPage>
  )
}

/**
 * The arrow WhatsApp puts before a call's direction: up-and-out for one the
 * reader took part in, down-and-in for one that came and went without them.
 */
function CallGlyph({ outcome }: { outcome: MobileCallRow["outcome"] }) {
  const missed = outcome === "missed"
  return (
    <svg
      viewBox="0 0 16 16"
      className={
        missed
          ? "size-[14px] shrink-0 text-[color:var(--wa-text-quote-title)]"
          : "size-[14px] shrink-0 text-[color:var(--wa-text-secondary)]"
      }
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {missed ? (
        <>
          <path d="M13 3 7.5 8.5" />
          <path d="M7.5 4.5v4h4" />
        </>
      ) : (
        <>
          <path d="M3 13 8.5 7.5" />
          <path d="M8.5 12v-4h-4" transform="rotate(180 8.5 10)" />
        </>
      )}
    </svg>
  )
}
