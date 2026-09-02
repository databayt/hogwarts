// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition, no client hooks or handlers.

import { History } from "lucide-react"

import { LandingSessionCard } from "./session-card"
import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface CatchUpShelfProps extends LandingSectionProps {
  sessions: LandingSession[]
  viewer: LandingViewer
}

/**
 * Catch up — the classes that already ran and that this reader was not in.
 *
 * It replaces a "past classes" shelf that listed the last two ended sessions
 * beside a grid of subject tiles. Two problems with that, and this section is
 * the answer to both. It showed the same rows to a student who had sat through
 * every one of them as to one who had missed the week, because nothing in it
 * consulted presence; and the subject tiles answered "what has been taught
 * live", which is a question an admin might ask and a student never does.
 *
 * So the rows are now MISSED classes — `getLiveLandingCatchUp` excludes any
 * session the reader (or, for a guardian, their children) actually joined —
 * and they are one horizontally scrolling row of cards rather than a
 * two-column block. A shelf you scroll is the right shape for a backlog: it
 * holds twelve without pushing the rest of the page down, and it says by its
 * form that there is more to the side.
 *
 * The scroller is the house one, the same markup lumos uses for its course
 * shelves and Continue Watching: `no-scrollbar` with a negative margin and
 * matching padding, so a card's hover ring is not clipped by `overflow-x-auto`
 * while the first card still lines up with the page's edge. Nothing here is
 * direction-aware — `overflow-x-auto` follows the document's `dir`, so an
 * Arabic reader scrolls from the right with no transform of ours.
 */
export function LiveCatchUpShelf({
  dictionary,
  lang,
  sessions,
  viewer,
}: CatchUpShelfProps) {
  const c = dictionary?.landing?.catchUp

  return (
    <section className="mb-16 flex w-full flex-col gap-y-4 border-b pb-16">
      {/* The heading is an ICON and nothing else. The cards under it already
          read as classes that have been and gone — each one carries a past
          date — so a printed "Catch up" over them was labelling what the
          reader could see, and a "More" beside it pointed at the sessions
          table the banner links to twice already.

          The words survive for anyone who cannot see the icon: the section is
          named by a visually-hidden heading, so a screen reader still hears
          which shelf this is instead of an unlabelled list of links. */}
      <h2 className="sr-only mb-0">{c?.title}</h2>
      <History className="size-6 shrink-0" aria-hidden="true" />

      <ul className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
        {sessions.map((session) => (
          <li key={session.id} className="w-56 shrink-0 sm:w-64">
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
