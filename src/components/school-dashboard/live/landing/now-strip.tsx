// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { CalendarClock, Radio } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface NowStripProps extends LandingSectionProps {
  live: LandingSession[]
  upcoming: LandingSession[]
  viewer: LandingViewer
}

/**
 * What is actually happening — the first content on the page.
 *
 * The layout is thmanyah.com's editorial block, built from its own markup and
 * computed styles rather than by eye:
 *
 *   block      : ONE row · row-gap 32px · children padded 8px (37.5px from md)
 *                with the row pulled out by the same, so content sits flush
 *   widths     : lead takes the full 24 columns; the rest take 24 until LG and
 *                12 above it — the two-up starts at lg, NOT at md
 *   card row   : margin-inline −8px · row-gap 16px · NO column gap · radius 8px
 *                · padding 4px, and from md padding-block 8px with the start
 *                side flush and 3px (lead) / 2px (small) on the end
 *                · lead is middle-aligned from md, small rows always top
 *   art column : basis 104px → an 80px square, and from md 274px (lead) /
 *                144px (small) → 250 and 120 · padding 12px · radius 12px
 *   copy col   : flex 1 · padding 8px — with the art's 12px, that IS the gap
 *   title      : 16px, 20/32 from lg · 600 · margin-bottom 8px · 2 lines
 *   dek        : 14px · margin-bottom 8px · 1 line, 2 from lg
 *   byline     : flex wrap · column-gap 4px · row-gap 12px (lead) / 8px
 *                · name bold · the rest secondary, 12px until sm
 *
 * Two deliberate departures. COLOUR is ours: the reference is a light-only
 * page with a brand orange for its bylines, while this renders inside a themed
 * dashboard, so the values map to `foreground` / `muted-foreground` and the
 * accent is the live state. And there is no author AVATAR — a session has a
 * teacher's name but no portrait, and the reference's 24px round image beside
 * the byline has nothing to hold.
 *
 * The shape suits this data better than the even four-column grid it replaced:
 * a school usually has ONE class live and several coming up, and a uniform
 * grid rendered that single live session as one lonely card in four columns of
 * white space.
 *
 * There is NO section heading and no "view all" — the reference's block under
 * its banner is article rows and nothing else, and the distinction those two
 * headings used to carry now lives inside each row: a live class says so where
 * the reference prints its byline, a scheduled one prints its time. The whole
 * list is still one click away, from the banner above.
 *
 * Times arrive pre-formatted in the school's own zone (see the page) — a
 * server-side `toLocaleTimeString` resolves against the runtime's zone, which
 * is UTC on Vercel.
 */
