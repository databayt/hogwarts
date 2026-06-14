// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getLiveKitConfig,
  getLiveKitReadiness,
} from "@/components/school-dashboard/conference/livekit/client"
import { issueAccessToken } from "@/components/school-dashboard/conference/livekit/token"
import { NetworkTestClient } from "@/components/school-dashboard/conference/network-test"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["DEVELOPER", "ADMIN"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  const userId = session?.user?.id ?? ""
  if (!ALLOWED_ROLES.includes(role) || !userId) {
    redirect(`/${lang}/dashboard`)
  }
  const dictionary = await getDictionary(lang)
  const t = dictionary?.liveClasses

  const readiness = getLiveKitReadiness()
  if (!readiness.configured) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-6">
        <p className="text-muted-foreground text-sm">
          {t?.errors?.providerUnavailable ??
            "LiveKit SFU is not yet provisioned for this deployment."}
        </p>
        <div className="text-sm">
          <p className="font-medium">
            {t?.networkTest?.missingEnv ?? "Missing configuration:"}
          </p>
          <ul className="text-muted-foreground mt-1 list-inside list-disc font-mono text-xs">
            {readiness.missing.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            {t?.networkTest?.seeRunbook ??
              "See conference/RUNBOOK.md for provisioning steps."}
          </p>
        </div>
      </div>
    )
  }
  const { wsUrl } = getLiveKitConfig()
  // Use the real tenant + a PARTICIPANT-grant token (publish+subscribe is enough
  // to measure connectivity — no roomAdmin/roomCreate/roomRecord needed). The
  // room name deliberately avoids the `sch-{schoolId}-lc-{sessionId}` format so
  // parseRoomName() won't treat a stray webhook for it as a real session.
  const { schoolId } = await getTenantContext()
  const diagSchoolId = schoolId ?? "diagnostic"
  const token = await issueAccessToken({
    schoolId: diagSchoolId,
    sessionId: "diagnostic",
    userId,
    role: "PARTICIPANT",
    roomName: `diag-${diagSchoolId}-${userId}`,
    ttlSec: 120,
  })
  return (
    <NetworkTestClient
      wsUrl={wsUrl}
      token={token}
      labels={{
        heading: t?.networkTest?.title ?? "Network test",
        description:
          t?.networkTest?.description ??
          "Confirms a LiveKit session can be established from this network.",
        run: t?.networkTest?.idle ?? "Run test",
        running: t?.networkTest?.running ?? "Running…",
        connected: t?.networkTest?.connected ?? "Connected",
        setupTime: t?.networkTest?.setupTime ?? "Setup time",
        quality: t?.networkTest?.quality ?? "Connection quality",
        path: t?.networkTest?.path ?? "Inferred path",
        error: t?.networkTest?.failed ?? "Error",
        yes: t?.networkTest?.yes ?? "yes",
        no: t?.networkTest?.no ?? "no",
        qualityValues: {
          excellent: t?.networkTest?.qualityExcellent ?? "Excellent",
          good: t?.networkTest?.qualityGood ?? "Good",
          poor: t?.networkTest?.qualityPoor ?? "Poor",
          lost: t?.networkTest?.qualityLost ?? "Lost",
          unknown: t?.networkTest?.qualityUnknown ?? "Unknown",
        },
        pathUnknown: t?.networkTest?.pathUnknown ?? "Unknown",
        pathNotConnected: t?.networkTest?.pathNotConnected ?? "Not connected",
      }}
    />
  )
}
