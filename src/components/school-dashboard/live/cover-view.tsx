// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// «حصة بلا معلم» — the page a no-teacher alert opens (/live/<id>/cover). Server
// component: the class, who is waiting, and the two ways out. Only an admin or
// a supervisor of the class's stage ever gets here (see the route).
import { typography } from "@/lib/typography"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { CoverActions } from "./cover-actions"
import type { CoverView } from "./cover-core"
import { noShowWhat } from "./no-show"

export function CoverContent({
  view,
  lang,
  dictionary,
}: {
  view: CoverView
  lang: string
  dictionary: Dictionary
}) {
  const t = dictionary.liveClasses.cover
  const locale = lang === "ar" ? "ar" : "en-US"
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: view.timeZone,
  }).format(view.scheduledStart)
  const end = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: view.timeZone,
  }).format(view.scheduledEnd)
  const what = noShowWhat({
    subject: view.subjectName,
    section: view.sectionName,
    title: view.title,
  })

  const note =
    view.state === "taken"
      ? t.taken
      : view.state === "mine"
        ? t.mine
        : view.state === "over"
          ? t.over
          : null

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-6">
      <div className="space-y-1">
        <h1 className={typography.h3}>{t.title}</h1>
        <p className="text-muted-foreground text-sm">
          {t.description.replace("{time}", time)}
        </p>
      </div>

      <dl className="divide-y rounded-xl border">
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-muted-foreground text-sm">{t.classLabel}</dt>
          <dd className="font-semibold">
            <bdi dir="auto">{what}</bdi>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-muted-foreground text-sm">{t.timeLabel}</dt>
          <dd className="font-semibold">
            <bdi>
              {time} – {end}
            </bdi>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-muted-foreground text-sm">{t.waitingLabel}</dt>
          <dd className="font-semibold">
            {view.waiting > 0
              ? t.waiting.replace("{n}", String(view.waiting))
              : t.waitingNone}
          </dd>
        </div>
      </dl>

      {note ? (
        <p className="bg-muted rounded-lg p-3 text-sm" role="status">
          {note}
        </p>
      ) : null}

      <CoverActions
        sessionId={view.id}
        lang={lang}
        state={view.state}
        makeupLabels={dictionary.liveClasses.makeup}
        description={`${what} — ${time}`}
        labels={{
          enter: t.enter,
          entering: t.entering,
          makeup: t.makeup,
          error: t.error,
          taken: t.taken,
        }}
      />
    </div>
  )
}
