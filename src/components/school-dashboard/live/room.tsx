"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

import { isMainDomainHost } from "@/lib/root-domain"
import { useOpenOnHero } from "@/components/lumos/shared/title-card"
import type { ParticipantsPanelLabels } from "@/components/school-dashboard/live/participants-panel"
import type { RoomJoinTicket } from "@/components/school-dashboard/live/types"

import { joinLiveClass } from "./actions/tokens"
import { AndroidAppCard } from "./android-app-card"
import { getNextClassAfter } from "./actions/next-class"
import {
  NextClassCard,
  type NextClassData,
  type NextClassLabels,
} from "./next-class-card"
import type { RoomLabels } from "./room/labels"
import type { SlideOption } from "./room/slide-options"
import {
  RoomTitleCard,
  type RoomTitleCardData,
  type RoomTitleCardLabels,
} from "./room/title-card"

interface Props {
  sessionId: string
  title: string
  locale: string
  /** Everything the pre-join card prints, resolved on the server. */
  card: RoomTitleCardData
  /** The shelf under the card — the section's other classes, rendered on the
   *  SERVER and handed over as markup. A node rather than data because the
   *  row needs the translation cache and the school's timezone, and this
   *  component has neither; passing it through keeps the shelf out of the
   *  client bundle entirely. Rendered only before the join, so it disappears
   *  the moment the room takes the screen. */
  shelf?: React.ReactNode
  /** The dashboard header, rendered on the server with its providers. It sits
   *  ABOVE the card on a phone — the lumos lesson's arrangement — and the page
   *  opens scrolled past it, so the artwork owns the top edge and the bar is
   *  one scroll up. Pre-join only: the call takes the whole screen. */
  header?: React.ReactNode
  labels: {
    error: string
    /** Code → translated sentence, for every refusal Join can produce.
     *  A MAP rather than a resolver function: this crosses the server/client
     *  boundary, and a function is not serializable. Keyed by the codes in
     *  `JOIN_ERROR_CODES`, with `""` holding the fallback. */
    joinErrors: Record<string, string>
    room: RoomLabels
    participants: ParticipantsPanelLabels
    card: RoomTitleCardLabels
  }
  slides: SlideOption[]
  nextClassLabels?: NextClassLabels
  /** The school's timezone, to print the next class's start in it. */
  timeZone?: string
  /** The signed-in viewer's email, for the watermark's visible mark. The
   *  LiveKit participant NAME is a display name, not an address. */
  viewerEmail?: string | null
}

// Eligibility verdicts — the server said no. Eject immediately; retrying
// would only stretch the ≤5-min revocation window.
//
// Everything else (network blip, 5xx, SFU hiccup) is transient and must NEVER
// tear down the call. Verified against the SDK: `Room.connect` returns early
// when the room is already connected, so the token this poll fetches never
// reaches the live room at all, and the SFU refreshes tokens for reconnects
// itself over the signal channel (`SignalClient.onTokenRefresh`). This poll is
// therefore an ELIGIBILITY HEARTBEAT, not a token pump — a class in progress
// is completely unaffected by it failing, so ejecting a working call because a
// heartbeat endpoint had a bad minute is pure self-harm.
//
// Literals mirror ACTION_ERRORS values (not imported — keep server-only
// modules out of this client bundle).
//
// NOT_AUTHENTICATED / MISSING_SCHOOL are NOT here: they mean the web session
// behind the heartbeat lapsed (cookie expiry on a phone browser), not that the
// viewer lost the class. They fall to the retry path so the call keeps going —
// an Al-Ibda Grade 6 student was thrown out of his own running class with
// "Token expired" this way (11-17).
const DENY_CODES = new Set([
  "UNAUTHORIZED",
  "LIVE_CLASS_NOT_FOUND",
  "LIVE_CLASS_PARTICIPANT_DENIED",
  "LIVE_CLASS_INVALID_STATE",
])
const RETRY_DELAY_MS = 20_000
/** How often a student held on the card asks again whether the teacher has
 *  started; backs off to the cap so a class that never starts costs little. */
const WAIT_RETRY_MS = 10_000
const MAX_WAIT_RETRY_MS = 30_000
/** Back off on repeated failure instead of hammering a struggling endpoint. */
const MAX_RETRY_DELAY_MS = 5 * 60_000

/**
 * Everything that needs the LiveKit SDK lives in `room/in-call.tsx`, fetched
 * only once the viewer asks to join: the pre-join card — the first thing
 * anyone sees — carries none of the video library. `warmInCall` starts the
 * same download on pointer-down of the card's buttons, so it overlaps the
 * token request instead of following it.
 */
