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

      <Card>
        <CardHeader>
          <CardTitle>
            {t?.usageTitle ?? "This month's live-class usage vs. tier"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">
                {t?.usageWebrtc ?? "WebRTC participant-minutes"}
              </p>
              <p className="text-2xl font-bold">
                {data.usage.totals.participantMinutes.toLocaleString()}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / {data.usage.tier.webrtcMinutes.toLocaleString()} (
                  {data.usage.percentOfTier.webrtc}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t?.usageRecording ?? "Recording minutes"}
              </p>
              <p className="text-2xl font-bold">
                {data.usage.totals.recordingMinutes.toLocaleString()}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / {data.usage.tier.recordingMinutes.toLocaleString()} (
                  {data.usage.percentOfTier.recording}%)
                </span>
              </p>
            </div>
          </div>
          {data.usage.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t?.noUsage ?? "No live-class activity this month."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-start">
                    <th className="py-2 pe-4 text-start font-medium">
                      {t?.usageSchool ?? "School"}
                    </th>
                    <th className="py-2 pe-4 text-end font-medium">
                      {t?.usageWebrtc ?? "WebRTC participant-minutes"}
                    </th>
                    <th className="py-2 pe-4 text-end font-medium">
                      {t?.usageRecording ?? "Recording minutes"}
                    </th>
                    <th className="py-2 pe-4 text-end font-medium">
                      {t?.usageSessions ?? "Sessions"}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t?.usageOpenSpans ?? "In progress"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.usage.rows.map((row) => (
                    <tr key={row.schoolId} className="border-b last:border-0">
                      <td className="py-2 pe-4">
                        <span className="block truncate">{row.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {row.subdomain}
                        </span>
                      </td>
                      <td className="py-2 pe-4 text-end font-medium">
                        {row.participantMinutes.toLocaleString()}
                      </td>
                      <td className="py-2 pe-4 text-end font-medium">
                        {row.recordingMinutes.toLocaleString()}
                      </td>
                      <td className="py-2 pe-4 text-end font-medium">
                        {row.sessions.toLocaleString()}
                      </td>
                      <td className="py-2 text-end font-medium">
                        {row.openSpans.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            {t?.usageHonesty ??
              "Minutes are counted when a participant leaves, not while they are connected — a class in progress is undercounted until it ends. “In progress” shows how many currently-open spans are missing from the total above."}
          </p>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        {t?.sfuNote ??
          "Egress queue depth and per-room bitrate require the LiveKit SFU and appear once it is provisioned."}
      </p>
    </div>
  )
}
