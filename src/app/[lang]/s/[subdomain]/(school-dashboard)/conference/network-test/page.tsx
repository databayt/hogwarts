// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getLiveKitConfig, isLiveKitConfigured } from "@/components/school-dashboard/conference/livekit/client"
import { issueAccessToken } from "@/components/school-dashboard/conference/livekit/token"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
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

  if (!isLiveKitConfigured()) {
    return (
      <div className="text-muted-foreground mx-auto max-w-xl p-6 text-sm">
        {t?.errors?.providerUnavailable ??
          "Video service is unavailable. Try again shortly."}
      </div>
    )
  }
  const { wsUrl } = getLiveKitConfig()
  const token = await issueAccessToken({
    schoolId: "diagnostic",
    sessionId: "diagnostic",
    userId,
    role: "HOST",
    roomName: `sch-diagnostic-lc-${userId}`,
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
      }}
    />
  )
}
