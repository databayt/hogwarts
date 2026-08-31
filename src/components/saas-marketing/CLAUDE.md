---
epic: 12
sprint: Q3-2026
title: SaaS Marketing (sales surface)
file_type: claude
owner: Mutaz
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/316
docs: https://ed.databayt.org/en/docs/sales
last_audited: 2026-08-31
---

# SaaS Marketing Block

## Context

Public-facing landing pages for the Hogwarts SaaS platform: hero, features showcase, pricing, community resource hub, testimonials, FAQs (75% complete). Blocker: typography violations, legacy code cleanup.

## Before You Start

1. Read `README.md` here for file structure and integration points
2. Feature pages use a section renderer pattern in `features/sections/` -- understand it before adding new sections
3. Check `features/page-data/` for per-feature content definitions

## Key Decisions

- **The homepage IS font.thmanyah.com, cloned verbatim (2026-08-31).** `/[lang]`
  now resolves to `src/app/[lang]/(thmanyah)/page.tsx`, not
  `(saas-marketing)/page.tsx` (deleted). Read this before touching anything on
  the homepage — most of the block's older homepage notes below now describe
  **unwired** components.
  - _Homepage imagery is served from the CDN, NOT from `public/` (2026-08-31)._
    **The re-authoring workflow changed — read this before regenerating a
    tile.** Sources now live in `assets/marketing/home/`, which is NOT served;
    dropping new art into `public/images/` no longer does anything. The loop is:

        # 1. replace the source
        cp new-art.png assets/marketing/home/modern-05.png
        # 2. encode + publish + regenerate the manifest
        pnpm tsx scripts/upload-marketing-assets.ts --upload
        # 3. commit src/components/saas-marketing/thmanyah/lib/cdn-assets.ts

    `cdn-assets.ts` is GENERATED — never hand-edit it. Keys carry a content
    hash, so new art gets a new URL and is served immediately; no CloudFront
    invalidation is ever needed, and `immutable` stays safe.

    Why: the tiles shipped as raw PNG behind `<Image unoptimized>` — a 3.8MB
    2756px source to fill a 433px tile — and everything under `public/` is
    served `max-age=0, must-revalidate`, so nothing cached between visits.
    Measured on the desktop set: **15.49MB -> 2.57MB (-83%)**, of which the
    1.58MB of video is deliberately unchanged. `ModernShowcaseBlock` and
    `StoryNarrativeBlock` render a plain `<picture>` (AVIF -> WebP) rather than
    `next/image`: the files are pre-encoded at 2x display width, so the
    optimizer has nothing left to do.

    GOTCHA: the publisher hardcodes bucket `databayt-cdn`. `AWS_S3_BUCKET` in
    `.env` names `hogwarts-databayt`, the app's own upload bucket — publishing
    there succeeds and then every CDN URL 403s, because the distribution never
    sees the object. The script verifies each URL over HTTPS after upload and
    refuses to write the manifest if any fails.

  - _The hero copy is OURS, the rest is still thmanyah's (2026-08-31)._
    `HeroBlock.tsx` sells the platform: eyebrow `منصة بالقلم`, headline
    `نظام واحد يُدير أعمـال المدرسـة والتعليـم معًا` (green mark on the last two
    words `والتعليـم معًا`), CTA `جرّب المنصة الآن` — the optimized form of
    `marketing.hero.title` ("المنظومة الشاملة لإدارة المدارس والعملية
    التعليمية"; the dictionary key keeps the long original and is NOT read
    here — the clone hard-codes like every other block in the group).
    **Every flex item is width-matched to its reference twin at 92px**
    (tatweel is the knob, as the reference itself uses in
    قـرّرنا/ثمانيــة/عربيًّــــا): نظام 169.8 vs لماذا 165 · واحد 169.3 vs قـرّرنا
    170.6 · يُدير 129.6 vs في 139.9 (no valid tatweel slot — د breaks the
    join) · أعمـال 242.7 vs ثمانيــة 246.5 · المدرسـة 322.1 vs أن نُصمم 324 ·
    highlight 454.0 vs 453.8. Line counts measured identical at 11 widths
    320→1920 (4/3/3/2 per band). **Fitting different copy here is a
    measurement job, not a guess:** the wrap container is
    `min(432|840, 100vw − 2×section-padding)`, so a 320px phone (280px)
    binds, NOT the 840px `max-width`; and when injecting reference text to
    A/B against, item 5 needs `font-feature-settings: normal` — the real
    reference renders `أن نُصمم` with ss01 OFF (324px, not 397px) and with the
    flag wrong the "reference" wraps to 3 lines at desktop and the diff lies.
  - _The hero CTA opens the demo school, and its label says so (2026-08-31)._
    The reference's button is an in-page anchor (`href="#footer"`, where the
    font download lives) reading `احصل على الخط`; the clone inherited that shape
    as `احصل على المنصة`, which promised a purchase the click never delivered.
    It is now `@/components/saas-marketing/demo-link`'s **`DemoLink`** — the
    same component the (unwired) `hero.tsx` uses — so the href follows the
    visitor's root domain: `demo.balqalam.com` on balqalam.com,
    `demo.databayt.org` on ed.databayt.org, `demo.localhost:3000` locally, with
    `NEXT_PUBLIC_DEMO_URL` overriding all three. SSR paints the primary root's
    demo and the client effect re-resolves after mount, so the first paint on
    balqalam.com carries the databayt href for a frame — inherent to DemoLink,
    not new here. `/ar` is appended because the shell is pinned Arabic.
    The label is `جرّب المنصة الآن`, **width-matched like the headline** (the
    button is content-sized, so the copy sets its width): at 16px thmanyah sans
    it renders **170.1px against the reference's 166.9px (Δ +3.2)**, where
    `احصل على المنصة` sat at 181.3 (Δ +14.4) — the swap _reduces_ drift.
    Measured alternatives under the same conditions, if the copy is revisited:
    `ادخل إلى المنصة` 166.8 (Δ −0.1 — the pixel-exact option, but "enter" reads
    as sign-in and the demo has a login page) · `جرّب المنصة مجانًا` 179.6 ·
    `استكشف المنصة` 173.0 · `جرّب المنصة` 142.7. Measure by setting
    `textContent` on the live `.hero-cta a p` node after `document.fonts.ready`
    and reading the anchor's `getBoundingClientRect().width` — one page load
    covers every candidate.
  - _The footer CTA pill signs up instead of collecting an e-mail (2026-08-31)._
    `DownloadCtaBlock.tsx`'s `ابدأ الآن معنا` pill is now a `next/link` to
    **`/{lang}/onboarding`**, the wizard that actually provisions a school.
    It previously carried the reference's whole download mechanic: a click
    switched the button to an "Open 2" variant (340px, white) where the label
    slid out and an e-mail form nested *inside* the button faded in, backed by
    a 3000px "Close trigger", submitting to `joinWaitlist` → `Prospect`
    (source "waitlist") + SALES_NOTIFY_EMAIL. **A click cannot both navigate
    and expand**, so that variant, the form, the close trigger and the 340px
    `.footer-helper2` width helper are all gone, and `joinWaitlist` (still
    exported from `saas-marketing/actions.ts`) now has **no caller anywhere** —
    re-wire it before assuming the waitlist still collects addresses.
    Geometry is unchanged: the pill is still sized by the invisible sans
    Regular `.footer-btn-helper` copy of the label, so it measures the same
    **152.6 × 44** (80.6px helper + 2×36 padding) as before, verified on
    `/ar` and `/en`. Two things the tag swap needed: `.footer-btn` gained
    `text-decoration: none` (the rule was written for a `<button>`, which has
    no UA underline), and the framer wrapper is `motion.create(Link)` — a bare
    `motion.a` would lose client-side navigation.
    **`lang` is threaded page → `HomeTemplate` → block, and is the ROUTE's
    locale, not the shell's.** The clone pins `dir`/`lang` to Arabic at both
    locales because the reference has no English variant, but onboarding is
    our own product with a real English wizard — and dropping `[lang]` on the
    way in is exactly what silently flipped Arabic users to English before.
    `HomeTemplate` now takes a required `lang` prop.
    KNOWN MISMATCH: the 17px glyph is still the reference's **download tray**
    (it downloaded a font package). Nothing downloads any more; swap the
    `<svg>` paths for a directional arrow when the clone's zero-drift brief
    allows it.
  - _"The Answer" section copy is ours too (2026-08-31)._
    `StoryNarrativeBlock.tsx` carries the optimized `marketing.hero.subtitle`
    across the same four slots the reference uses: Row A's h2 holds two
    paragraphs split on the source's sentence break (`<br /><br />` between
    them), Row B's holds body + the bold `<span>` closing line. **Row height
    is driven by the media, not the text** (`.answer-media` 76vh, row
    `max-height: 824px`), so the section stays pixel-identical to the
    reference at 810/1024/1200/1440/1920 (2896/2896/2268/2268/2268px) no
    matter the copy length; only <810 does the text drive it (375: 1176 vs
    the reference's 1434; 600: 2500 vs 2680). The current copy is ~451 chars
    against the reference's 882, so the paragraph blocks run 2–5 lines
    shorter per width. To fit copy to the reference's exact line counts,
    Row B is fitted too: its body was expanded ~3× (advance 981 → ~2750,
    the reference's is 2754) so the block lands on the reference's own line
    vector 11,7,5,4,8,6,5 — exact at all seven widths, with the bold closer
    wrapping mid-line the same way.
    Row A carries TWO paragraphs like the reference (`<br /><br />` between
    them): Abdout's supplied copy is ¶1, and ¶2 was fitted to the
    reference's own second-paragraph line vector — 4,3,3,2,4,3,2 across
    375/600/810/1024/1200/1440/1920, exact at every width, so Row A reads
    4+3 = 8 lines at 1440 exactly like the original. To fit copy to the
    reference's exact line counts,
    the lever is rendered ADVANCE width, not character count (ref @20px:
    p1 2180.4 · p2 1420.3 · B-body 2754.1 · bold 553.2) — and even equal
    advance can differ by a line, because break position decides it: at
    810px the reference wastes a line (65% fill) where tighter-packing
    prose fits 2. Batch-measure candidates by setting text on ONE live text
    node per viewport (7 resizes total, not per-candidate) or a search is
    unusably slow.
  - _The "8" panel writes بالقلم, rebuilt from the font (2026-08-31)._ The
    reference fills that full-bleed panel between Row A and Row B with a
    Lottie that writes ثمانية, and it is **80 baked shape layers with zero
    text layers** (`public/lottie/lottie-stats-letter.json`, AE comp
    `Writing_Direction_03`) chunked by stroke rather than by letter — nothing
    in it can be retargeted to another word. So the panel is rebuilt in
    `thmanyah/atom/WordmarkWriting.tsx` from the real thmanyah Serif Display
    Black outlines. The JSON is unreferenced but kept on disk.
    - **Read the reference by rendering its frames, not its layer names.**
      Load the JSON into lottie-web on a throwaway page and step it with
      `goToAndStop(n, true)`; read the live DOM for the values the JSON
      buries in animated property objects. Doing that is what revealed the
      mechanism: at frame 0 the whole word — **dots included** — stands as a
      hairline OUTLINE, which then FILLS right to left. A first pass built
      from layer names read the hairline diamonds as scattered ornament; they
      are the word's own unfilled dots. Frames 2 / 40 / 110 are informative.
    - **The flow follows Arabic's CONNECTED GROUPS, and the dots come last.**
      بالقلم is two groups — با, then لقلم — and the ink runs through a group
      like a pipe, one continuous motion with no break between its letters:
      the ب bowl flows left along the baseline then up the alef; لقلم opens
      at the TOP of the initial ل and flows down into the baseline, then left
      through the ق, on through the medial ل (whose stem rises as the front
      passes) and into the م loop and tail. `split_glyph()` then holds all
      three dots back — ب's one, ق's two — for a final phase, the way a hand
      adds them. It detects them by containment (largest contour is the body,
      contours inside it are counters, anything else detached is a dot), so
      it survives a change of word; `DOT_STROKES` must keep pace and there is
      an assert for it.
    - **Each step is a front clipped to its own glyph, in writing order.** Two approaches
      were tried and abandoned first, and both failure modes are worth
      knowing:
      - _A pen along a hand-drawn centreline_ cannot cover every corner of a
        glyph at constant width, so it needs a widening phase to catch the
        leftovers — which reads as patching, not writing.
      - _One boundary crossing the whole word_ covers everything, but it
        ignores the letterforms and reads as a bar scanning over them.
        A front is a half-plane **clipped to its own glyph**, travelling in the
        direction that letter is actually written — down the alef and the two
        lams, right-to-left along the ب bowl, the ق and the م. Coverage is
        guaranteed by the half-plane; order and direction come from the
        sequence. The edge **bows** (middle leading, sides trailing) the way a
        nib lays ink; flat is still a scan, only a shorter one. Each letter's
        dots ride with its glyph, so there is no second pass back across the
        word. `STROKES` in compose.py — one direction per letter — is the only
        hand-authored part; extents, timing and the parked reduced-motion
        positions are all derived.
    - **A front must start clear of its own BOW, and its extents come from
      the ink, not the bbox.** Two causes of the same symptom — the letter
      sits still, then a chunk appears, once per letter:
      - the bow starts bulging _into_ the glyph if the start is only cleared
        by the glyph extent, so each front popped a wedge before it moved;
      - projecting the rotated BBOX CORNERS makes the front cross empty
        corner space before reaching any ink (a poor bound for a diagonal
        direction). `ink_points()` samples the outline instead.
        The bow is capped at 70 units for the same reason — its amplitude is
        dead travel.
    - **Each front is paced by AREA, not distance.** At constant speed a
      front reveals ink in proportion to how wide the letter is where it
      happens to be; crossing the ق bowl it dumped 4x the mean rate.
      `area_profile()` rasterises each glyph by even-odd scanline (real
      coverage — the outline's perpendicular spread counts the gap between
      the ق's body and its dots as solid, and made a squat bowl look several
      times bigger than a tall stem), and `area_keyframes()` places 40
      equal-area stops. Durations follow area too, so the rate is constant
      between letters as well as within them. Bin the profile over the
      TRAVEL range, not the glyph's own projection range — they are
      different intervals and mismatching them misplaces every keyframe.
    - **Stem direction follows where the pen ARRIVES.** A stem's ends are top
      and baseline while its neighbours sit on the baseline, so one end is
      always a jump. ا and the medial ل are entered from the previous
      letter's baseline, so they fill UPWARD; the initial ل opens a new
      connected group at its own top and fills down. Filling every stem
      top-down made the activity leap up to a stem top after each letter
      finished at the baseline — four visible jumps instead of the one that
      is unavoidable.
    - **Measure smoothness by rasterising, not by eye.** Clone the `<svg>`,
      bake each mask's computed transform onto it as an attribute (the
      animation lives in the stylesheet and is lost on serialisation), draw
      to a canvas and count black pixels every 50ms. Two things to check:
      no run of 3+ samples with zero new pixels (**dead patches: 0**), and
      the centroid of newly-painted pixels never teleports (**median hop 4px,
      no hop over 40px**). Current ink rate peaks at 4.9x mean on 4 of ~136
      samples, all single-sample blips at letter handoffs.
    - **The green guide and nodes are gone (2026-08-31).** The reference has
      them; we do not. If they ever come back, they belong UNDER the fill, as
      the reference stacks them.
    - **Every contour of a glyph must ride in one `<path>`**, or the counters
      — the ق loop, the م bowl — fill solid instead of punching through.
    - **The outline is the UNITED silhouette, and counters stay OUT of the
      union.** Per-glyph contours leave a vertical seam wherever two letters
      butt together on the connector (three in بالقلم); unioning the counters
      makes skia rewind the hole through a keyhole, which strokes as a
      hairline slit. `shape.py` unions with `skia-pathops` and appends
      counters separately — بالقلم comes out as **6** subpaths (two
      silhouettes, two dot groups, two counters).
    - **The mint ground came from the Lottie, not the section.** `#afe4b6` is
      its `Pale Green Solid 1` layer; dropping the animation turned the panel
      white. It now lives on `.answer-lottie`.
    - **The viewBox does the sizing — matched to the reference by
      measurement.** In a 1512×805 panel the reference's word spans **814.2px
      (53.85%), centred 5.9px above centre**; ours renders 814.3px. Its
      ثمانية is a **tatweel'd lockup** (bbox aspect 2.39 vs 1.87 for the
      plain font) so no other word can match both its width and its height —
      matching the width is what makes the letterforms read at the same size.
      And it uses **`slice`**, which scales by WIDTH on panels wider than its
      16:9 comp; `meet` on a 16:9 viewBox scales by HEIGHT there and lands
      ~8% small. Hence `VB_ASPECT = 1.9`. `WORD_SHARE` is 0.5413, not the
      measured 0.5385, because the bboxes come from control points.
    - **One accelerate-cruise-decelerate for the whole word**, not one ease
      per letter — eight per-letter eases read as stop-start (the reference
      gets away with them only because it has 17 overlapping chunks).
      `cubic-bezier(.3,.2,.7,.8)`: sampled velocity 0.76 / 1.14 / 0.76, a
      1.06× spread through the middle. Span is the reference's own trim
      keyframes, frames 29→208 of a 241-frame 25fps loop.
    - **Verify motion in the browser, never by eye.** Sample every front's
      `translateX` each 100ms and normalise by its travel: no front may go
      backwards (**0 backtracks**) and no later letter may ever be further
      along than an earlier one (**0 out-of-order**). All start at 0, all
      finish at 1. Two bugs that were
      invisible in screenshots and obvious here: `stroke-dasharray: L` is a
      REPEATING dash L / gap L, so an L even a unit under the path length
      painted a sliver from frame 0; and `stroke-linecap: round` paints a
      full-DIAMETER dot at zero dash length. Both are moot on the current
      boundary design but will bite again if pens return.
    - `useInView` is deliberately **not** `once`: the write loops, so
      `.bq-go` drops when the panel leaves the viewport and everything
      pauses. Under `prefers-reduced-motion` the animation is dropped and the
      sweep parked at its end, leaving the finished filled word.
  - _The Modern ticker section's copy is ours (2026-08-31)._
    `ModernShowcaseBlock.tsx` — mechanics untouched (sticky title, the
    grab-drag ticker, 100px/s track, fling decay, the 3x tile repeat).
    Width-matched at the reference's sizes: eyebrow `نظام حديث` 119.6 vs
    111.4 (24px), headline `يصنع توازنًا مريحًا لمدرستك` **450.6 vs 451.6**
    (44px/900 — a 1px match, keeping the reference's own construction),
    lede 471.5 vs 500 and still ONE line in the 1320px box. All three stay
    masculine so eyebrow/headline/lede agree the way the reference's do
    (`خط`…`يصنع`…`يجمع`) — which is why it is `نظام`, not `منظومة`.
    **TILES ARE STILL THMANYAH'S**: the 30 mounted video/poster tiles all
    show their typeface in use. They are fixed-width by design — the loop
    renders the set three times and the track speed is tuned to the total
    width — so replacements must keep each tile's `w`/`ar` or the seamless
    wrap breaks.
  - _Own route group._ The reference has no site header and ships its own
    footer, so the clone must not inherit `(saas-marketing)/layout.tsx`. The
    `licenses` / `licenses-en` pages live in the same group because the
    homepage's footer and FAQ link to them; both paths had to be added to
    `publicRoutes` in **both** `src/routes.ts` and `src/proxy.ts` — the proxy
    keeps its own copy of the list, and an unknown path 307s to `/login`.
  - _Always RTL, both locales._ The reference has no English variant. `dir` and
    `lang` are pinned on `.thmanyah-shell`, deliberately **not** via
    `DirectionProvider` — that provider writes `document.documentElement.dir`
    in an effect, and on `/en` it would leave the whole session RTL after a
    soft navigation away. Nothing in the clone reads Radix direction context
    (its only Radix import is `Slot`), so the context is unnecessary.
  - _CSS: `src/styles/thmanyah-clone.css`, global import, `.thmanyah-shell`
    scope._ Per-route CSS chunks are NOT removed on soft navigation, so the
    source's document-level reset had to be re-anchored rather than relied on
    to unload. **The reset selectors use `:where(.thmanyah-shell)` and must
    stay that way** — the wrapper has to contribute zero specificity so the
    rules stay as weak as the reference's bare `input, textarea, select,
button`. A plain `.thmanyah-shell textarea` outranks
    `.tester-ta { font-size: 124px }` and shrinks the type tester to 12px, with
    no error anywhere. The file's header lists all four deltas from the source.
  - _`.thmanyah-shell` cancels the `layout-container` gutter_ with
    `margin-inline: calc(-1 * var(--container-px, 0px))` — `[lang]/layout.tsx`
    puts `padding-inline: … !important` on its wrapper div and the clone is
    full-bleed. Same trick as `.page-wrapper` in `zenda-shell.css`.
  - _Every `<Image>` is `unoptimized`_, matching the source's
    `images.unoptimized: true`. The optimizer's q75 WebP re-encode visibly
    dirties the calligraphy strokes.
  - _Assets sit at the reference's own paths_ (`public/{fonts,images,videos,
lottie}`, zero collisions with hogwarts') so no CSS or JSX URL changed.
    `FontDownloadService` fetches `/fonts/<file>` directly — moving them breaks
    the download CTA silently (it swallows fetch errors per file).
  - _How to verify a change._ Run the source clone (`~/thmanyah`, `next dev -p
3100`) as the control and diff against it, not against the live site: the
    live site's own animation phase and CDN re-encodes put a 2–4% pixel floor
    under any comparison. Section geometry is the reliable signal — heights and
    `document.documentElement.scrollHeight` match the live site to the pixel at
    every width from 375 to 1920, so any geometry drift is a real regression.

- Feature showcase uses a generic `section-renderer.tsx` that renders different section types from data
- Page data is static TypeScript objects in `features/page-data/` (not database-driven)
- Grid grouping/order/tabs are driven by `FEATURE_GROUPS` in `constants.tsx` (6 consolidated client-facing groups — Academics, Learning, Finance, Communication, Operations, Insights & AI — ordered by importance; each lists its feature ids in display order). `GROUP_OF` maps id→group; `SHOWN_FEATURES` is sorted by group rank. The fine-grained `feature.category` field is now ONLY used by detail-page badges. To re-tab/reorder, edit `FEATURE_GROUPS` (no need to touch the big `FEATURES` array).
- **Dictionary cache GOTCHA:** the features hero `title`/`badge`/`subtitle` come from `marketing.features` in `en.json`/`ar.json`. `getDictionary` caches at dev-server start — editing the JSON does NOT hot-reload; you MUST restart `pnpm dev` (kill :3000 + relaunch) or the page keeps serving the old string (symptom: disk says "boring" but page renders "boarding").
- The public grid (`feature-tabs.tsx`) renders `SHOWN_FEATURES` — built + partially-built modules only (48 of 85). The full 85-item `FEATURES` list stays intact (detail pages + `relatedFeatures` still resolve); `PLANNED_FEATURE_IDS` in `constants.tsx` is the hide filter (not-yet-built + a few abstract platform attributes pulled out of the grid; audited 2026-06-16). Drop an id from that set when it should show.
- A few feature **titles** were shortened for the grid (display only — `id`/URL slug unchanged): `live-classroom`→"Conference", `online-appointment`→"Appointment", `whatsapp-integration`→"WhatsApp", `discussion`→"Message".
- Card icons: clean 512×512 PNG from `FEATURE_IMAGES`, served **locally from `public/feature/`** (NOT via `asset()`/CDN). CRITICAL: the flat CDN namespace (`cdn.databayt.org/hogwarts/<file>`) serves PHOTOS for some of these names — `events.png`=sack-race photo, `transport.png`=train, `library.png`=girl reading — because `/illustrations/*` and `/photos/*` collide once flattened. Always map feature icons to `/feature/<name>.png` and `git add` the file (untracked public assets don't deploy). All shown features now have an icon (0 category fallback). Brand conferencing icons: `meet.png` (Google Meet — the full-color logo; listed in `COLOR_ICONS` in `feature-tabs.tsx` and `COLOR_ART` in `sections/card-art.ts` so the dark-mode `dark:invert` is skipped, which would otherwise mangle a brand mark. It briefly shipped as `meet-color.png`; renamed 2026-08-05 to overwrite the superseded monochrome `meet.png`, so there is one Meet mark, not two), `teams.png` (MS Teams, copied from a `office.png` download), `zoom.png`. The AI Powered card uses `robot-fill.png` — a local copy of `public/illustrations/robot-fill.png`, the same filled robot the chatbot FAB/avatar renders (the chatbot pulls it from the CDN; the grid must stay local per the note above). The superseded `robot.png` is now unreferenced. The grid still uses the PNGs; the **detail pages** render the same `/feature/*.png` glyphs bare (via `sections/glyph.tsx`, `dark:invert`), mapping a card title → PNG with `sections/card-art.ts` and falling back to a bare Lucide icon (`icon-map.tsx`'s `getIconComponent`, keyed by `sections/card-icons.ts`) when there's no matching PNG.
- **`dream-section.tsx` "FIND ? YOUR BOOST" — per-locale headline (2026-07-14):** the kinetic hero hard-coded English (`FIND`/`YOUR`/`BOOST`, hover-card `included!`/`Academic`/`module`) and an LTR-only typography device (vertical `rotate(180deg)` "YOUR" + a pixel-tuned `-195px` slide), so Arabic rendered English words in a broken layout. Fix branches the desktop + mobile headline on `isRTL`: LTR is byte-identical (untouched); RTL renders `اكتشف [?] قوتك` (dict keys `dream.headlineLead`/`headlineTrail`) with the SAME animated `?` box (extracted to a shared `const animatedBox`), same scroll color-flip, but **no** vertical/slide. GOTCHA: Arabic glyphs are ~1.3× wider than Latin, so at the English 10rem the lead+box overran the 50% line and the growing box covered the tag cloud — the RTL headline uses a smaller `clamp(1.75rem,7.5vw,7rem)` so `lead+box` stays inside the start half (verified clear at 768/1024/1440). Hover-card strings + subtitle highlight are now dict-driven (`dream.included`/`module`/`highlight`; en values identical to the old hard-codes, so LTR is unchanged). The component has no `isRTL` of its own — added `const isRTL = lang === "ar"` (do not confuse with `boost.tsx`, a different donation section). **Hydration (2026-07-15):** `isDark` (from `useTheme().resolvedTheme`, undefined during SSR) feeds the subtitle-highlight `subtitleColor` range, so it hydration-mismatched the inline `color` in **dark mode** — now gated behind a `mounted` flag (`useEffect(() => setMounted(true), [])`; `isDark = mounted && resolvedTheme === "dark"`). Rule: any `resolvedTheme`-derived value that reaches rendered output needs the mounted gate. Full `/ar` RTL+i18n test (headline, subtitle highlight, tag cloud, hover reveal card, ar→en switch, dark+RTL) passed 2026-07-15. **RTL kinetic parity (2026-08-03):** the "no vertical/slide in Arabic" compromise is gone — RTL is now a full mirror of the LTR device. Headline restructured to `اكتشف [?] مصدر قوتك` (new dict key `dream.headlineMid` = `مصدر` / en `YOUR`, added to BOTH json files for parity): مصدر is the vertical small word (`writing-mode: vertical-lr` **+ `rotate(180deg)` — RTL script flows bottom-to-top in vertical writing modes, so the flip makes it read top-to-bottom per Arabic spine convention; measured with per-char Range rects, don't eyeball rotated glyphs**; NO tracking — letter-spacing breaks Arabic joins), and the trail slides toward the box via the shared `textX`, now direction-aware (`[0, isRTL ? 195 : -195]`). Box max height in RTL is MEASURED, not the English-tuned 470px: `rtlBoxMaxHeight` = anchor-top→tag-cloud-bottom − `BOX_FINAL_Y`(170), so the grown box lands flush with the cloud's last row at every width. GOTCHA: the Arabic webfont settle grows every text block a few px ~1.7s AFTER hydration and after `document.fonts.ready` resolves, and a ResizeObserver on row/subtitle/cloud somehow never fired for it — the fix is a 250ms settle-poll for the first 4s (setState bails when unchanged → render-free once stable) + RO + resize for later changes. Mobile RTL is two lines like LTR (`اكتشف ?` / `مصدر قوتك`). LTR verified untouched (470px, −195 slide). tsc + i18n suite green (bilingualField ratchet red is pre-existing site-header work, not this).
- `/features/[id]` detail pages are PUBLIC — `src/proxy.ts` must match `/features` with `startsWith` (not exact `includes`), same as `/docs`/`/community`. Exact-match-only silently 307s sub-paths to login.
- **Detail-page UI kit (`features/sections/`, redesigned 2026-06-23):** the old wireframe look (empty `ImagePlaceholder` boxes + empty `bg-primary/10` icon circles) is gone. A first pass tried abstract gradient panels + floating Lucide tiles + `motion/react` scroll-reveals — it read as cheap/foreign and was scrapped. The shipped version **matches the app's own landing aesthetic**: bare `/feature/*.png` glyphs (`glyph.tsx`) on clean `Card`-style cards (`info-card.tsx`, mirroring the `@/components/atom/card` used by the grid), a text-focused hero, subtle `bg-muted/40` CTA bands, and related-features rendered with the real `Card` atom. **No motion, no gradients** — static + token-driven, shared across the `page-data` and `FEATURE_DETAILS` branches. Title→glyph resolution: `card-art.ts` (real PNG) → `card-icons.ts` + `getIconComponent` (Lucide fallback). Verified LTR/RTL/dark/mobile. (Deleted in the redesign: `feature-visual.tsx`, `card-icon.tsx`, `reveal.tsx`, `motion-provider.tsx`, `image-placeholder.tsx`.)
- **Imported demo sections (`features/imported/`, 2026-06-23):** six marketing sections re-implemented from the `~/zenda` + `~/apple` clones in the house stack (Tailwind + tokens), **static** (Webflow CSS / GSAP / Swiper / paddle-nav carousels all dropped) — rendered by `<ImportedSections />` BELOW the detail content in `details.tsx`, kept "as is" for later tweaking. zenda: how-it-works, parents-voice, smarter-transactions (+61/75/71), more-ease. apple: store (rail PNGs copied to `public/store/nav/`), why-apple-mac. Images: zenda categories/testimonials via Webflow CDN, apple value-props via apple.com, zenda service slides copied to `public/imported/zenda/`. All `<img>` (plain, eslint-disabled) so no `next.config` remote-domain allowlist is needed.
- **Detail pages: per-feature showcase + why band replace the demo sections (2026-08-05):** `<ImportedSections />` is no longer rendered by `details.tsx` (the six imported files stay on disk, now unreferenced). In their place: (1) `sections/feature-showcase.tsx` — the zenda Services GSAP sticky-card deck, parameterized per feature from `page-data/showcase/` (six group files + `index.ts`; 24 features have decks) with **real demo-school screenshots** in `public/features/shots/` (1280×1000, captured logged-in as admin, `nextjs-portal` stripped; **untracked assets must be `git add`ed before deploy or images 404 in prod**). It renders after the hero (page-data branch splits `sections[0]`); dots hidden when a deck has <2 cards; card title/para carry `dir="auto"` so English copy keeps LTR punctuation on `/ar` while the grid itself mirrors. **Formatter trap hit here:** prettier-plugin-tailwindcss strips the leading space in `` `services_link${cond ? " w--current" : ""}` `` → write `` `services_link ${cond ? "w--current" : ""}`.trim() ``. (2) `sections/why-databayt.tsx` — the apple why-Mac paddle-nav gallery, deck in `page-data/showcase/why.ts` (7 cards; battle-card rows from `content/docs-en/competitors.mdx` compressed to checkable claims — pricing card says **free up to 100 students, then $1.50/student/mo**, matching the 2026-08-05 per-student pricing model; keep it in sync with `/pricing`), rendered on every detail page before the bottom CTA; each card links somewhere real. Copy rules for decks (from the competitors teardown): concrete + checkable, sell hours saved, no superlatives, no open-source framing. The `student` page-data entry in `core.ts` was rewritten in this voice (dropped RFID/GPS/hostel/alumni-SMS claims); the other 30 entries still need the same pass. Screenshot gaps: conference (no meetings seeded), whatsapp (disconnected), sales/messages (route hangs / not captured), library uses the catalog grid scroll position because the hero carries a Harry Potter film still — never ship that frame on the marketing site.
- **Showcase slides are composed, not bare screenshots (2026-08-05):** cards no longer render the raw shot in a bordered box. `feature-showcase.tsx` builds zenda's slide artwork live — pastel panel (their exact `p-services_img-bg` palette `#e3d3ff / #fcd0e5 / #ccd5fd / #d9d5ca`, cycled by card index), a white browser window with traffic dots at zenda's 2561×2095 panel geometry, the shot cropped to its legible region, floating UI-echo chips overlapping the window edge, and a tinted stat band at its foot. Per-card tuning is the optional `ShowcaseCard.visual` (`panel`/`zoom`/`origin`/`chips`/`stat`); omit it and you get the framed full-frame default, which is what the other 23 decks still render. **Crop math** (all shots are 1280×1000 admin captures with a 257px sidebar): the frame is ~446×285 at desktop, cover-scale 0.349, so visible source width = 1280/zoom and height = 818/zoom, and `origin = x₀·0.349 / (1 − 1/zoom)` as a % of the frame. `zoom: 1.7, origin: "49% 16%"` crops the sidebar away and lands the table's right edge flush — reusable for any dashboard shot, but NOT for `application.png` (public wizard) or `why-arabic.png`, which have different geometry. Four traps, all hit here: (1) `sizes` must ask for the native 1280 (`"(max-width: 767px) 200vw, 1280px"`) or Next serves a 519px variant and the zoom renders upscaled; (2) everything inside the panel is sized in `cqw` under `@container` so the composition scales as one piece — fixed rem sizes left the chips desktop-sized and swamping the panel on mobile; (3) `.zenda-clone` carries a Webflow body reset (`background-color: #fff`) and re-declares the app's whole token set with its dark half scoped to `.zenda-clone .dark` — a descendant selector that never matches, since `.dark` is on `<html>` ABOVE it. So app tokens read inside the band are permanently light: the band background lives on a plain wrapper OUTSIDE `.zenda-clone`, the inner div clears the reset inline (unlayered CSS outranks Tailwind utilities, so `bg-transparent` loses), and the dark text overrides use literal oklch values. The band is `bg-muted` — the deliberate divergence from zenda's cream. (4) Full-bleed must be `mx-[calc(50%-50vw)]`, not `left-50%` + `translateX(-50%)` or `ml-[calc(50%-50vw)]` + `w-screen`: both are physical, and on `/ar` they put this band 256px and the why band 128px off, giving the page 236px of horizontal overflow (fixed in `why-databayt.tsx` too). Verified 1440/390, light+dark, `/en`+`/ar`: GSAP recede reaches 0.92, cards pin at 6rem, scroll-spy walks 0→1→2, no overflow at either width. The GSAP layer is skipped under `prefers-reduced-motion` by design (CSS sticky still stacks) — emulate `no-preference` when testing it or it looks broken.
- **Features catalog i18n (`features/i18n.ts`, 2026-07-15):** the hero/CTA chrome was already dict-driven (`marketing.features` in en/ar.json), but the static catalog CONTENT (42 grid cards' title/description, the 6 tab-group labels + "All", the 4 impact metrics, and the "See more"/"Browse Features"/"Request Feature"/"Talk to Sales" buttons) rendered English on `/ar/features`. Fix keeps **English canonical in `constants.tsx`** (single source for ids/icons/grouping) and adds a co-located **Arabic override map** `features/i18n.ts` keyed by feature id / group id / metric id — deliberately NOT dictionary JSON, to avoid duplicating 42 English descriptions into en.json (guaranteed drift; the app ships exactly 2 locales). `localizeFeature(feature, lang)`, `GROUP_LABEL_AR`, `METRIC_AR`, `featuresUi(lang)` all fall back to the English constant when an Arabic key is missing, so the grid never blanks. Added `id` to `ImpactMetric` (was label-keyed) so metrics key stably. `content.tsx`/`hero.tsx`/`feature-tabs.tsx` wired; detail-page "Feature not found" moved to dict key `marketing.features.notFound`. When adding a grid feature, add its Arabic entry to `FEATURE_AR` in `i18n.ts`. NOTE: `[id]` **detail-page body copy** (FEATURE_DETAILS longDescription/benefits/useCases + `page-data/*`) is still English-only — separate, larger effort.
- **Homepage no longer sells the repo (2026-08-03):** `<OpenSource />` and `<Boost />` (Patreon / Buy-me-a-coffee donations) are unmounted from `content.tsx` — the SaaS homepage pitches the product, not the codebase or donations. Both components and their `marketing.openSource` / `marketing.boost` dict keys are kept intact for reuse elsewhere; only the call sites are gone. `faqs.tsx` lost its pinned first accordion item (the "is this really open source?" question) along with the `marketing.faqs.openSourceTitle` / `openSourceDesc` / `openSourceItems` keys in `en.json`+`ar.json`, and the "Can I contribute?" hard-coded fallback item; the accordion now opens on `item-0` instead of the removed `item-opensource`. GitHub-Discussions references inside the remaining FAQ answers were swapped for Discord/docs/email so nothing points back at the repo. The sweep then went page-wide: `missionCards.description`/`values` lost their "our open-source platform" / "Open-source is participatory development" framing (rewritten to configure-extend-own-your-data, en+ar+the tsx fallbacks); `marketing.features.subtitle` dropped "Open Source. Open Code."; the dead `marketing.hero.services: "GitHub"` key was deleted (hero never rendered it); the chatbot's 4th quick-ask chip "Open Source / Is Databayt open source?" is gone (`chat-window.tsx` + `chatbot/constant.ts` + `type.ts` + both JSONs — the chip list is 3 now, and `prompts.ts` never mentioned open source so no dangling promise); and `template/marketing-header/site-footer.tsx` dropped ", The source code is available on GitHub" (+ the `marketing.footer.sourceCode` keys), leaving "Built by Databayt · Report an issue". Verified zero open-source/GitHub/Patron tokens in the rendered body of `/en`, `/ar`, `/en/features`. DELIBERATELY LEFT: the tenant school-marketing footer (`school-marketing/footer.tsx`, different product surface) and the BigBlueButton feature description in `features/constants.tsx` (factual third-party wording, not our positioning). `open-source.tsx` + `boost.tsx` are now unreferenced anywhere.
- **Per-student pricing model (2026-08-05):** `/pricing` sells **Free $0 (≤100 students) / Pro $1.50/student/mo ($30/mo minimum) / Enterprise $1.00/student/mo (custom, 1,000+)**, 20% off yearly ($1.20/$0.80 units) — competitor-grounded (category norm $2–$15/student/mo; Classe365 $100/mo ≤100 students; regional incumbents $5K–$50K/yr). Tier names Free/Pro/Enterprise (Hobby/Ultra retired). **Single source of truth = `pricing/config.ts`** (`pricingData` with stable `id: PlanId` — the dictionary overlays TEXT only and must NEVER overwrite `id`: CTA/branching used to string-match the *localized* title and silently broke on `/ar`). Numbers flow from there to the cards, the calculator (`pricing/calculator.tsx`, shares `getMonthlyCost`), the chatbot prompt (`chatbot/prompts.ts formatPricing` — now takes `dictionary.marketing.pricing` so the Arabic prompt isn't English), `business-model.mdx` (en+ar, 20% annual), `competitors.mdx`, and the why-band pricing card. Enterprise's `prices.monthly: 1.0` never renders on the card ("Custom") but IS consumed by chatbot + calculator — don't delete as unused. CTA matrix: anonymous → `/${lang}/onboarding`(the old fallback`/starter/dashboard/billing`never existed — every anonymous CTA 404'd); Enterprise + no-Stripe-price states →`enterprise.contactHref`(dict-driven mailto; swap to a real`/contact`page in one line when it exists). Stripe env ids stay flat-fee-shaped and unset — per-student Stripe wiring (quantity/metered prices,`SubscriptionTier`seed, webhook tier resolution, fictional`PLAN_PRICING` $99/$299/$999 MRR) is the "Billing internals" follow-up issue. AR copy is a draft register pending Abdout's native pass.
- **Homepage positioning: "المنظومة الشاملة" (2026-08-30):** the hero sells the platform as one complete system — `المنظومة الشاملة لإدارة المدارس والعملية التعليمية` / "The complete platform for schools and teaching" — replacing `أتمتة الاعمال المملة في المدارس` / "Automate the boring, elevate the wonder.", which framed the product as busywork removal. The change is deliberately narrow: `marketing.hero.title`+`titleMobile`+`subtitle`, `marketing.features.title`+`subtitle`, `marketing.storySection.quote`, `metadata.description` — the four places that carried the old tagline verbatim — in **both** JSONs plus the hard-coded English fallbacks inside `hero.tsx` and `story-section.tsx` (a fallback left stale shows the retired line on any dictionary miss). Testimonials, FAQs and mission prose were left alone; they never carried the tagline. `marketing.hero.subtitle` **was dead dictionary weight** — `hero.tsx` rendered only the title and the two buttons — so the new intro paragraph needed a `<p>` added under the `<h1>`. GOTCHA: `hero.tsx` splits `title` on `\n` and renders one `<span className="block">` per line, so a headline must be authored with its own line breaks; and Arabic needs `leading-[1.3]` there, because at the default h1 line-height the hamza of `لإدارة` collides with the descenders of the line above. The English lockup also had to drop from `xl:text-8xl` to `xl:text-7xl` — "school management" at 96px overflows the half-width hero column and pushed the CTAs below the fold.
- **Hero visual is the balqalam mark, not a Lottie (2026-08-30):** `hero-illustration.tsx` was a client component fetching `https://<cdn>/anthropic/hero.json` into `lottie-react`; it is now a static `next/image` of `/feather.png` — the quill the site header already uses as the brand lockup — at `scale-[0.7] object-contain dark:invert`. The `dark:invert` is what makes a solid-black glyph legible on the dark ground (same trick as `main-nav.tsx`); if you screenshot with only `.dark` forced on `<html>` and no dark background, the feather "disappears" — that is the invert working, not a bug. **Do not drop `lottie-react`** — other blocks still animate with it.
- **Dead homepage controls removed (2026-08-30):** (1) `<DownloadApp />` is unmounted from `content.tsx` — `APP_STORE_URL`/`PLAY_STORE_URL` are `null` until the mobile listings exist, so both store buttons rendered permanently `disabled`; the component stays on disk and goes back into `content.tsx` the day the URLs are filled in. (2) The "Student Success" mission card pointed at `/about`, which exists only under the **school-marketing** subtree — on this site it fell through to the auth matcher and 307'd visitors to `/login?callbackUrl=/ar/about`; it now points at `/features/student`, a real page. (3) Mission-card and FAQ internal hrefs were bare (`/features`, `/docs`) and dropped `[lang]`, silently flipping an Arabic visitor to English — both now prefix `/${lang}`. Verify a homepage link sweep with `Array.from(document.querySelectorAll('main a[href]')).map(a => a.getAttribute('href'))`; every internal href should start with `/ar` or `/en`. Route liveness cannot be checked by status code — the app answers **200 for not-found** — count the not-found marker instead (`لم يتم العثور`: real page = 1, not-found = 3).
- Pricing component has its own README at `pricing/README.md`
- Dictionary-driven i18n via `src/components/internationalization/{en,ar}.json`
- Community is catalog-backed (textbooks/exams/qbank/videos/materials/books with curriculum + grade filters), public + anonymous — see `community/CLAUDE.md`

## Danger Zones

- Typography: several files have hardcoded `text-*` classes instead of semantic HTML (P2)
- `features/constants.tsx` -- feature list used across landing page; changes affect multiple sections
- `config.ts` -- static content config; mistranslations here affect the entire landing page

## Related Blocks

- [Auth](../auth/CLAUDE.md) -- conversion funnel leads to registration
- [Onboarding](../onboarding/CLAUDE.md) -- registered users enter onboarding to create a school
- [SaaS Dashboard](../saas-dashboard/CLAUDE.md) -- operator admin for the platform

## After You Finish

1. Update `README.md` if file structure changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test: visit `localhost:3000` as anonymous user
