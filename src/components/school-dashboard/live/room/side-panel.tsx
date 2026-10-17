"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useParticipants } from "@livekit/components-react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { glassPill } from "@/components/lumos/shared/video-player/glass"
import {
  handRaisedFill,
  handRaisedSlashFill,
  personWave2Fill,
  SfSymbol,
} from "@/components/lumos/shared/video-player/sf-symbols"
import type { RoomTools } from "@/components/school-dashboard/live/types"
import { InputBar } from "@/components/school-dashboard/messaging/mobile"

import { ChatTab } from "./chat-tab"
import type { Poll } from "./class-channel"
import type { RoomLabels } from "./labels"
import { QuizTab } from "./quiz"
import type { ClassChannel } from "./use-class-channel"
import type { LiveChat } from "./use-live-chat"

export type PanelTab = "chat" | "questions" | "poll" | "quiz" | "hands"

interface SidePanelProps {
  tab: PanelTab
  onTab: (tab: PanelTab) => void
  onClose: () => void
  channel: ClassChannel
  canAsk: boolean
  isHost: boolean
  tools: RoomTools
  localIdentity: string
  labels: RoomLabels
  chat: LiveChat
  locale: "ar" | "en"
  /** The panel is on screen (it stays mounted, hidden, while closed). */
  open: boolean
  onPollClosed?: (poll: Poll) => void
  onQuestion?: (id: string, text: string, from: string) => void
  /** Host: lower the hand and spotlight the student. */
  onGiveFloor?: (identity: string) => void
  /** The session, for the host's Quiz tab (launch, live results). */
  sessionId?: string
}