const warmInCall = () => import("./room/in-call")
const InCall = dynamic(() => import("./room/in-call").then((m) => m.InCall), {
  ssr: false,
  // The room's own background, so the card gives way to a steady screen
  // rather than a flash while the SDK arrives.
  loading: () => (
    <div data-lk-theme="default" className="bg-background h-dvh w-full" />
  ),
})

type Ended =
  | { kind: "removed" }
  | { kind: "ended" }
  | { kind: "elsewhere" }
  | { kind: "lost" }

/**
 * Full-screen live-class room. Owns the join ticket's lifecycle (refresh
 * before expiry, eject on a server "no") and how the room ends; everything
 * inside the call lives in `room/room-shell.tsx`.
 */
export function RoomClient({
  sessionId,
  title,
  locale,
  card,
  shelf,
  header,
  labels,
  slides,
  viewerEmail,
  nextClassLabels,
  timeZone,
}: Props) {
  const router = useRouter()
  // No ticket until the viewer asks for one. Minting it is not a read: as
  // HOST it opens the SFU room, flips the session to `live`, stamps
  // `actualStart` and writes the participant row that presence is later read
  // from. Doing that on page load meant a teacher who opened the tab to look
  // at the class had already started it and marked themselves present.
  const [ticket, setTicket] = useState<RoomJoinTicket | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  // Arrived before the teacher: hold on the card and retry, rather than show a
  // refusal for what is the normal way into a class.
  const [waiting, setWaiting] = useState(false)
  const waitTries = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState<Ended | null>(null)
  // The way forward once the class is over — asked for when it ends, so the
  // answer is current and entering a room costs nothing for it.
  const [nextClass, setNextClass] = useState<NextClassData | null>(null)
  const endedKind = ended?.kind
  useEffect(() => {
    if (endedKind !== "ended") return
    let cancelled = false
    void getNextClassAfter(sessionId)
      .then((next) => {
        if (!cancelled) setNextClass(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [endedKind, sessionId])

  const join = useCallback(async () => {
    setJoining(true)
    setJoinError(null)
    try {
      const result = await joinLiveClass(sessionId)
      if ("success" in result && result.success) {
        setWaiting(false)
        setTicket(result.data)
        return
      }
      const code = "error" in result ? result.error : undefined
      setWaiting(code === "LIVE_CLASS_NOT_STARTED")
      setJoinError(
        (code ? labels.joinErrors[code] : undefined) ?? labels.joinErrors[""]
      )
    } catch {
      setJoinError(labels.joinErrors[""])
    } finally {
      setJoining(false)
    }
  }, [sessionId, labels])

  // Refresh the token ~60s before expiry; retry transient failures in place.
  // Dormant until there is a ticket to refresh — nothing expires on the card.
  useEffect(() => {
    if (error || !ticket) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let retries = 0

    const refresh = async () => {
      try {
        const res = await fetch(
          `/api/conference/token?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        )
        const result = (await res.json()) as
          | { success: true; data: RoomJoinTicket }
          | { success: false; error?: string }
        if (cancelled) return
        if (result.success) {
          setTicket(result.data) // re-arms the effect for the next window
          return
        }
        if (result.error && DENY_CODES.has(result.error)) {
          // The class ended (or was cancelled) under us: say THAT. It used to
          // fall into the eligibility refusal below — "Token expired. Please
          // rejoin." — for a class there was nothing left to rejoin.
          if (result.error === "LIVE_CLASS_INVALID_STATE") {
            setEnded({ kind: "ended" })
          } else {
            setError(labels.error)
          }
          return
        }
      } catch {
        // fall through to the transient-retry path
      }
      if (cancelled) return
      // Keep trying, with backoff, for as long as the user is in the room.
      // There is no failure count at which giving up helps: the call is fine,
      // and the only thing lost is the revocation check.
      retries++
      timer = setTimeout(
        refresh,
        Math.min(RETRY_DELAY_MS * retries, MAX_RETRY_DELAY_MS)
      )
    }

    const expiresAtMs = new Date(ticket.expiresAt).getTime()
    const refreshAt = Math.max(0, expiresAtMs - Date.now() - 60_000)
    timer = setTimeout(refresh, refreshAt)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [ticket?.expiresAt, sessionId, labels.error, error])

  // The clock closes a timetable class (`RoomJoinTicket.clock`). The ticket
  // carries DURATIONS, armed here against this device's own clock at receipt —
  // so a phone whose wall clock is wrong still closes on time — and every
  // heartbeat brings a fresh pair, which keeps a long class true. At the bell
  // the room says it is closing; at the close everyone gets the ended screen
  // together, instead of "token expired" at whatever heartbeat came next.
  const [closing, setClosing] = useState(false)
  const clock = ticket?.clock
  useEffect(() => {
    if (!clock) return
    const atBell = setTimeout(
      () => setClosing(true),
      Math.max(0, clock.endsInMs)
    )
    const atClose = setTimeout(
      () => setEnded({ kind: "ended" }),
      Math.max(0, clock.closesInMs)
    )
    return () => {
      clearTimeout(atBell)
      clearTimeout(atClose)
    }
  }, [clock])

  // While held on the card, ask again on a timer. A fresh wait starts the
  // backoff over; any other answer (a ticket, a real refusal) stops it.
  useEffect(() => {
    if (!waiting) {
      waitTries.current = 0
      return
    }
    if (joining) return
    waitTries.current++
    const timer = setTimeout(
      () => void join(),
      Math.min(WAIT_RETRY_MS * waitTries.current, MAX_WAIT_RETRY_MS)
    )
    return () => clearTimeout(timer)
  }, [waiting, joining, join])

  const detailHref = `/${locale}/live/${sessionId}`
  // The class page sends an open class straight back to this card, so the
  // card's way OUT is the block's front page.
  const landingHref = `/${locale}/live`

  // On a phone the header renders above the card; the page opens past it, on
  // the artwork's top edge, exactly as the lumos lesson does. Wider screens
  // hide the header, measure 0 and stay put.
  const cardRef = useRef<HTMLDivElement>(null)
  useOpenOnHero(cardRef, !ticket && !error && !ended, sessionId)

  const warmOnButton = (e: React.SyntheticEvent) => {
    if ((e.target as HTMLElement).closest("button")) void warmInCall()
  }

  if (error || ended) {
    const message = error
      ? error
      : ended?.kind === "removed"
        ? labels.room.removedByHost
        : ended?.kind === "ended"
          ? labels.room.classEnded
          : ended?.kind === "elsewhere"
            ? labels.room.openedElsewhere
            : labels.room.connectionLost
    return (
      <div className="bg-background flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p
          className={
            "text-base font-medium " +
            (error || ended?.kind === "lost" ? "text-destructive" : "")
          }
        >
          {message}
        </p>
        {ended?.kind === "ended" && nextClassLabels ? (
          <NextClassCard
            next={nextClass}
            lang={locale}
            timeZone={timeZone ?? "UTC"}
            labels={nextClassLabels}
          />
        ) : null}
        <div className="flex gap-3">
          {ended?.kind === "lost" && (
            // A full reload re-runs the server join: fresh eligibility check,
            // fresh token, clean SDK state.
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
              onClick={() => {
                // Opened on the bare root (balqalam.com) the room has no
                // page, so a reload 404s. Route through /my-school, which
                // resolves the school and forwards to its own host.
                const { hostname, pathname, search } = window.location
                if (isMainDomainHost(hostname)) {
                  const next = encodeURIComponent(`${pathname}${search}`)
                  window.location.assign(`/${locale}/my-school?next=${next}`)
                  return
                }
                window.location.reload()
              }}
            >
              {labels.room.rejoin}
            </button>
          )}
          <button
            type="button"
            className="text-sm underline"
            onClick={() => router.push(detailHref)}
          >
            {labels.room.backToClass}
          </button>
        </div>
      </div>
    )
  }

  // Before the ticket: the class's title card, and the page that carries on
  // under it. After it: the room, which takes the whole screen.
  if (!ticket) {
    return (
      <>
        {header}
        <div
          ref={cardRef}
          // Start the video library's download the moment a finger lands on a
          // button (Join is one of them) — it then overlaps the token request.
          onPointerDownCapture={warmOnButton}
          onTouchStartCapture={warmOnButton}
        >
          <AndroidAppCard labels={labels.room} />
          <RoomTitleCard
            data={card}
            labels={labels.card}
            sessionId={sessionId}
            detailHref={detailHref}
            backHref={landingHref}
            pending={joining || waiting}
            error={joinError}
            onJoin={() => void join()}
          />
          {joinError && (
            <p className="mt-2 px-4 text-center text-sm">
              <a
                className="text-muted-foreground underline"
                href={`/${locale}/live/network-test`}
              >
                {labels.room.testConnection}
              </a>
            </p>
          )}
        </div>
        {shelf}
      </>
    )
  }

  return (
    <InCall
      ticket={ticket}
      sessionId={sessionId}
      title={title}
      locale={locale}
      card={card}
      labels={labels}
      slides={slides}
      viewerEmail={viewerEmail}
      closing={closing}
      detailHref={detailHref}
      onEnd={(kind) => setEnded({ kind })}
    />
  )
}
