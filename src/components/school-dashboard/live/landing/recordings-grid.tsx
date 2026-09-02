// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition, no client hooks or handlers.

import { Video } from "lucide-react"

import { LandingSessionCard } from "./session-card"
import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface RecordingsGridProps extends LandingSectionProps {
  sessions: LandingSession[]
  viewer: LandingViewer
}

/**
 * Two recordings, ranked for the reader in front of them.
 *
 * The shelf above says what you missed; this says what you can actually WATCH
 * about it, and it is two wide cards rather than twelve small ones because
 * that is the whole point of the section — a shelf of a dozen things to watch
 * is another backlog, and a backlog is what the reader came here with.
 *
 * The ranking is the interesting part and it happens on the server
 * (`getLiveLandingRecordings`): a recording of a class this reader MISSED
 * outranks one of a class they sat through, and recency breaks the tie. Both
 * halves are per-reader — the miss is read from that reader's own presence
 * rows, or from their children's if they are a guardian — so two students in
 * the same section are shown different pairs. An admin, who joins nothing,
 * misses everything and therefore just gets the two most recent.
 *
 * Cards, not rows, and the same card the catch-up shelf draws: a recording IS
 * one of those classes, and giving it a second shape would be claiming it is a
 * different kind of thing.
 *
 * The section only ever renders when the school actually has recordings, which
 * is the exception rather than the rule: every recording surface in this block
 * is gated on `isRecordingConfigured()`, and a school that never provisioned a
 * bucket has none at all. That is why the page passes rows rather than a flag
 * — the empty case must vanish, not render a heading over nothing.
 */
export function LiveRecordingsGrid({
  dictionary,
  lang,
  sessions,
  viewer,
}: RecordingsGridProps) {
  return (
    <section className="mb-16 flex w-full flex-col gap-y-4 border-b pb-16">
      {/* Heading by icon, as the catch-up shelf above it is — the two sections
          sit together and a title on only one of them would read as a mistake.
          The accessible name reuses `actions.recordings` rather than adding a
          key that says the same word: this block's rule is that a duplicated
          translation drifts. */}
      <h2 className="sr-only mb-0">
        {dictionary?.landing?.actions?.recordings}
      </h2>
      <Video className="size-6 shrink-0" aria-hidden="true" />

      {/* Capped, not full-bleed. Two cards across a 1168px column are 570px
          wide with 320px of artwork each, which made this section the largest
          thing on a page whose subject is the class running right now. At a
          4xl measure they are ~440px: still a clear step up from the shelf's
          256px cards above, without out-shouting the live one. */}
      <ul className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <LandingSessionCard
              session={session}
              dictionary={dictionary}
              lang={lang}
              viewer={viewer}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