export function LiveNowStrip({
  dictionary,
  lang,
  live,
  upcoming,
  viewer,
}: NowStripProps) {
  const n = dictionary?.landing?.now
  const featured = live[0] ?? null
  // Anything live beyond the first joins the compact row, ahead of what is
  // merely scheduled — a room you can walk into now outranks one you cannot.
  const rest = [...live.slice(1), ...upcoming]

  // Three rows: a lead and the two-up under it. Counted off the WHOLE block
  // rather than off `rest`, because a school with nothing live has no
  // `featured` — the first scheduled class becomes the lead instead, and a cap
  // applied to `rest` alone would then leave a single lonely half.
  const rows = (featured ? [featured, ...rest] : rest).slice(0, 3)

  if (rows.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex flex-col items-center gap-3 rounded-[36px] border border-dashed py-16 text-center">
          <CalendarClock
            className="text-muted-foreground size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="font-medium">{n?.emptyTitle}</p>
          <p className={cn(typographyVariants.hint, "max-w-[42ch]")}>
            {n?.emptyDescription}
          </p>
        </div>
      </section>
    )
  }

  return (
    // The reference's whole block is ONE row: children padded 8px (37.5px from
    // md), the row pulled out by the same amount so the content sits flush,
    // and a 32px row-gap between items. The lead article takes all 24 columns;
    // the rest take 24 until LG and 12 above it — the two-up starts at lg, not
    // at md. The block closes on a hairline before the next one.
    //
    // TWO under the lead, never four. The reference's block is a lead plus a
    // single two-up row, and a second row of halves reads as a list rather
    // than as the shape being mirrored. The rest of what is coming stays one
    // click away, on the sessions table.
    <section className="mb-16 border-b pb-8">
      <ul className="-mx-2 flex flex-wrap gap-y-8 md:-mx-[37.5px]">
        {rows.map((session, index) => (
          <li
            key={session.id}
            className={cn(
              "w-full px-2 md:px-[37.5px]",
              index === 0 ? null : "lg:w-1/2"
            )}
          >
            <SessionRow
              session={session}
              dictionary={dictionary}
              lang={lang}
              viewer={viewer}
              size={index === 0 ? "lead" : "small"}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * One session as the reference's article row.
 *
 * Every value here is off its markup, not estimated: the row carries
 * `margin-inline: -8px` with a 16px row-gap and NO column gap — the space
 * between art and copy is the two columns' own padding (12px + 8px) — 4px of
 * padding all round below md, and from md `padding-block: 8px` with the start
 * side flush and 3px (lead) / 2px (small) on the end. The lead row is
 * middle-aligned and drops to top below md; the small rows are top-aligned at
 * every width.
 *
 * The art column is 104px basis on mobile — an 80px square once its 12px
 * padding is off — and 274px (lead) / 144px (small) from md, giving 250 and
 * 120. The copy column is padded 8px and flexes.
 *
 * The whole row is one link with a tinted hover, as theirs is.
 */
function SessionRow({
  session,
  dictionary,
  lang,
  viewer,
  size,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
  size: "lead" | "small"
}) {
  const n = dictionary?.landing?.now
  const href = joinHref(session, viewer, lang)
  const isLead = size === "lead"

  return (
    <Link
      href={href}
      className={cn(
        "group hover:bg-muted/50 -mx-2 flex flex-wrap gap-y-4 rounded-[8px] p-1 transition-colors md:py-2 md:ps-0",
        isLead
          ? "items-start md:items-center md:pe-[3px]"
          : "items-start md:pe-[2px]"
      )}
    >
      <div
        className={cn(
          "shrink-0 basis-[104px] px-3",
          isLead ? "md:basis-[274px]" : "md:basis-[144px]"
        )}
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-[12px]",
            isLead ? "md:max-w-[250px]" : "md:max-w-[120px]"
          )}
        >
          <Art
            session={session}
            sizes={isLead ? "(min-width: 768px) 250px, 80px" : "120px"}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        <h3 className="mt-0 mb-2 line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
          {session.title}
        </h3>

        <p className="mb-2 line-clamp-1 text-sm lg:line-clamp-2">
          {dek(session)}
        </p>

        {/* Their byline row: the person in bold, then the placing and the date
            in the secondary colour, the date a size smaller until sm. Ours
            names the teacher, then where the class sits and when — or that it
            is running, which is this page's version of a dateline. */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-1",
            isLead ? "gap-y-3" : "gap-y-2"
          )}
        >
          {session.teacherName ? (
            <span className="text-sm font-bold">{session.teacherName}</span>
          ) : null}
          <span className="text-muted-foreground text-xs sm:text-sm">
            {session.isLive ? (
              <span className="text-primary inline-flex items-center gap-1 font-bold">
                <Radio className="size-3.5" aria-hidden="true" />
                {n?.liveTitle}
              </span>
            ) : (
              <span className="tabular-nums">{session.scheduledStart}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * The subject's own catalog artwork.
 *
 * `imageUrl` is null whenever the subject has no thumbnail OR CloudFront is
 * unconfigured, which is a normal state rather than an error — so the coloured
 * ground is a first-class fallback, not a placeholder for a failure.
 * `unoptimized` because these are already CDN-encoded at their render width.
 */
function Art({ session, sizes }: { session: LandingSession; sizes: string }) {
  if (!session.imageUrl) {
    return (
      <div
        className="h-full w-full"
        style={{ backgroundColor: session.color || "#e5e7eb" }}
      />
    )
  }
  return (
    <Image
      src={session.imageUrl}
      alt=""
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes={sizes}
      unoptimized
    />
  )
}

/** The dek line: what the class IS, without repeating the title's words. */
function dek(session: LandingSession): string {
  return [session.subjectName, session.sectionName].filter(Boolean).join(" · ")
}

/**
 * Live goes straight into the room; scheduled opens the session. A viewer who
 * may not join at all (ACCOUNTANT) only ever gets the session page.
 */
function joinHref(
  session: LandingSession,
  viewer: LandingViewer,
  lang: string
): string {
  return session.isLive && viewer.canJoin
    ? `/${lang}/live/${session.id}/room`
    : `/${lang}/live/${session.id}`
}
