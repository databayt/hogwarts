// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { formatBytes, getConferenceObservability } from "./queries"

export async function ConferenceObservabilityContent({
  dictionary,
  lang,
}: {
  dictionary: Dictionary
  lang: Locale
}) {
  const data = await getConferenceObservability()
  // operator dict is loaded by getDictionary; the conference block is optional.
  const t = (
    dictionary?.operator?.observability as
      | { conference?: Record<string, string> }
      | undefined
  )?.conference

  const metrics = [
    { label: t?.liveRooms ?? "Live rooms", value: String(data.liveCount) },
    {
      label: t?.scheduledToday ?? "Scheduled today",
      value: String(data.scheduledToday),
    },
    {
      label: t?.recordingsReady ?? "Recordings ready",
      value: String(data.recordingsReady),
    },
    {
      label: t?.storage ?? "Recording storage",
      value: formatBytes(data.storageBytes),
    },
    {
      label: t?.tcpFallback ?? "TURN/TCP fallback",
      value: `${(data.tcpFallbackRate * 100).toFixed(1)}%`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {m.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t?.perSchool ?? "Live rooms by school"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.liveBySchool.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t?.noLive ?? "No live rooms right now."}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.liveBySchool.map((s) => (
                  <li
                    key={s.schoolId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="font-medium">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t?.recentEvents ?? "Recent events"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t?.noEvents ?? "No recent events."}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-mono text-xs">{e.eventType}</span>
                    <time
                      className="text-muted-foreground text-xs"
                      dateTime={e.occurredAt.toISOString()}
                    >
                      {e.occurredAt.toLocaleString(lang === "ar" ? "ar" : "en")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        {t?.sfuNote ??
          "Egress queue depth and per-room bitrate require the LiveKit SFU and appear once it is provisioned."}
      </p>
    </div>
  )
}
