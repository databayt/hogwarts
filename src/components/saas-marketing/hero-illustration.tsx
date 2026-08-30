// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

/**
 * The balqalam brand mark (the quill — بالقلم) as the hero's visual. It
 * replaced the Lottie illustration so the homepage leads with the system's
 * own identity rather than generic artwork. The glyph is solid black, so it
 * inverts in dark mode exactly as the header lockup does.
 */
export function HeroIllustration() {
  return (
    <div className="relative h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px] lg:h-[400px] lg:w-[400px] xl:h-[480px] xl:w-[480px]">
      <Image
        src="/feather.png"
        alt="balqalam"
        fill
        priority
        sizes="(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 768px) 320px, (min-width: 640px) 280px, 200px"
        className="scale-[0.7] object-contain dark:invert"
      />
    </div>
  )
}

export default HeroIllustration
