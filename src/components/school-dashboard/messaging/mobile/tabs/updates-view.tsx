"use client"

import { useEffect, useState } from "react"

import { getMobileUpdatesFeed } from "../../actions"
import type { MobileUpdateRow } from "../../mobile-tabs-queries"
import { IosListRow } from "../ios-list-row"
import { IosSectionHeading, IosTabEmpty, IosTabPage } from "../ios-tab-page"

type Props = {
  title: string
  locale: "ar" | "en"
  onOpen?: (announcementId: string) => void
  labels: {
    recent: string
    emptyTitle: string
    emptyBody: string
    loading: string
    loadFailed: string
  }
}

/**
 * WhatsApp's Updates tab is Status plus Channels — ephemeral personal posts and
 * broadcast feeds. A school's equivalent of a broadcast nobody replies to is
 * its announcements, so that is what this page carries. Status itself has no
 * counterpart here and drawing an inert "My status" row would be a dead
 * control, so it is left out.
 *
 * Fetched on first open, not with the conversation list: this is a secondary
 * surface and should not slow the threads down.
 */
export function UpdatesView({ title, locale, onOpen, labels }: Props) {
  const { items, state } = useLazyFeed()

  return (
    <IosTabPage title={title}>
      {state === "loading" && <LoadingRows label={labels.loading} />}

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
              key={row.id}
              title={row.title || firstLine(row.body) || ""}
              subtitle={
                row.title ? firstLine(row.body) : (row.authorName ?? null)
              }
              avatarUrl={row.authorImage}
              avatarIcon="ic-wa-tab-updates-fill-32"
              avatarVariant={row.priority === "urgent" ? "product" : "person"}
              meta={relativeTime(row.publishedAt, locale)}
              onClick={onOpen ? () => onOpen(row.id) : undefined}
            />
          ))}
        </>
      )}
    </IosTabPage>
  )
}

function useLazyFeed() {
  const [items, setItems] = useState<MobileUpdateRow[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let alive = true
    getMobileUpdatesFeed()
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

  return { items, state }
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-[18px] px-[16px] pt-[18px]" aria-busy>
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-[12.66px]">
          <div className="size-[56px] shrink-0 animate-pulse rounded-full bg-[color:var(--wa-surface-cta-filters)]" />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="h-[14px] w-[55%] animate-pulse rounded-full bg-[color:var(--wa-surface-cta-filters)]" />
            <div className="h-[12px] w-[75%] animate-pulse rounded-full bg-[color:var(--wa-surface-cta-filters)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function firstLine(body: string | null): string | null {
  if (!body) return null
  const line = body.split("\n").find((l) => l.trim().length > 0)
  return line?.trim() ?? null
}

/** Same shape WhatsApp uses on a status row: "4h", "yesterday", a date. */
export function relativeTime(iso: string | null, locale: "ar" | "en"): string {
  if (!iso) return ""
  const then = new Date(iso)
  const minutes = Math.round((Date.now() - then.getTime()) / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (minutes < 1) return rtf.format(0, "minute")
  if (minutes < 60) return rtf.format(-minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, "hour")
  const days = Math.round(hours / 24)
  if (days < 7) return rtf.format(-days, "day")

  return then.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
  })
}
