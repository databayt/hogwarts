// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Provider-adapter registry. Resolve a link-based meeting provider by id.

import { externalAdapter } from "./external"
import { googleMeetAdapter } from "./google-meet"
import { teamsAdapter } from "./teams"
import type { LiveProviderAdapter, ProviderId } from "./types"
import { zoomAdapter } from "./zoom"

const ADAPTERS: Record<ProviderId, LiveProviderAdapter> = {
  external: externalAdapter,
  google_meet: googleMeetAdapter,
  zoom: zoomAdapter,
  teams: teamsAdapter,
}

export function getProviderAdapter(id: ProviderId): LiveProviderAdapter {
  return ADAPTERS[id]
}

export function listProviderAdapters(): LiveProviderAdapter[] {
  return Object.values(ADAPTERS)
}

/** Provider ids whose credentials are present right now. */
export function configuredProviderIds(): ProviderId[] {
  return listProviderAdapters()
    .filter((a) => a.isConfigured())
    .map((a) => a.id)
}

export * from "./types"
