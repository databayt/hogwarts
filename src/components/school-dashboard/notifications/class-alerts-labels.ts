// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// A PLAIN module on purpose: server components (the room page, the join link,
// the dashboard banner) resolve these labels and hand them to the client
// prompt. A function exported from a "use client" file reaches a server
// component as a client-reference proxy and throws when called.

export interface ClassAlertsLabels {
  /** The offer, one sentence. */
  title: string
  enable: string
  later: string
  /** An iPhone outside the installed app: Push exists only on the Home Screen. */
  iosInstallFirst: string
  denied: string
  failed: string
  /** Shown once, right after alerts were turned on. */
  done: string
}

const DEFAULTS: ClassAlertsLabels = {
  title:
    "Turn on class alerts to get a notification on this device before each class.",
  enable: "Turn on",
  later: "Later",
  iosInstallFirst:
    "On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), then turn alerts on from the installed app.",
  denied:
    "Notifications are blocked for this site in your browser settings. Allow them to get class alerts.",
  failed: "Couldn't turn alerts on. Try again.",
  done: "Done. Class alerts will arrive on this device.",
}

/** `dictionary.liveClasses.alerts`, with English for any key a dictionary lacks. */
export function resolveClassAlertsLabels(
  raw?: Partial<ClassAlertsLabels> | null
): ClassAlertsLabels {
  return { ...DEFAULTS, ...(raw ?? {}) }
}
