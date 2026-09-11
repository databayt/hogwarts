"use client"

import React from "react"

/**
 * بالقلم written the way font.thmanyah.com writes ثمانية — the full-bleed
 * "8" panel of the homepage's story section.
 *
 * The reference is a Lottie (`public/lottie/lottie-stats-letter.json`) whose
 * word is 80 baked outline layers with no text in it, so it cannot be
 * retargeted to another word. This rebuilds what it actually does, read off
 * its rendered frames rather than its layer names:
 *
 *   frame 0     the whole word — dots included — stands as a hairline
 *               OUTLINE. Nothing is filled and there is no other decoration:
 *               the "diamonds" scattered around the reference are its own
 *               unfilled dots, not ornament.
 *   0 -> ~208   the outline FILLS right to left in one continuous pass.
 *   ~208+       the filled word holds, then the loop restarts.
 *
 * Arabic joins into connected groups, and بالقلم is two of them. The ink
 * flows through a group like a pipe — one continuous run, no break between
 * its letters — and the three dots go on at the end, the way a hand adds
 * them:
 *
 *   با     the ب bowl flows left along the baseline, then up the alef
 *   لقلم   opens at the TOP of the initial ل and flows down into the
 *          baseline, then left through the ق, on through the medial ل —
 *          whose stem RISES as the front passes — and into the م loop and
 *          its tail
 *   ...    then ب's dot, then ق's two
 *
 * Each step is a half-plane front clipped to its own glyph, travelling in
 * that letter's direction. Two things it is not:
 *   - not a pen along a hand-drawn centreline. A constant-width pen cannot
 *     cover every corner of a glyph, so it needs a widening phase to catch
 *     the leftovers, and that reads as patching.
 *   - not one boundary crossing the whole word. That ignores the letterforms
 *     and reads as a bar scanning over them.
 * The half-plane guarantees the letter is filled completely behind the front
 * — nothing left over, nothing filled twice — while the direction and the
 * order carry the writing. A stem's ends are top and baseline while its
 * neighbours sit on the baseline, so its direction follows where the pen
 * ARRIVES. The edge bows, middle leading, the way a nib lays ink.
 *
 * Every front is paced by ink AREA rather than distance, and its duration is
 * proportional to area too, so the amount of new ink per frame is constant
 * within a letter and between letters. At constant SPEED a front dumps four
 * times the mean rate crossing something fat like the ق bowl.
 *
 * Scale and schedule are measured off the reference: its word spans 53.85% of
 * a 1512x805 panel, centred 5.9px high; its fill runs frames 29 to 208 of a
 * 241-frame, 25fps loop. The easing is one accelerate-cruise-decelerate
 * across the whole word (sampled velocity 0.76 / 1.14 / 0.76, a 1.06x spread
 * through the middle), not one ease per letter.
 *
 * The letterforms are the real thmanyah Serif Display Black outlines and are
 * generated, not hand-drawn. To regenerate for another word or weight:
 *
 *   python3 scripts/wordmark/shape.py \
 *     public/fonts/thmanyah-serif-display-black.woff2 "بالقلم" ss01 \
 *     > .wordmark/word.json
 *   python3 scripts/wordmark/compose.py .wordmark
 *   python3 scripts/wordmark/emit-jsx.py && python3 scripts/wordmark/apply-css.py
 *
 * The one hand-authored piece is `STROKES` in compose.py — one travel
 * direction per letter. Re-author it when the word changes; everything else
 * (extents, timing, the parked reduced-motion positions) is derived.
 *
 * Animation lives in `thmanyah-clone.css` under `.bq-*`; it is paused until
 * `.bq-go` is set, so nothing runs while the panel is off screen.
 */
export function WordmarkWriting({ playing }: { playing: boolean }) {
  return (
    <svg
      viewBox="%VB%"
      preserveAspectRatio="xMidYMid meet"
      className={playing ? "bq bq-go" : "bq"}
      role="img"
      aria-label="بالقلم"
    >
      <g className="bq-r bq-cycle">
        {/* the standing hairline outline — present from the first frame */}
%OUTLINE%
        {/* the sweep: a moving boundary, leading at the connector band and
            trailing at the ascenders, so the baseline fills first */}
%GUIDE%
        {/* the letterforms, revealed by it in one forward pass */}
%FILL%
      </g>
    </svg>
  )
}
