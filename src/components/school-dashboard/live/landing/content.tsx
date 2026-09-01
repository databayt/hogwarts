// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks or handlers, so
// nothing here reaches the client bundle except the one motion wrapper the
// get-started band brings with it.

import { LiveGetStartedBand } from "./get-started-band"
import { LiveNowStrip } from "./now-strip"
import { LiveReadinessBand } from "./readiness-band"
import { LiveRoleGuide } from "./role-guide"
import { LiveStatusHero } from "./status-hero"
import type {
  LandingPolicy,
  LandingReadiness,
  LandingSectionProps,
  LandingSession,
  LandingViewer,
  LiveSettingsDictionary,
} from "./types"

interface Props extends LandingSectionProps {
  settings: LiveSettingsDictionary
  viewer: LandingViewer
  policy: LandingPolicy
  readiness: LandingReadiness | null
  live: LandingSession[]
  upcoming: LandingSession[]
}

/**
 * The /live landing page.
 *
 * One page in two states. When the school teaches online it is a TOOL: what is
 * live, then what this role can do, and — for an admin — whether the plumbing
 * behind it is actually ready. When the school does not yet teach online there
 * is nothing to be a tool about, so for an admin it becomes a SETUP GUIDE, and
 * for everyone else it stays short and honest rather than advertising a
 * feature they cannot switch on.
 *
 * Every section is gated by role, by that state, or by both. The previous
 * version gated only two buttons, which is how a student ended up reading
 * "turn on online teaching, from settings" on every visit.
 */
export function LiveLandingContent({
  dictionary,
  lang,
  settings,
  viewer,
  policy,
  readiness,
  live,
  upcoming,
}: Props) {
  return (
    <>
      <LiveStatusHero
        dictionary={dictionary}
        lang={lang}
        viewer={viewer}
        policy={policy}
      />

      {policy.isOnline ? (
        <LiveNowStrip
          dictionary={dictionary}
          lang={lang}
          live={live}
          upcoming={upcoming}
          viewer={viewer}
        />
      ) : null}

      {viewer.canConfigure && readiness ? (
        <LiveReadinessBand
          dictionary={dictionary}
          lang={lang}
          settings={settings}
          policy={policy}
          readiness={readiness}
        />
      ) : null}

      <LiveRoleGuide dictionary={dictionary} lang={lang} viewer={viewer} />

      {/* The pitch and the three setup steps: admins only, and only while
          there is still something to set up. */}
      {!policy.isOnline && viewer.canConfigure ? (
        <LiveGetStartedBand dictionary={dictionary} lang={lang} />
      ) : null}
    </>
  )
}
