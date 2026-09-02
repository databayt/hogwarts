// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks or handlers, so
// nothing here reaches the client bundle except the one motion wrapper the
// get-started band brings with it.

import { LiveCatchUpShelf } from "./catch-up-shelf"
import { LiveGetStartedBand } from "./get-started-band"
import { LiveNowStrip } from "./now-strip"
import { LiveReadinessBand } from "./readiness-band"
import { LiveRecordingsGrid } from "./recordings-grid"
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
  catchUp: LandingSession[]
  recordings: LandingSession[]
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
  catchUp,
  recordings,
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

      {/* Gated on the ROWS, not on `policy.isOnline`: a school that has since
          gone back to the classroom still has classes it taught online, and
          hiding them would lose the only history the page carries. An empty
          shelf here is also a real answer — a student who missed nothing has
          nothing to catch up on, and should not be shown a heading saying so. */}
      {catchUp.length > 0 ? (
        <LiveCatchUpShelf
          dictionary={dictionary}
          lang={lang}
          sessions={catchUp}
          viewer={viewer}
        />
      ) : null}

      {/* Under the shelf, and gated on the ROWS for the same reason: a school
          with no recording bucket has no recordings at all, and most do not. */}
      {recordings.length > 0 ? (
        <LiveRecordingsGrid
          dictionary={dictionary}
          lang={lang}
          sessions={recordings}
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