export function SidePanel(props: SidePanelProps) {
  const { tab, onTab, onClose, labels, isHost, channel, tools } = props
  const tabs: Array<{ id: PanelTab; label: string; badge?: number }> = []
  if (tools.chat)
    tabs.push({
      id: "chat",
      label: labels.chat,
      badge: props.chat.unread || undefined,
    })
  tabs.push({
    id: "questions",
    label: labels.questions,
    badge:
      channel.state.questions.filter((q) => !q.answered).length || undefined,
  })
  if (tools.polls) tabs.push({ id: "poll", label: labels.poll })
  if (isHost && props.sessionId)
    tabs.push({
      id: "quiz",
      label: labels.quiz,
      badge: channel.state.quiz ? 1 : undefined,
    })
  if (isHost && tools.hands)
    tabs.push({
      id: "hands",
      label: labels.handsRaised,
      badge: channel.hands.length || undefined,
    })

  return (
    // Glass rather than a solid slab, so the class stays faintly visible
    // behind the panel on a phone, where it covers the whole stage.
    <aside className="flex h-full w-80 max-w-full flex-col border-s border-white/10 bg-black/80 text-white backdrop-blur-[40px]">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              glassPill,
              // Visually still the compact pill — the extra reach is an
              // `::after` that stretches past the box (`position: absolute`
              // takes it out of flow, so the strip's own height is
              // untouched) rather than a taller button, which would have
              // grown the whole tab row past its glassPill density.
              "relative px-2.5 py-1 text-sm after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']",
              tab === t.id
                ? "bg-white/15 font-medium"
                : "text-white/70 hover:bg-white/10"
            )}
          >
            {t.label}
            {t.badge ? (
              <span className="ms-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-black">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          // Same out-of-flow `::after` reach as the tabs beside it — the
          // visible 28px glyph stays put, only the tap target grows to 44px.
          className="relative ms-auto h-7 w-7 text-white after:absolute after:-inset-2 after:content-[''] hover:bg-white/20 hover:text-white"
          onClick={onClose}
          aria-label={labels.close}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {tools.chat && (
          <ChatTab
            chat={props.chat}
            selfId={props.localIdentity}
            locale={props.locale}
            labels={labels}
            active={props.open && tab === "chat"}
          />
        )}
        {tab === "questions" && <QuestionsTab {...props} />}
        {tab === "poll" && <PollTab {...props} />}
        {tab === "quiz" && props.sessionId && (
          <QuizTab
            channel={channel}
            labels={labels}
            sessionId={props.sessionId}
          />
        )}
        {tab === "hands" && <HandsTab {...props} />}
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------

function QuestionsTab({
  channel,
  canAsk,
  isHost,
  labels,
  localIdentity,
}: SidePanelProps) {
  const { questions } = channel.state
  const ask = (raw: string) => {
    const t = raw.trim().slice(0, 500)
    if (!t) return
    void channel.send({
      t: "q",
      id: crypto.randomUUID(),
      text: t,
      at: Date.now(),
    })
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {questions.length === 0 && (
          <li className="text-white/60">{labels.noQuestions}</li>
        )}
        {questions.map((q) => (
          <li
            key={q.id}
            className={
              "rounded-lg bg-white/10 p-2 " + (q.answered ? "opacity-60" : "")
            }
          >
            <div className="text-[11px] text-white/60">
              {q.from === localIdentity ? labels.you : q.name}
            </div>
            <div>{q.text}</div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              {q.answered ? (
                <span className="flex items-center gap-1 text-emerald-300">
                  <Check className="h-3 w-3" aria-hidden />
                  {labels.answered}
                </span>
              ) : isHost ? (
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() =>
                    void channel.send({ t: "q.answered", id: q.id })
                  }
                >
                  {labels.markAnswered}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {canAsk && (
        <div className="dark">
          <InputBar
            textOnly
            maxLength={500}
            onSend={ask}
            placeholder={labels.questionPlaceholder}
            labels={{ send: labels.askQuestion }}
            className="bg-transparent backdrop-blur-none"
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function PollTab({
  channel,
  isHost,
  canAsk,
  labels,
  onPollClosed,
}: SidePanelProps) {
  const poll = channel.state.poll
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [voted, setVoted] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)

  const open = async () => {
    const opts = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || opts.length < 2) return
    await channel.send({
      t: "poll.open",
      id: crypto.randomUUID(),
      question: question.trim(),
      options: opts,
    })
    setQuestion("")
    setOptions(["", ""])
    setComposing(false)
  }
  const close = async () => {
    if (!poll) return
    await channel.send({ t: "poll.close", id: poll.id })
    onPollClosed?.({ ...poll, open: false })
  }

  if (!poll || (composing && isHost && !poll.open)) {
    if (!isHost)
      return <p className="p-3 text-sm text-white/60">{labels.noPoll}</p>
    return (
      <form
        className="space-y-2 p-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault()
          void open()
        }}
      >
        <div className="font-medium">{labels.newPoll}</div>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={labels.pollQuestion}
          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          maxLength={200}
        />
        {options.map((o, i) => (
          <Input
            key={i}
            value={o}
            onChange={(e) =>
              setOptions((s) => s.map((x, j) => (j === i ? e.target.value : x)))
            }
            placeholder={`${labels.pollOption} ${i + 1}`}
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
            maxLength={80}
          />
        ))}
        <div className="flex gap-2">
          {options.length < 8 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => setOptions((s) => [...s, ""])}
            >
              {labels.addOption}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="ms-auto"
            disabled={
              !question.trim() || options.filter((o) => o.trim()).length < 2
            }
          >
            {labels.openPoll}
          </Button>
        </div>
      </form>
    )
  }

  const total = poll.total
  return (
    <div className="space-y-3 p-3 text-sm">
      <div className="font-medium">{poll.question}</div>
      {!poll.open && (
        <div className="text-xs text-amber-300">{labels.pollClosed}</div>
      )}
      <ul className="space-y-2">
        {poll.options.map((opt, i) => {
          const count = poll.counts[i] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const showResults = isHost || !poll.open || voted === poll.id
          return (
            <li key={i}>
              {poll.open && !isHost && canAsk && voted !== poll.id ? (
                <button
                  type="button"
                  className="w-full rounded-md border border-white/20 px-3 py-2 text-start hover:bg-white/10"
                  onClick={() => {
                    setVoted(poll.id)
                    void channel.send(
                      { t: "poll.vote", id: poll.id, option: i },
                      channel.state.poll ? hostTargets(channel) : undefined
                    )
                  }}
                >
                  {opt}
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-md border border-white/20 px-3 py-2">
                  {showResults && (
                    <div
                      className="absolute inset-y-0 start-0 bg-sky-600/40"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  )}
                  <div className="relative flex justify-between">
                    <span>{opt}</span>
                    {showResults && (
                      <span className="text-white/70">
                        {count} · {pct}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-2 text-xs text-white/70">
        <span>
          {total} {labels.votes}
        </span>
        {voted === poll.id && !isHost && (
          <span className="text-emerald-300">{labels.voted}</span>
        )}
        {isHost && poll.open && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ms-auto h-7 border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white"
            onClick={() => void close()}
          >
            {labels.closePoll}
          </Button>
        )}
        {isHost && !poll.open && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ms-auto h-7 text-white hover:bg-white/20 hover:text-white"
            onClick={() => setComposing(true)}
          >
            {labels.newPoll}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Votes go to the host only — nobody else should see who chose what. */
function hostTargets(channel: ClassChannel): string[] | undefined {
  return channel.hostIdentity ? [channel.hostIdentity] : undefined
}

// ---------------------------------------------------------------------------

function HandsTab({ channel, labels, onGiveFloor }: SidePanelProps) {
  const participants = useParticipants()
  const byIdentity = new Map(participants.map((p) => [p.identity, p]))
  // "2 min" ticks over on its own.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const h = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(h)
  }, [])
  const spotlight = channel.state.spotlight
  const spotName = spotlight
    ? byIdentity.get(spotlight)?.name || spotlight
    : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <p className="flex-1 text-[15px] font-semibold">
          {labels.handsRaised}
          {channel.hands.length > 0 && (
            <span className="ms-2 rounded-full bg-amber-400 px-2 py-0.5 text-[12px] text-black tabular-nums">
              {channel.hands.length}
            </span>
          )}
        </p>
        {channel.hands.length > 1 && (
          <button
            type="button"
            className="min-h-9 rounded-full bg-white/15 px-3 text-sm font-medium hover:bg-white/25"
            onClick={() => void channel.clearAllHands()}
          >
            {labels.lowerAllHands}
          </button>
        )}
      </div>

      {spotName && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl bg-sky-500/20 px-3 py-2 text-sm ring-1 ring-sky-400/40">
          <span aria-hidden>🎙️</span>
          <span className="min-w-0 flex-1 truncate">{spotName}</span>
          <button
            type="button"
            className="min-h-9 shrink-0 rounded-full bg-white/15 px-3 font-medium hover:bg-white/25"
            onClick={() => {
              void channel.send({ t: "spotlight", identity: null })
              if (channel.state.grant === spotlight) void channel.setGrant(null)
            }}
          >
            {labels.endSpotlight}
          </button>
        </div>
      )}

      {channel.hands.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 pb-10 text-center text-white/55">
          <SfSymbol glyph={handRaisedFill} pt={34} className="text-white/30" />
          <p className="text-sm">{labels.noHands}</p>
        </div>
      ) : (
        <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
          {channel.hands.map((id, i) => {
            const name = byIdentity.get(id)?.name || id
            const at = channel.handsSince.get(id)
            const mins = at ? Math.floor((now - at) / 60_000) : 0
            return (
              <li
                key={id}
                className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-white/[0.07] py-1.5 ps-2 pe-1.5"
              >
                <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-sm font-bold text-black">
                  {initials(name)}
                  <span className="absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-amber-300 tabular-nums ring-2 ring-black">
                    {i + 1}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {name}
                  </span>
                  <span className="block text-[12px] text-white/55">
                    {mins < 1
                      ? labels.handJustNow
                      : labels.handMinutes.replace("{n}", String(mins))}
                  </span>
                </span>
                {onGiveFloor && (
                  <button
                    type="button"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity active:opacity-60"
                    aria-label={`${labels.giveFloor}: ${name}`}
                    title={labels.giveFloor}
                    onClick={() => onGiveFloor(id)}
                  >
                    <SfSymbol glyph={personWave2Fill} pt={20} />
                  </button>
                )}
                <button
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-opacity hover:bg-white/25 active:opacity-60"
                  aria-label={`${labels.clearHand}: ${name}`}
                  title={labels.clearHand}
                  onClick={() => void channel.clearHand(id)}
                >
                  <SfSymbol glyph={handRaisedSlashFill} pt={20} />
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? "?"
  const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (a + b).toUpperCase()
}
