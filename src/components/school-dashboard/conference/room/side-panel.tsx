"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useChat, useParticipants } from "@livekit/components-react"
import { Check, Hand, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { RoomTools } from "@/components/school-dashboard/conference/types"

import type { Poll } from "./class-channel"
import type { RoomLabels } from "./labels"
import type { ClassChannel } from "./use-class-channel"

export type PanelTab = "chat" | "questions" | "poll" | "hands"

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
  onPollClosed?: (poll: Poll) => void
  onQuestion?: (id: string, text: string, from: string) => void
}

export function SidePanel(props: SidePanelProps) {
  const { tab, onTab, onClose, labels, isHost, channel, tools } = props
  const tabs: Array<{ id: PanelTab; label: string; badge?: number }> = []
  if (tools.chat) tabs.push({ id: "chat", label: labels.chat })
  tabs.push({
    id: "questions",
    label: labels.questions,
    badge:
      channel.state.questions.filter((q) => !q.answered).length || undefined,
  })
  if (tools.polls) tabs.push({ id: "poll", label: labels.poll })
  if (isHost && tools.hands)
    tabs.push({
      id: "hands",
      label: labels.handsRaised,
      badge: channel.hands.length || undefined,
    })

  return (
    <aside className="flex h-full w-80 max-w-full flex-col border-s border-white/10 bg-neutral-950 text-white">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={tab === t.id}
            className={
              "relative rounded-md px-2.5 py-1 text-sm " +
              (tab === t.id
                ? "bg-white/15 font-medium"
                : "text-white/70 hover:bg-white/10")
            }
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
          className="ms-auto h-7 w-7 text-white hover:bg-white/20 hover:text-white"
          onClick={onClose}
          aria-label={labels.more}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "chat" && (
          <ChatTab labels={labels} localIdentity={props.localIdentity} />
        )}
        {tab === "questions" && <QuestionsTab {...props} />}
        {tab === "poll" && <PollTab {...props} />}
        {tab === "hands" && <HandsTab {...props} />}
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------

function ChatTab({
  labels,
  localIdentity,
}: {
  labels: RoomLabels
  localIdentity: string
}) {
  const { chatMessages, send, isSending } = useChat()
  const [text, setText] = useState("")
  const endRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [chatMessages.length])

  const submit = async () => {
    const t = text.trim()
    if (!t || isSending) return
    setText("")
    await send(t)
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {chatMessages.length === 0 && (
          <li className="text-white/60">{labels.noMessages}</li>
        )}
        {chatMessages.map((m) => {
          const mine = m.from?.identity === localIdentity
          return (
            <li key={m.id} className={mine ? "text-end" : ""}>
              <div className="text-[11px] text-white/60">
                {mine ? labels.you : m.from?.name || m.from?.identity || "?"}
              </div>
              <div
                className={
                  "inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 " +
                  (mine ? "bg-sky-600" : "bg-white/10")
                }
              >
                {m.message}
              </div>
            </li>
          )
        })}
        <div ref={endRef} />
      </ul>
      <form
        className="flex gap-2 border-t border-white/10 p-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.messagePlaceholder}
          className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          maxLength={1000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || isSending}
          aria-label={labels.send}
        >
          <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </Button>
      </form>
    </div>
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
  const [text, setText] = useState("")
  const { questions } = channel.state
  const ask = async () => {
    const t = text.trim()
    if (!t) return
    const id = crypto.randomUUID()
    setText("")
    await channel.send({ t: "q", id, text: t, at: Date.now() })
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
        <form
          className="flex gap-2 border-t border-white/10 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            void ask()
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={labels.questionPlaceholder}
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim()}
            aria-label={labels.askQuestion}
          >
            <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </Button>
        </form>
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

function HandsTab({ channel, labels }: SidePanelProps) {
  const participants = useParticipants()
  const byIdentity = new Map(participants.map((p) => [p.identity, p]))
  if (channel.hands.length === 0)
    return <p className="p-3 text-sm text-white/60">{labels.noHands}</p>
  return (
    <ul className="space-y-1 p-3 text-sm">
      {channel.hands.map((id, i) => (
        <li
          key={id}
          className="flex items-center gap-2 rounded-md bg-white/10 px-2 py-1.5"
        >
          <Hand className="h-4 w-4 text-amber-300" aria-hidden />
          <span className="text-white/60">{i + 1}.</span>
          <span className="truncate">{byIdentity.get(id)?.name || id}</span>
          <button
            type="button"
            className="ms-auto text-xs underline underline-offset-2"
            onClick={() => void channel.clearHand(id)}
          >
            {labels.clearHand}
          </button>
        </li>
      ))}
    </ul>
  )
}
