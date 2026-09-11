// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
// It used to be a client component for one reason — a Lottie animation in the
// right-hand column — and the green banner has no animation slot, so the
// "use client" boundary and `lottie-react` leave this page with it.
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface LibraryHeroProps {
  lang?: string
  dictionary?: Dictionary
}

/**
 * The library's opening banner.
 *
 * Deliberately the SAME object as the /live banner (`school-dashboard/live/
 * landing/status-hero.tsx`) — same ground, same geometry, same type, same two
 * pills, same marginalia art sitting straight on the green. The two landing
 * pages are siblings in the school dashboard and were drifting apart: /live
 * had the brand banner while /library still had a 7xl wordmark beside a
 * CDN-fetched Lottie. When one of these changes, change both.
 *
 * The ground is the saas-marketing green `#00bc6d` — the one the marketing
 * hero is built on. Literal hexes on purpose. This is a brand ground, not a
 * themed surface: it does NOT invert, and every piece of ink on it is pinned
 * DARK rather than tokenised — white on `#00bc6d` measures about 2.5:1 and is
 * unreadable, which is why the marketing hero pairs this green with black.
 * Nothing here may use `primary-foreground`: on this ground that token is
 * white in light mode and black in dark, which is exactly backwards.
 *
 * The card's geometry is the reference banner's, measured: 1170px of container
 * at a 36px radius, 259px tall. The `mb-8` the /live hero carries is dropped —
 * this page's own `space-y-12` already owns the rhythm under the banner, and
 * both margins would stack.
 *
 * Mobile is the reference's too: the card stacks to one column, keeps its full
 * padding and radius, and drops the art rather than shrinking it under the
 * headline.
 */
export function LibraryHero({ lang = "en", dictionary }: LibraryHeroProps) {
  const d = dictionary?.library

  return (
    <section>
      <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-10 text-[#050505] sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
        <BannerArt />

        <div className="relative min-w-0">
          {/* Two lines of ~7 words inside a ~420px measure, at the reference's
              ~38px — the emphasis carried by WEIGHT inside an otherwise light
              line rather than by a highlight.

              BOTH LINES ARE WIDTH-MATCHED, and the tatweels in the Arabic
              string are the knob that does it, exactly as they are on the
              /live banner. Measured in the browser at 1440px: Arabic renders
              333px over 333px, English 320px over 312px. Deleting a tatweel
              because it looks like a typo, or translating the sentence
              literally into a longer one, un-matches the rows — re-measure the
              two line boxes after any edit to `hero.title` or `hero.titleMark`
              rather than eyeballing it. The two languages are transcreated,
              not word-for-word, for the same reason: a literal mirror of
              either line wraps to three.

              The face is thmanyah sans, already vendored in `public/fonts/`
              and declared by `src/styles/thmanyah-clone.css`, which the ROOT
              layout imports — so it is available here without this page
              loading anything of its own. It ships five weights (300 · 400 ·
              500 · 700 · 900) and this line uses two of them: 300 for the
              sentence, 700 for the phrase that carries it. A weight the family
              does not have would be synthesised by the browser and lose the
              face's own drawing, which is the whole reason to use it. */}
          <h1
            className="max-w-[16ch] text-3xl leading-[1.35] font-light text-balance sm:text-4xl lg:max-w-[420px] lg:text-[38px]"
            style={{ fontFamily: '"thmanyah sans", sans-serif' }}
          >
            <MarkedHeadline
              template={d?.hero?.title}
              mark={d?.hero?.titleMark}
            />
          </h1>

          {/* No supporting sentence, like the online /live banner: a paragraph
              restating what a library is, to readers already standing in one,
              is noise above their own shelves. */}

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link className={pill("default")} href={`/${lang}/library/books`}>
              {d?.hero?.explore}
            </Link>
            <Link
              className={pill("ghost")}
              href={`/${lang}/library/my-profile`}
            >
              {d?.hero?.favorites}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The banner's mark.
 *
 * A transparent line illustration sitting directly ON the green, inside the
 * shell's own rounded box — not a picture in a card. It carries no rectangle
 * of its own, so the ground stays unbroken, which is the whole reason the
 * /live banner uses this set rather than a photograph.
 *
 * It reads `category-04-alpha.svg`, a DERIVED file. Regenerate it from the
 * source, never by hand:
 *
 *     sed 's/#F1E6D0/#9FE5B1/g' public/anthropic/category-04.svg \
 *       > public/anthropic/category-04-alpha.svg
 *
 * The source is already transparent (`fill="none"` on the root, no background
 * rect) and its artwork already fills its own 1300x1241 canvas, so unlike the
 * /live mark this one needs no viewBox reframing — the single edit is colour.
 * The line work stays black, which is the banner's ink anyway; the one SOLID
 * shape is recoloured from the source's parchment `#F1E6D0` to `#9FE5B1`, the
 * mint the saas-marketing hero highlights its headline with and the third
 * colour in that hero's triad. Parchment on `#00bc6d` reads as a dirty smudge;
 * the mint is the deliberate lift the ground was built for.
 *
 * A written page is the library's own subject, the way the media glyphs are
 * /live's — same hand, same set, different noun.
 *
 * Positioned with logical offsets so it mirrors on /en without a transform,
 * and hidden below md, where the card stacks and it would sit under the
 * headline rather than beside it.
 */
function BannerArt() {
  return (
    <img
      src="/anthropic/category-04-alpha.svg"
      alt=""
      decoding="async"
      draggable={false}
      aria-hidden="true"
      className="pointer-events-none absolute end-12 hidden size-[150px] object-contain md:block lg:size-[168px]"
    />
  )
}

/**
 * The headline, with its opening phrase carrying the weight.
 *
 * The phrase travels as its own dictionary key rather than as markup inside
 * the sentence: an Arabic translator moving it would otherwise have to carry
 * tags through a right-to-left string, and a stray one would render as text.
 * A template with no `{mark}` simply renders unmarked.
 */
function MarkedHeadline({
  template,
  mark,
}: {
  template?: string
  mark?: string
}) {
  if (!template) return null
  const [before, after] = template.split("{mark}")

  if (after === undefined || !mark) return <>{template}</>

  return (
    <>
      {before}
      <strong className="font-bold">{mark}</strong>
      {after}
    </>
  )
}

/**
 * The homepage's small pill button, rather than a full-width one — a compact
 * action reads as a tool, a wide one reads as a landing page.
 *
 * The reference hero's CTA: a white pill with dark ink on the green ground,
 * pinned like everything else on this banner so it reads the same in both
 * themes. A token pair would invert in dark mode and lose the contrast the
 * ground was chosen for — which is why this is not `buttonVariants()`.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-white text-[#050505] hover:bg-white/90"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}
