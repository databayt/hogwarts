// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SidebarProvider } from "@/components/ui/sidebar"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { SchoolProvider } from "@/components/school-dashboard/context/school-context"
import type { School } from "@/components/school-marketing/types"
import PlatformHeader from "@/components/template/platform-header/content"

interface RoomPageHeaderProps {
  school: School
  lang: string
  role?: string
  dictionary: Dictionary
}

/**
 * The dashboard header, above the room's title card — on a PHONE only.
 *
 * The `(live-room)` group is deliberately bare (the call owns the screen), so
 * the header brings its own providers rather than moving the route under
 * `(school-dashboard)`. It mirrors the lumos lesson: header, 24px of ground,
 * then the full-bleed artwork, with the page opening scrolled past the first
 * two (`useOpenOnHero`).
 *
 * - `md:hidden`: the wide card owns its screen as before, and the header's
 *   desktop half would offer a sidebar trigger for a sidebar this layout never
 *   renders.
 * - `px-2`: the header carries `-mx-2` to cancel the dashboard's own `px-2`;
 *   this layout has already cancelled the root gutter, so without it the bar
 *   runs 8px off each side and the page scrolls sideways.
 * - `static`: the header is `sticky` everywhere else. Here, as on the lesson
 *   (`data-immersive`), it must scroll away with the page instead of pinning
 *   itself over the artwork.
 * - `SidebarProvider` renders a `flex min-h-svh` wrapper; `contents` removes
 *   it from layout so it contributes a context and nothing else.
 */
export function RoomPageHeader({
  school,
  lang,
  role,
  dictionary,
}: RoomPageHeaderProps) {
  return (
    <div className="bg-background px-2 pb-6 md:hidden [&_[data-slot=platform-header]]:static">
      <DictionaryProvider dictionary={dictionary}>
        <SchoolProvider school={school}>
          <SidebarProvider className="contents min-h-0">
            <PlatformHeader school={school} lang={lang} serverRole={role} />
          </SidebarProvider>
        </SchoolProvider>
      </DictionaryProvider>
    </div>
  )
}
