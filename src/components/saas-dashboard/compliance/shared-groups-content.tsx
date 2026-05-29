// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { ComplianceProvider } from "@prisma/client"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SharedGroupsTable } from "./shared-groups-table"

interface SharedGroupsContentProps {
  locale: Locale
  dict: NonNullable<Dictionary["compliance"]>
}

export async function SharedGroupsContent({
  locale,
  dict,
}: SharedGroupsContentProps) {
  const groups = await db.sharedComplianceCredentialGroup.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      provider: true,
      keyVersion: true,
      circuitBreakerState: true,
      recentFailures: true,
      circuitOpenedAt: true,
      rotatedAt: true,
      lastUsedAt: true,
      createdAt: true,
      _count: { select: { schoolConfigs: true } },
    },
  })

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          Shared Compliance Credential Groups
        </h1>
        <p className="text-muted-foreground">
          DEVELOPER-only — credentials shared across multiple schools (e.g.,
          Aldar Education Group → 29 schools). One bad CSV here can cascade —
          circuit breaker opens after 3 failures within 1 hour.
        </p>
      </header>

      <SharedGroupsTable
        dict={dict}
        groups={groups.map((g) => ({
          ...g,
          schoolCount: g._count.schoolConfigs,
        }))}
      />
    </div>
  )
}
