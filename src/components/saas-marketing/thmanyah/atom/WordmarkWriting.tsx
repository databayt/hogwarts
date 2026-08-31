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
      viewBox="-900 -1268 3977 2093"
      preserveAspectRatio="xMidYMid meet"
      className={playing ? "bq bq-go" : "bq"}
      role="img"
      aria-label="بالقلم"
    >
      <g className="bq-r bq-cycle">
        {/* the standing hairline outline — present from the first frame */}
        <path
          d="M1566 -760L1586 -760L1640 -560L1605 -519L1605 -438C1605 -332 1542 -127 1512 -44C1495 -30 1447 0 1399 0L1399 -0C1398.7 -0 1398.3 0 1398 0C1315 -1 1211 -27 1129 -76L1012 -15C979 -4 954 0 916 0L916 -0C915.7 -0 915.3 0 915 0C834 0 790 -52 773 -170L728 -36C704 -9 670 0 637 0C577 0 548 -69 515 -139L456 15C376 0 318 -23 259 -53C186 -90 167 -151 208 -225L219 -244C226 -257 234 -270 242 -283C202 -279 161 -272 119 -261L151 40C155 80 150 119 135 156L82 287L67 287L27 4C12 -104 40 -196 113 -277C200 -373 294 -429 424 -429L425 -429C576 -429 560 -189 685 -189L685 -189C685.3 -189 685.7 -189 686 -189C714 -189 740 -190 769 -199C768 -210 767 -222 766 -234L741 -616L842 -756L862 -756L862 -236C862 -198 879 -189 964 -189L964 -189C964.3 -189 964.7 -189 965 -189L1016 -189C1005 -212 999 -236 999 -261C999 -369 1105 -499 1239 -499C1318 -499 1377 -453 1377 -352C1377 -288 1353 -236 1312 -193C1352 -190 1397 -189 1447 -189C1467 -189 1497 -192 1511 -194L1482 -654L1566 -760ZM1882 0C1788 0 1744 -70 1733 -234L1708 -616L1809 -756L1829 -756L1829 -236C1829 -198 1846 -189 1931 -189L1931 -189C1931.3 -189 1931.7 -189 1932 -189C1992 -189 2057 -195 2110 -205C2082 -240 2033 -288 1987 -321L2057 -487L2077 -487L2165 -362L2142 -307C2143 -267 2135 -226 2119 -184L2069 -50C2012 -17 1937 0 1883 0L1883 -0C1882.7 -0 1882.3 0 1882 0ZM1360 -668C1361 -667 1361 -654 1360 -653L1276 -569L1201 -644L1126 -569L1041 -654L1041 -667L1126 -752L1201 -677L1276 -752L1360 -668ZM2074 168C2075 169 2075 184 2074 185L1977 282L1879 184L1879 169L1977 71L2074 168ZM1020 -301C1052 -317 1110 -332 1169 -332C1257 -332 1318 -299 1318 -222L1214 -202C1099 -219 1044 -252 1020 -301ZM239 -244C267 -263 307 -287 355 -287C436 -287 476 -219 510 -150C403 -183 323 -210 239 -244Z"
          fill="none"
          stroke="#000"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* the sweep: a moving boundary, leading at the connector band and
            trailing at the ascenders, so the baseline fills first */}

        {/* the letterforms, revealed by it in one forward pass */}
        <mask
          id="bq-mk0"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(168.69)">
            <path
              className="bq-r bq-f0"
              fill="#fff"
              d="M-2249 -406C-2203 -293 -2198 -227 -2198 -151C-2198 -74 -2203 -8 -2249 104L-11249 104L-11249 -406Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk0)">
          <path
            transform="translate(1883 0)"
            d="M194 -487L174 -487L104 -321C150 -288 199 -240 227 -205C174 -195 109 -189 49 -189C17 -189 0 -172 0 -140L0 0C54 0 129 -17 186 -50L236 -184C252 -226 260 -267 259 -307L282 -362Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk1"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(-96.84)">
            <path
              className="bq-r bq-f1"
              fill="#fff"
              d="M-254 1717C-231 1773 -229 1806 -229 1844C-229 1881 -231 1914 -254 1970L-9254 1970L-9254 1717Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk1)">
          <path
            transform="translate(1657 0)"
            d="M225 0C257 0 274 -17 274 -49L274 -189C189 -189 172 -198 172 -236L172 -756L152 -756L51 -616L76 -234C87 -70 131 0 225 0Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk2"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(109.29)">
            <path
              className="bq-r bq-f2"
              fill="#fff"
              d="M-1274 -1443C-1248 -1379 -1245 -1341 -1245 -1298C-1245 -1254 -1248 -1217 -1274 -1153L-10274 -1153L-10274 -1443Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk2)">
          <path
            transform="translate(1399 0)"
            d="M187 -760L167 -760L83 -654L112 -194C98 -192 68 -189 48 -189C25 -189 0 -164 0 -141L0 0C48 0 96 -30 113 -44C143 -127 206 -332 206 -438L206 -519L241 -560Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk3"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(173.16)">
            <path
              className="bq-r bq-f3"
              fill="#fff"
              d="M-1521 -197C-1469 -71 -1463 4 -1463 90C-1463 177 -1469 251 -1521 378L-10521 378L-10521 -197Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk3)">
          <path
            transform="translate(916 0)"
            d="M482 0C514 0 531 -17 531 -49L531 -189C481 -189 436 -190 396 -193C437 -236 461 -288 461 -352C461 -453 402 -499 323 -499C189 -499 83 -369 83 -261C83 -236 89 -212 100 -189C83 -189 66 -189 49 -189C15 -189 0 -174 0 -140L0 0C38 0 63 -4 96 -15L213 -76C295 -27 399 -1 482 0Z M104 -301C136 -317 194 -332 253 -332C341 -332 402 -299 402 -222L298 -202C183 -219 128 -252 104 -301Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk4"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(-160.71)">
            <path
              className="bq-r bq-f4"
              fill="#fff"
              d="M-972 180C-909 367 -902 477 -902 604C-902 732 -909 842 -972 1028L-9972 1028L-9972 180Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk4)">
          <path
            transform="translate(637 0)"
            d="M278 0C310 0 327 -17 327 -49L327 -189C242 -189 225 -198 225 -236L225 -756L205 -756L104 -616L129 -234C130 -222 131 -210 132 -199C103 -190 77 -189 49 -189C17 -189 0 -172 0 -140L0 0C33 0 67 -9 91 -36L136 -170C153 -52 197 0 278 0Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk5"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(118.81)">
            <path
              className="bq-r bq-f5"
              fill="#fff"
              d="M-668 -615C-606 -464 -599 -374 -599 -270C-599 -167 -606 -77 -668 75L-9668 75L-9668 -615Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk5)">
          <path
            transform="translate(0 0)"
            d="M208 -225C167 -151 186 -90 259 -53C318 -23 376 0 456 15L515 -139C548 -69 577 0 637 0C667 -6 685 -13 685 -44L685 -189C560 -189 576 -429 425 -429L424 -429C294 -429 200 -373 113 -277C40 -196 12 -104 27 4L67 287L82 287L135 156C150 119 155 80 151 40L119 -261C161 -272 202 -279 242 -283C234 -270 226 -257 219 -244Z M239 -244C267 -263 307 -287 355 -287C436 -287 476 -219 510 -150C403 -183 323 -210 239 -244Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk6"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(124.99)">
            <path
              className="bq-r bq-f6"
              fill="#fff"
              d="M-1102 -1835C-1082 -1785 -1080 -1755 -1080 -1721C-1080 -1686 -1082 -1657 -1102 -1606L-10102 -1606L-10102 -1835Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk6)">
          <path
            transform="translate(1883 0)"
            d="M191 185C192 184 192 169 191 168L94 71L-4 169L-4 184L94 282Z"
            fill="#000"
          />
        </g>
        <mask
          id="bq-mk7"
          maskUnits="userSpaceOnUse"
          x="-900"
          y="-1268"
          width="3977"
          height="2093"
        >
          <g transform="rotate(165.96)">
            <path
              className="bq-r bq-f7"
              fill="#fff"
              d="M-1513 213C-1488 273 -1486 308 -1486 349C-1486 391 -1488 426 -1513 486L-10513 486L-10513 213Z"
            />
          </g>
        </mask>
        <g mask="url(#bq-mk7)">
          <path
            transform="translate(916 0)"
            d="M444 -653C445 -654 445 -667 444 -668L360 -752L285 -677L210 -752L125 -667L125 -654L210 -569L285 -644L360 -569Z"
            fill="#000"
          />
        </g>
      </g>
    </svg>
  )
}
