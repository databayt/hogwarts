// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ComplianceProvider, ConnectorMode } from "@prisma/client"

import { adekDryRunConnector } from "./providers/adek/dry-run"
import { adekOfficialConnector } from "./providers/adek/official"
import { adekPiggybackConnector } from "./providers/adek/piggyback"
import { adekRpaConnector } from "./providers/adek/rpa"
import {
  connectorKey,
  type ComplianceConnector,
  type ConnectorKey,
} from "./types"

/**
 * Connector registry — populated at module load. Mirrors src/lib/payment/provider.ts.
 *
 * Future regulators: add a new directory under providers/<authority>/, instantiate
 * their connector implementations here, no changes to callers.
 */
const REGISTRY = new Map<ConnectorKey, ComplianceConnector>()

function register(
  provider: ComplianceProvider,
  mode: ConnectorMode,
  impl: ComplianceConnector
) {
  REGISTRY.set(connectorKey(provider, mode), impl)
}

// ADEK eSIS
register(
  ComplianceProvider.ADEK_ESIS,
  ConnectorMode.DRY_RUN,
  adekDryRunConnector
)
register(
  ComplianceProvider.ADEK_ESIS,
  ConnectorMode.PIGGYBACK,
  adekPiggybackConnector
)
register(
  ComplianceProvider.ADEK_ESIS,
  ConnectorMode.OFFICIAL_API,
  adekOfficialConnector
)
register(ComplianceProvider.ADEK_ESIS, ConnectorMode.RPA, adekRpaConnector)

export function getConnector(
  provider: ComplianceProvider,
  mode: ConnectorMode
): ComplianceConnector | null {
  return REGISTRY.get(connectorKey(provider, mode)) ?? null
}

export function listConnectorsForProvider(
  provider: ComplianceProvider
): ComplianceConnector[] {
  const out: ComplianceConnector[] = []
  for (const [key, impl] of REGISTRY.entries()) {
    if (key.startsWith(`${provider}:`)) out.push(impl)
  }
  return out
}
