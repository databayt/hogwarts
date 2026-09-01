// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks or handlers, so
// nothing here reaches the client bundle.

import { ConferenceEverythingSection } from "./everything-section"
import { ConferenceFeaturesSection } from "./features-section"
import { ConferenceHero } from "./hero"
import { ConferenceHowToSection } from "./how-to-section"
import { ConferenceNowSection } from "./now-section"
import type { LandingSectionProps, LandingSession } from "./types"
import { ConferenceWelcomeSection } from "./welcome-section"

interface Props extends LandingSectionProps {
  live: LandingSession[]
  upcoming: LandingSession[]
  canSchedule: boolean
  canConfigure: boolean
}

/**
 * The /live landing page, composed the way /lumos is: a hero, the value
 * cards, then the long-form bands. The one departure is the live/coming-up
 * strip directly under the cards — this block is opened every school day, so
 * the landing has to answer "what's on right now" before it sells anything.
 */
export function ConferenceLandingContent({
  dictionary,
  lang,
  live,
  upcoming,
  canSchedule,
  canConfigure,
}: Props) {
  return (
    <>
      <ConferenceHero
        dictionary={dictionary}
        lang={lang}
        canSchedule={canSchedule}
      />

      <ConferenceFeaturesSection dictionary={dictionary} lang={lang} />

      <ConferenceNowSection
        dictionary={dictionary}
        lang={lang}
        live={live}
        upcoming={upcoming}
      />

      <ConferenceEverythingSection dictionary={dictionary} lang={lang} />

      <ConferenceHowToSection dictionary={dictionary} lang={lang} />

      <ConferenceWelcomeSection
        dictionary={dictionary}
        lang={lang}
        canConfigure={canConfigure}
      />
    </>
  )
}
