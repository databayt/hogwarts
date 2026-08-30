"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, RefreshCw } from "lucide-react"

import type { OutboxItem } from "@/lib/offline/db"
import { useOnlineStatus, useOutbox } from "@/lib/offline/hooks"
import {
  discardOutboxItem,
  listOutbox,
  retryOutboxItem,
  subscribeOutbox,
} from "@/lib/offline/outbox"
import { Button } from "@/components/ui/button"

export interface OfflineLabels {
  [key: string]: string | undefined
}

type Labels = (
  k: string,
  fallback: string,
  vars?: Record<string, string | number>
) => string

function makeT(labels?: OfflineLabels): Labels {
  return (k, fallback, vars) => {
    let s = labels?.[k] ?? fallback
    for (const [name, v] of Object.entries(vars ?? {}))
      s = s.replace(`{${name}}`, String(v))
    return s
  }
}

/**
 * What is waiting to sync and what the server refused, with retry/discard.
 * Lives on `/offline`. Nothing here holds school content: the outbox carries
 * only the student's own work (positions, completions, answers, hand-ins).
 */
export function OutboxView({
  labels,
  lang,
}: {
  labels?: OfflineLabels
  lang: string
}) {
  const t = useMemo(() => makeT(labels), [labels])
  const online = useOnlineStatus()
  const { pending, parked, drain, draining } = useOutbox()
  const [items, setItems] = useState<OutboxItem[]>([])

  useEffect(() => {
    const load = () => void listOutbox().then(setItems)
    load()
    return subscribeOutbox(load)
  }, [])

  if (pending === 0 && parked === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        <Check className="me-1 inline h-4 w-4" aria-hidden />
        {t("synced", "Everything is synced")}
      </p>
    )
  }

  const kindLabel = (k: OutboxItem["kind"]) =>
    k === "progress"
      ? t("kindProgress", "Playback position")
      : k === "complete"
        ? t("kindComplete", "Lesson completion")
        : k === "quiz"
          ? t("kindQuiz", "Quiz answers")
          : t("kindAssignment", "Assignment")

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2>
          {pending > 0
            ? t("pendingSync", "{count} items waiting to sync", {
                count: pending,
              })
            : t("attention", "{count} items need attention", { count: parked })}
        </h2>
        {online && pending > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="ms-auto"
            disabled={draining}
            onClick={() => void drain()}
          >
            {draining ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            {draining ? t("syncing", "Syncing…") : t("syncNow", "Sync now")}
          </Button>
        )}
      </div>
      <ul className="divide-y rounded-md border">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
          >
            <span className="font-medium">{kindLabel(i.kind)}</span>
            <span className="text-muted-foreground">
              {new Date(i.createdAt).toLocaleString(lang)}
            </span>
            {i.state === "parked" ? (
              <>
                <span className="text-destructive">
                  {t("parkedItem", "Couldn't sync: {code}", {
                    code: i.code ?? "?",
                  })}
                </span>
                <span className="ms-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void retryOutboxItem(i.id)}
                  >
                    {t("retry", "Retry")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void discardOutboxItem(i.id)}
                  >
                    {t("discard", "Discard")}
                  </Button>
                </span>
              </>
            ) : (
              <span className="text-muted-foreground ms-auto text-xs">
                {i.attempts > 0 ? `↻ ${i.attempts}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
