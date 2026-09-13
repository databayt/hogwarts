// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Every lumos loading state lives here, and this module must stay SERVER-SAFE:
// no "use client", no hooks, no motion, and no import from a client component.
// A route's loading.tsx that pulls its fallback out of a client file cannot
// paint until that file's JavaScript arrives — which is exactly when a
// skeleton is no longer needed. (/lumos/courses did that until 2026-09-13.)
//
// Each skeleton copies the container / grid / gap / aspect / breakpoint classes
// of the page it stands in for, so the swap to real content does not move
// anything. The per-section comments name the source lines mirrored; re-read
// them when the page changes.

import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// LUMOS HOME — /lumos
// =============================================================================

// =============================================================================
// LUMOS HOME — mirrors the CURRENT /lumos landing page
// =============================================================================
//
// Chrome: `lumos/layout.tsx` is a bare `min-h-screen` div and the
// (school-dashboard) layout brings the header/sidebar/gutter, so this renders
// sections only — no wrapper, no padding of its own.
//
// Sections, in render order (src/components/lumos/home/content.tsx):
//   1. Hero                 content.tsx:103-175   MIRRORED
//      - h1 brand + tagline: sized in `em` off the h1's own font-size ladder,
//        so both lines match at every breakpoint. Tagline em ratio and line
//        widths come from HEADLINE_WIDTHS (content.tsx:93-98); `rtl:` picks
//        the Arabic numbers (ar is the RTL locale).
//      - two buttons: the Dashboard button always renders here — the
//        (school-dashboard) layout redirects anyone signed out.
//      - EducationAnimation box (education-animation.tsx:29-39 — an empty
//        div of the same classes until the Lottie JSON arrives).
//   2. Feature cards        content.tsx:177-212   MIRRORED (Card defaults
//      from ui/card.tsx inlined: rounded-xl border, header space-y-1.5)
//   3. Continue watching    content.tsx:214-220   OMITTED — renders only when
//      the viewer has lesson progress, and students (the ones who have it)
//      are redirected to /lumos/courses by page.tsx before this page renders.
//   4. New releases         hot-releases-section.tsx:48-133   MIRRORED —
//      data-conditional (hidden when the school has no catalog selections)
//      but present for any tenant with a catalog; 4 cards (perPage: 4).
//      Rating row omitted (renders only when a real rating exists).
//   STOPPED HERE. Not mirrored: CurriculumSection (curriculum-section.tsx),
//   TeachingHeroSection, ReasonsSection, HowToBeginSection — all below the
//   first two screens on a phone.
//
// Line heights (Tailwind v4 defaults, no theme overrides in globals.css):
//   text-xs 16px · text-sm 20px · text-base 24px · text-lg 28px ·
//   CardTitle leading-none → 14px / 16px · text-sm leading-tight → 17.5px

/** One text line: a box of the line's real height with a shorter bar inside. */
function Line({ className, bar }: { className: string; bar: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Skeleton className={bar} />
    </div>
  )
}

export function LumosHomeSkeleton() {
  return (
    <>
      {/* Hero — headline + buttons beside the animation (content.tsx:103) */}
      <section className="relative">
        <div className="flex flex-row items-center gap-4 sm:gap-8 lg:gap-16">
          <div className="flex flex-1 flex-col items-start space-y-4 ps-3 text-start sm:space-y-6 sm:ps-0">
            {/* h1: same size ladder, so `em` below resolves to the real size */}
            <div className="text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl">
              {/* Brand line — 1.05em tall, 3.144em wide (ar 3.104em) */}
              <div className="flex h-[1.05em] w-[3.144em] items-center rtl:w-[3.104em]">
                <Skeleton className="h-[0.8em] w-full" />
              </div>
              {/* Tagline — mt-2 block at headlineRatio em, same width */}
              <div className="mt-2 flex h-[calc(1.05em*0.5376)] w-[3.144em] items-center rtl:h-[calc(1.05em*0.8935)] rtl:w-[3.104em]">
                <Skeleton className="h-[75%] w-full" />
              </div>
            </div>

            {/* Buttons — h-7 text-xs on phones, h-10 on sm+ */}
            <div className="flex flex-row gap-2 sm:gap-4">
              <Skeleton className="h-7 w-16 rounded-md sm:h-10 sm:w-38" />
              <Skeleton className="h-7 w-20 rounded-md sm:h-10 sm:w-30" />
            </div>
          </div>

          {/* Animation — same box as EducationAnimation */}
          <div className="flex flex-1 justify-center">
            <Skeleton className="h-32 w-full max-w-md rounded-xl sm:h-58 md:h-70" />
          </div>
        </div>
      </section>

      {/* Feature cards — 2-up on phones, 4-up on lg (content.tsx:177) */}
      <section className="mt-10 mb-32 grid grid-cols-2 gap-3 sm:mt-0 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border shadow-none">
            {/* CardHeader */}
            <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
              <div className="mb-2 h-8 w-8 sm:mb-4 sm:h-12 sm:w-12">
                <Skeleton className="size-full" />
              </div>
              {/* CardTitle — leading-none, text-sm / sm:text-base */}
              <Line className="h-3.5 sm:h-4" bar="h-3 w-3/5 sm:h-3.5" />
            </div>
            {/* CardContent — description text-xs / sm:text-sm.
                ~4 lines in a phone half-column, ~2 in the sm 2-up, ~3 in
                the lg 4-up. */}
            <div className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Line className="h-4 sm:h-5" bar="h-2.5 w-full sm:h-3" />
              <Line
                className="h-4 sm:h-5"
                bar="h-2.5 w-11/12 sm:h-3 lg:w-full"
              />
              <Line
                className="h-4 sm:hidden sm:h-5 lg:flex"
                bar="h-2.5 w-full sm:h-3 lg:w-2/3"
              />
              <Line className="h-4 sm:hidden" bar="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </section>

      {/* Continue watching — omitted, see header comment */}

      {/* New releases — green band, title row + 4 course cards
          (hot-releases-section.tsx:49) */}
      <section className="mb-16 rounded-xl bg-[#BCD1CA] py-6">
        <div className="px-6">
          {/* Title row — h2 text-lg + arrow link */}
          <div className="mb-4 flex items-center justify-between">
            <Line
              className="h-7"
              bar="h-5 w-40 from-black/10 via-black/5 to-black/10"
            />
            <Skeleton className="h-5 w-5 from-black/10 via-black/5 to-black/10" />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-background block overflow-hidden rounded-xl"
              >
                {/* Card image */}
                <div className="aspect-video overflow-hidden">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
                {/* Content — level, title (sm leading-tight), type (xs).
                    The level is a bare inline <span>: it sits in a 24px
                    anonymous line box (body 16px/1.5) and space-y-2's margin
                    never applies to it — hence h-6 + mb-0. */}
                <div className="space-y-2 p-4 text-start">
                  <Line className="mb-0 h-6" bar="h-3 w-16" />
                  <Line className="h-[1.09375rem]" bar="h-3.5 w-3/4" />
                  <Line className="h-4" bar="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// =============================================================================
// LUMOS CATALOG + COURSE DETAIL — /lumos/courses, /lumos/courses/[slug]
// =============================================================================

//
// Server-safe loading skeletons for the Lumos catalog and course detail pages.
// No "use client", no hooks, no motion, and nothing imported from a client
// component — only `Skeleton` (ui/skeleton.tsx carries no directive) and plain
// elements. Every container / grid / gap / padding class below is copied from
// the live component it names, so skeleton → content shifts nothing.
//
// Line boxes (Tailwind v4 defaults, no overrides in globals.css / typography.css):
//   text-xs 16 · text-sm 20 · text-base 24 · text-lg 28 · text-xl 28 · text-2xl 32
//   text-3xl 36 · text-4xl 40 · leading-tight ×1.25 · leading-snug ×1.375
//   leading-relaxed ×1.625 · arbitrary text-[Npx] inherits the body's 1.5.
//
// ── LumosCoursesSkeleton  (browse view, no search) ─────────────────────────────
//   root `space-y-10 py-6`                        courses/content.tsx:265
//   hero tile + two-line h1                        courses/content.tsx:267-301
//     h1 `leading-[1.1]` 30/36/48px; tagline `fontSize: ${ratio}em` (≈0.85,
//     content.tsx:101-106, 293-295); width = HEADLINE_WIDTHS.title per 100px of
//     font size (ar 7.14em, en 7.66em) — drawn here at 7.4em, same for both.
//   search bar (closed)                            courses/content.tsx:304-310
//     container `relative mx-auto w-full max-w-2xl`  search-bar.tsx:468-472
//     bar `flex w-full items-center rounded-full border` (h-11 kids → 46px)
//                                                    search-bar.tsx:477-483
//     explore / separator / input / submit disc      search-bar.tsx:493-498, 512,
//                                                    529-531 & 547-551, 575-578
//   grade badges (12 pills, 28px)                  courses/content.tsx:323-348
//   shelves wrapper `space-y-10`                   courses/content.tsx:351
//   lead card ("start here" / "continue")          courses/content.tsx:356-366
//     section / link / art / text column             continue-learning-card.tsx:73-137
//     portrait disc `size-6`                         continue-learning-card.tsx:198-200
//   Recommended shelf (6 cards)                    courses/content.tsx:368-373
//                                                   course-shelf.tsx:52-78
//   "More" grid (12 compact cards)                 courses/content.tsx:379-400
//
// ── LumosCourseDetailSkeleton ──────────────────────────────────────────────────
//   root `min-h-screen`                            courses/[slug]/content.tsx:150
//   hero section + 2-col grid                      [slug]/content.tsx:152-153
//     left: breadcrumb, h1, description, CTA,        [slug]/content.tsx:155-284
//       "already registered", share row
//     CTA button `h-9 px-6`                          enrollment/catalog-enrollment-button.tsx:50,80
//     right: aspect-video art + stats row            [slug]/content.tsx:287-375
//   About card                                     [slug]/content.tsx:380-461
//   Chapters: heading, lesson grids, sidebar nav   [slug]/content.tsx:464-546
//     CourseLessonCard (72px thumb row)              [slug]/content.tsx:603-641
//   sticky mobile CTA bar                          [slug]/content.tsx:549-575
//
// ── CourseCardSkeleton ─────────────────────────────────────────────────────────
//   mirrors CourseCard                             courses/course-card.tsx:85-158
//   (the old CourseCardSkeleton at course-card.tsx:168 drew an icon eyebrow,
//   two title lines and a rating — the real card has none of those by default)
//
// ── Decisions (data-conditional blocks) ────────────────────────────────────────
//   • Lead card: INCLUDED. It is never absent — "start here" is the fallback
//     (content.tsx:162-206). chapterTitle / lessonTitle are non-null strings in
//     that state (get-start-here.ts:25-26); grade badge included.
//   • Lead card instructor row: OMITTED. It needs a reachable lesson video
//     (get-start-here.ts:134) and the catalog seeds none, so the measured card
//     never carries it; with one, the card grows 30px.
//   • Active grade pill: drawn WIDE at grade 1 (the active pill shows the ordinal
//     word, content.tsx:331; non-students open on the lowest grade). Wraps to two
//     rows at 390px either way, so the height is the same wherever it lands.
//   • "More" grid: INCLUDED with 12 compact cards (OTHERS_PAGE_SIZE). Renders only
//     when the grade has > 7 courses; it is below the fold on phones anyway.
//   • Detail CTA: student view — enrollment button + FREE chip, no Edit link.
//   • Detail progress: NOT-ENROLLED state ("Already registered?", 20px) instead
//     of CourseProgressBar (~98px card; only when enrolled AND progress rows
//     exist — get-course-progress.ts:89).
//   • About objectives list: 6 items (falls back to chapter titles when a course
//     has no objectives, which is the norm).
//
// ── Omissions ──────────────────────────────────────────────────────────────────
//   SeeMore under the grid (only when > 12 others), rating row on cards
//   (averageRating is unset catalog-wide), the shelf's arrow link (`href` is
//   never passed), the Edit link (staff only), CourseProgressBar, the search
//   dropdown / sheet, the hover backdrops.
//
// ── Notes for whoever wires this ───────────────────────────────────────────────
//   • `courses/[slug]/` has NO loading.tsx, so today the detail page inherits
//     `courses/loading.tsx` (the catalog skeleton). Add
//     `courses/[slug]/loading.tsx` → <LumosCourseDetailSkeleton />.
//   • Colours: the detail page paints several blocks with inline hex (#faf9f5,
//     #e5e2d9). The skeleton uses tokens (bg-background, border) — geometry is
//     identical, only the shade differs for a frame.

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ---------------------------------------------------------------------------
// CourseCardSkeleton — course-card.tsx:85-158
// ---------------------------------------------------------------------------

function CourseCardSkeleton({
  compact = false,
  showGrade = false,
  className = "",
}: {
  /** Mirrors CourseCard `compact` (the "More" grid). */
  compact?: boolean
  /** Mirrors CourseCard `showGrade` (the search grid's eyebrow). */
  showGrade?: boolean
  /** Sizing from the context, e.g. the shelf's `w-40 shrink-0 sm:w-48`. */
  className?: string
}) {
  return (
    // Link `group block` (course-card.tsx:87)
    <div className={`block ${className}`} aria-hidden="true">
      {/* Image `relative aspect-video overflow-hidden rounded-xl` (:90) */}
      <Skeleton className="aspect-video w-full rounded-xl" />

      {/* Content `px-2 text-start` + compact spacing (:112-117) */}
      <div
        className={`px-2 text-start ${
          compact ? "space-y-1 pt-2" : "space-y-1.5 pt-3"
        }`}
      >
        {/* Eyebrow `text-xs` (:119-123) — only on lists spanning grades */}
        {showGrade ? (
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-14" />
          </div>
        ) : null}

        {/* Title `leading-tight whitespace-nowrap` text-xs|text-sm (:126-133)
            → 15px | 17.5px, always one line */}
        <Skeleton className={compact ? "h-[15px] w-4/5" : "h-[17.5px] w-4/5"} />

        {/* Type `text-[11px]` (inherits 1.5 → 16.5px) | `text-xs` 16px (:136-143) */}
        <Skeleton className={compact ? "h-[16.5px] w-1/2" : "h-4 w-1/2"} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LumosCoursesSkeleton — courses/content.tsx:264-401 (browse branch)
// ---------------------------------------------------------------------------

export function LumosCoursesSkeleton() {
  return (
    <div className="space-y-10 py-6" aria-busy="true">
      {/* Hero — content.tsx:267-301 */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-row items-center justify-center gap-4 md:gap-6">
          {/* Icon tile `size-20 md:size-32 rounded-xl` (:269) */}
          <Skeleton className="size-20 shrink-0 rounded-xl md:size-32" />
          <div className="min-w-0 text-start">
            {/* h1 font ladder (:288) so the em sizes below track it. Line 1 is
                1.1em (leading-[1.1]); the tagline is ≈0.855em at the same
                unitless 1.1 → 0.94em, after `mt-1`. Width 7.4em sits between
                the measured ar (7.14em) and en (7.66em) title widths. */}
            <div className="text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              <Skeleton className="h-[1.1em] w-[7.4em]" />
              <Skeleton className="mt-1 h-[0.94em] w-[7.4em]" />
            </div>
          </div>
        </div>
      </section>

      {/* Search bar, closed — content.tsx:304-310 → search-bar.tsx:468-583 */}
      <section>
        <div className="relative mx-auto w-full max-w-2xl">
          {/* `flex w-full items-center rounded-full border` + `bg-background`
              (:477-483). Real order is swapped with `order-*` when lang is ar
              (explore stays physically left, disc right) — mirrored with rtl:. */}
          <div className="border-input bg-background flex w-full items-center rounded-full border">
            {/* Explore `flex h-11 shrink-0 items-center gap-1 px-4` (:493-498) */}
            <div className="flex h-11 shrink-0 items-center gap-1 px-4 rtl:order-last">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="size-3 rounded-full" />
            </div>
            {/* Separator `bg-border w-px self-stretch` (:512) */}
            <div className="bg-border w-px self-stretch rtl:order-2" />
            {/* Input `h-11 w-full ps-4 pe-12` inside `relative flex flex-1
                items-center` (:517-555) */}
            <div className="relative flex flex-1 items-center rtl:order-1">
              <div className="flex h-11 w-full items-center ps-4 pe-12">
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            </div>
            {/* Submit disc `size-9 shrink-0 rounded-full` + `me-1` / ar
                `order-first ms-1` (:575-578) */}
            <Skeleton className="me-1 size-9 shrink-0 rounded-full rtl:order-first rtl:ms-1 rtl:me-0" />
          </div>
        </div>
      </section>

      {/* Grade badges — content.tsx:323-348.
          Pill `rounded-full px-3 py-1 text-sm` → 28px tall; a numeral is
          ~w-8 (1–9) / ~w-10 (10–12); the active one shows its ordinal word. */}
      <section className="flex flex-wrap items-center gap-2">
        {GRADES.map((g) => (
          <Skeleton
            key={g}
            className={`h-7 rounded-full ${
              g === 1 ? "w-16" : g >= 10 ? "w-10" : "w-8"
            }`}
          />
        ))}
      </section>

      {/* Shelves — content.tsx:351 */}
      <div className="space-y-10">
        {/* Lead card — continue-learning-card.tsx:73-137 */}
        <section>
          <div className="-mx-2 flex flex-wrap items-start gap-y-4 rounded-[8px] p-1 md:items-center md:py-2 md:ps-0 md:pe-[3px]">
            {/* Art column (:78-82) → 80px square phone, 120px md */}
            <div className="shrink-0 basis-[104px] px-3 md:basis-[144px]">
              <Skeleton className="aspect-square w-full rounded-[12px] md:max-w-[120px]" />
            </div>

            {/* Text column (:84) */}
            <div className="min-w-0 flex-1 px-2 text-start">
              {/* Kicker `mb-1 text-xs` (:89) */}
              <Skeleton className="mb-1 h-4 w-20" />

              {/* Title row (:93-102): h3 `text-base lg:text-xl lg:leading-8`
                  + Badge `px-2 py-0.5 text-xs` + border ≈ 22px */}
              <div className="mt-0 mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Skeleton className="h-6 w-40 max-w-full lg:h-8 lg:w-56" />
                <Skeleton className="h-[22px] w-16 shrink-0 rounded-full" />
              </div>

              {/* Chapter `mb-1 text-sm` (:105) */}
              <Skeleton className="mb-1 h-5 w-48 max-w-full" />

              {/* Lesson `mb-2 text-sm` (:109) */}
              <Skeleton className="mb-2 h-5 w-36 max-w-full" />

              {/* Byline over status (:117-134) */}
              <div className="flex flex-col gap-y-1.5">
                {/* Status `text-xs sm:text-sm` → 16 / 20px */}
                <Skeleton className="h-4 w-28 sm:h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Recommended shelf — course-shelf.tsx:52-78 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* h2 `text-lg font-semibold` → 28px */}
            <Skeleton className="h-7 w-28" />
          </div>
          {/* Scroller: `overflow-x-auto` → `overflow-hidden` for the frame */}
          <div className="no-scrollbar -mx-2 flex gap-4 overflow-hidden px-2 pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} className="w-40 shrink-0 sm:w-48" />
            ))}
          </div>
        </section>

        {/* "More" grid — content.tsx:380-399 (SeeMore omitted) */}
        <section className="space-y-3">
          {/* h2 `text-lg font-semibold` → 28px */}
          <Skeleton className="h-7 w-16" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <CourseCardSkeleton key={i} compact />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LumosCourseDetailSkeleton — courses/[slug]/content.tsx:149-577
// ---------------------------------------------------------------------------

export function LumosCourseDetailSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true">
      {/* Hero — [slug]/content.tsx:152-377 */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left column `space-y-6` (:155) — first in DOM, so above the art
              on phones */}
          <div className="space-y-6">
            {/* Breadcrumb `flex items-center gap-1.5 text-sm` (:157-176) */}
            <div className="flex items-center gap-1.5 text-sm">
              <Skeleton className="h-5 w-24" />
              <span className="text-muted-foreground" aria-hidden="true">
                /
              </span>
              <Skeleton className="h-5 w-16" />
            </div>

            {/* h1 `max-w-xs … text-2xl sm:max-w-sm sm:text-3xl lg:text-4xl`,
                one line (:180) → 32 / 36 / 40px */}
            <Skeleton className="h-8 w-40 max-w-xs sm:h-9 sm:w-52 sm:max-w-sm lg:h-10 lg:w-64" />

            {/* Description `text-base leading-relaxed` → 26px lines (:187-194).
                Measured: 4 lines at 390px, 2 at lg. */}
            {/* 16px bars + gap-2.5 + py-[5px] = n × 26px (flex gap, so no
                margin collapse; the lg:hidden line takes its gap with it) */}
            <div className="flex flex-col gap-2.5 py-[5px]">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-full lg:hidden" />
              <Skeleton className="h-4 w-1/2 sm:hidden" />
            </div>

            {/* CTA row `flex items-center gap-3` (:197-230): enrollment Button
                `h-9 px-6` rounded-md + FREE chip `h-9 rounded-md px-3` */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-14 rounded-md" />
            </div>

            {/* "Already registered? Sign in" `text-sm` (:242-254) */}
            <Skeleton className="h-5 w-44" />

            {/* Share row `flex items-center gap-4 pt-2` (:257-283):
                size-4 icon + text-sm → 20px */}
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>

          {/* Right column `space-y-0` (:287) */}
          <div className="space-y-0">
            {/* Art `relative aspect-video overflow-hidden rounded-t-lg` (:289-294) */}
            <Skeleton className="aspect-video w-full rounded-none rounded-t-lg" />

            {/* Stats `mt-8 flex items-center justify-center gap-6 border-t px-1
                pt-2 text-[11px]` (:324-374); the `text-[13px]` strong makes
                the line ≈20px. Real border colour is inline #e5e2d9. */}
            <div className="mt-8 flex items-center justify-center gap-6 border-t px-1 pt-2 text-[11px]">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* About — [slug]/content.tsx:380-461 */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="bg-muted/50 rounded-xl p-6 sm:p-8">
          {/* h2 `text-2xl sm:text-3xl` → 32 / 36px (:382-387) */}
          <Skeleton className="h-8 w-56 sm:h-9" />

          {/* p `mt-4 leading-relaxed` (base) → 26px lines (:388-395) */}
          <div className="mt-4 flex flex-col gap-2.5 py-[5px]">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Learning objectives `mt-8` (:398-426) */}
          <div className="mt-8">
            {/* h3 `text-lg` → 28px */}
            <Skeleton className="h-7 w-40" />
            {/* p `mt-2 text-sm` */}
            <Skeleton className="mt-2 h-5 w-64 max-w-full" />
            {/* ul `mt-3 list-disc space-y-1.5 ps-5`, li `text-sm` */}
            <div className="mt-3 space-y-1.5 ps-5">
              {["w-48", "w-56", "w-40", "w-52", "w-44", "w-36"].map((w, i) => (
                <Skeleton key={i} className={`h-5 max-w-full ${w}`} />
              ))}
            </div>
          </div>

          {/* Prerequisites `mt-8` (:429-443) */}
          <div className="mt-8">
            <Skeleton className="h-7 w-32" />
            <div className="mt-3 space-y-1.5 ps-5">
              <Skeleton className="h-5 w-full max-w-md" />
            </div>
          </div>

          {/* Who this course is for `mt-8` (:446-459) */}
          <div className="mt-8">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="mt-2 h-5 w-full max-w-md" />
          </div>
        </div>
      </section>

      {/* Chapters — [slug]/content.tsx:464-546 */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        {/* h2 `text-2xl sm:text-3xl` (:465-471) */}
        <Skeleton className="h-8 w-32 sm:h-9" />

        <div className="mt-6 flex gap-8">
          {/* Main `min-w-0 flex-1` → `space-y-8` (:475-476) */}
          <div className="min-w-0 flex-1">
            <div className="space-y-8">
              {[0, 1].map((ch) => (
                // Chapter `scroll-mt-24 space-y-2` (:480-484)
                <section key={ch} className="scroll-mt-24 space-y-2">
                  {/* h3 `text-lg` → 28px */}
                  <Skeleton className="h-7 w-44" />
                  {/* Lesson grid (:491) */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <LessonRowSkeleton key={i} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Sidebar `sticky top-24 hidden w-48 shrink-0 self-start lg:block`
              (:508-544) */}
          <aside className="sticky top-24 hidden w-48 shrink-0 self-start lg:block">
            {/* p `mb-2 text-sm font-semibold` */}
            <Skeleton className="mb-2 h-5 w-32" />
            <div className="relative">
              {/* Rail `absolute start-0 top-3 bottom-3 border-s` (:516-519) */}
              <span className="absolute start-0 top-3 bottom-3 border-s" />
              {/* Links `px-3 py-1.5 text-xs` → 28px each (:526) */}
              {["w-28", "w-24", "w-32", "w-20", "w-28"].map((w, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-2 px-3 py-1.5"
                >
                  <Skeleton className={`h-4 ${w}`} />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Sticky mobile CTA `sticky bottom-0 border-t p-4 lg:hidden`
          (:549-575). Real background is inline #faf9f5. */}
      <section className="bg-background sticky bottom-0 border-t p-4 lg:hidden">
        {/* Copied verbatim (:556). Note `rtl:flex-row-reverse` under an RTL
            root double-flips — kept so the frame matches the live bar. */}
        <div className="flex items-center justify-between gap-4 rtl:flex-row-reverse">
          <div>
            {/* FREE `font-semibold` (text-base → 24px) */}
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="flex-1">
            {/* CatalogEnrollmentButton `h-9 w-auto px-6` */}
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </section>
    </div>
  )
}

/** CourseLessonCard — [slug]/content.tsx:603-641 */
function LessonRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-md">
      {/* Thumb `relative h-18 w-18 shrink-0 overflow-hidden rounded-sm` */}
      <Skeleton className="h-18 w-18 shrink-0 rounded-sm" />
      {/* Text `min-w-0 flex-1 pt-1` */}
      <div className="min-w-0 flex-1 pt-1">
        {/* Title `line-clamp-2 text-sm leading-snug` → 19.25px lines */}
        <Skeleton className="h-[19.25px] w-11/12" />
        <Skeleton className="h-[19.25px] w-3/5" />
        {/* Duration `mt-0.5 text-xs` → 16px */}
        <Skeleton className="mt-0.5 h-4 w-12" />
      </div>
    </div>
  )
}

// =============================================================================
// LUMOS LESSON + CERTIFICATE — …/[lessonId], …/certificate
// =============================================================================

/**
 * DRAFT — loading skeletons for the lumos lesson player and the certificate.
 *
 * ── LumosLessonPlayerSkeleton ────────────────────────────────────────────────
 * Serves BOTH lesson routes with one tree:
 *   courses/[slug]/[lessonId]/page.tsx            (no layout of its own)
 *   (app)/dashboard/[slug]/[lessonId]/page.tsx    (under (app)/layout.tsx)
 * The two page.tsx files are identical apart from a comment. `(app)/layout.tsx`
 * renders `<div className="space-y-6"><LumosSectionNav/>{children}</div>` and
 * persists through loading, so the nav is NOT drawn here. `BreadcrumbTitle`
 * renders null (it feeds the header breadcrumb) and `LessonLiveStrip` renders
 * null unless a live session references the lesson today — both omitted.
 *
 * NOTE: the brief (and lumos/CLAUDE.md "The lesson hero is a shared frame")
 * say the hero box is `aspect-[4/5] sm:aspect-video`. That is STALE — see
 * dashboard/lesson/content.tsx:497-531: the hero now FLOWS (no aspect, no
 * overflow-hidden) and only the PLAYER is `aspect-video`. The height comes
 * from TitleCard's own frame plus the caller's
 * `className="sm:min-h-[85dvh]"` / `posterClassName="max-h-[calc(85dvh-10rem)] sm:max-h-none"`
 * (content.tsx:543-544). Initial state is `showHero = true` (content.tsx:183);
 * the player only mounts after Play. There is NO chapter/lesson sidebar on
 * this page.
 *
 * Mirrored, in order:
 *   1. Page root `data-immersive space-y-6 pt-2 pb-6` ........ content.tsx:491
 *      (`data-immersive` is load-bearing: (school-dashboard)/layout.tsx:174,188
 *      unpins the header and lifts `overflow-x-clip` on it — without it the
 *      escape margins clip and the header flips sticky→static on landing.
 *      Precedent: library/books/[id]/loading.tsx.)
 *   2. Hero wrapper, full-bleed escape margins, #1a1a1a ground  content.tsx:493-533
 *   3. TitleCard frame ....................... shared/title-card/title-card.tsx
 *      root :111 · poster :116 + phone fade :132 · top row :136 (ADD pill :275)
 *      stack :142 · band :152 (title :181, meta :196) · shelf :205
 *      (action row :206 / pill :325, description :226, chips :236 / :303 :308)
 *   4. "More from <course>" shelf ............ content.tsx:975-1023
 *      tile = shared/shelf-card/shelf-card.tsx `titleBelow` (:68-82, :150-158)
 *   5. Instructors row (one tile) ............ content.tsx:1026-1100
 *   6. Quiz card (2 questions + submit) ...... content.tsx:1103-1110, 1408-1466, 1493-1540
 *   7. Mint lesson-info card ................. content.tsx:1129-1188
 *
 * Omitted: InstructorSwitcher (only with >1 video, content.tsx:965), Resources
 * grid (:1191), prev/next nav (:1246), the About dialog and wishlist overlay
 * (closed at mount), the VideoPlayer (not the initial state). Also not
 * mirrorable server-side: `useOpenOnHero` (use-open-on-hero.ts) scrolls the
 * window to the hero's top after mount — positions match, only the scroll
 * moves. And the hero ground is `lesson.color`, unknown at load (colour
 * change, no shift).
 *
 * Line boxes: text with no explicit leading inherits preflight's 1.5
 * (`text-[15px]` → 22.5px, `text-[11px]` → 16.5px); `text-lg` → 28px;
 * `text-sm` → 20px; `leading-tight` at 15px → 18.75px.
 *
 * ── LumosCertificateSkeleton ─────────────────────────────────────────────────
 * Mirrors courses/[slug]/certificate/content.tsx:826-870. No global h1/h2/h3
 * rules exist (styles/typography.css is inline-utility only, no @plugin), so
 * bare headings and <p> are 16px/24px (`h-6`), `.muted` is 14px/20px (`h-5`),
 * and `<p><small>` stays 24px (the p's strut). CardContent `p-6 pt-0` +
 * `py-10` merges to px-6 py-10. Buttons are `size="sm"` → h-8 rounded-md.
 *
 * Neither `courses/[slug]/[lessonId]/` nor `courses/[slug]/certificate/` has a
 * loading.tsx today — both currently fall through to `courses/loading.tsx`
 * (the catalog grid skeleton).
 */

/** Skeleton tint over the pinned-dark hero, where `from-accent` would read as
 *  light bars on black. tailwind-merge in `cn` replaces the stops. */
const onDark = "from-white/15 via-white/5 to-white/15"

/** Skeleton tint on the mint card, which keeps one ground in both themes. */
const onMint = "from-black/10 via-black/5 to-black/10"

export function LumosLessonPlayerSkeleton() {
  return (
    // Page root — content.tsx:491
    <div data-immersive className="space-y-6 pt-2 pb-6">
      {/* Hero wrapper, showHero branch — content.tsx:493-533 */}
      <div
        className="relative ms-[calc(-0.5rem-var(--container-px,0px))] me-[calc(-0.5rem-var(--container-px,0px))] -mt-2 w-[calc(100%+1rem+2*var(--container-px,0px))] sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {/* TitleCard root + caller's sm:min-h-[85dvh] — title-card.tsx:111, content.tsx:543 */}
        <div
          className="relative flex w-full flex-col sm:block sm:min-h-[85dvh]"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          {/* Poster, 4:5 on a phone clamped to the viewport — title-card.tsx:116, content.tsx:544 */}
          <div className="relative aspect-[4/5] max-h-[calc(85dvh-10rem)] w-full shrink-0 overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto sm:h-full sm:max-h-none">
            {/* Phone-only fade the title sits in — title-card.tsx:132 */}
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/70 to-transparent sm:hidden" />
          </div>

          {/* Top row: empty start, `+ ADD` pill at end — title-card.tsx:136, :275 */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 sm:p-6">
            <div className="flex items-center gap-2" />
            <div className="flex items-center gap-2">
              <Skeleton className={`h-8 w-[4.75rem] rounded-full ${onDark}`} />
            </div>
          </div>

          {/* Identity stack — title-card.tsx:142 */}
          <div className="relative flex flex-1 flex-col sm:absolute sm:inset-x-0 sm:bottom-0 sm:flex-none sm:bg-gradient-to-t sm:from-black/90 sm:via-black/50 sm:to-transparent sm:pt-32">
            {/* The 80px band lifted 108px over the poster — title-card.tsx:152.
                The overlap is what fixes the hero's phone height; keep it exact. */}
            <div className="-mt-[108px] flex h-20 flex-col justify-end px-4 text-center sm:mt-0 sm:block sm:h-auto sm:px-6 sm:text-start">
              {/* h1: 52px/58px · sm 7xl leading-none · lg 8xl — title-card.tsx:181 */}
              <Skeleton
                className={`mx-auto h-[58px] w-3/4 shrink-0 sm:mx-0 sm:h-[72px] sm:w-[28rem] sm:max-w-full lg:h-24 lg:w-[36rem] ${onDark}`}
              />
              {/* Meta line: 15px (lh 22.5) · sm text-base (24) — title-card.tsx:196 */}
              <div className="mt-3 flex shrink-0 items-center justify-center gap-2 pb-1 sm:mt-2.5 sm:justify-start">
                <Skeleton
                  className={`h-[22.5px] w-44 sm:h-6 sm:w-52 ${onDark}`}
                />
              </div>
            </div>

            {/* The black shelf — title-card.tsx:205. Row order differs per
                breakpoint, so the order-* classes are copied verbatim. */}
            <div className="mt-4 flex flex-1 flex-col gap-4 bg-black px-4 pb-6 sm:mt-0 sm:flex-none sm:gap-0 sm:bg-transparent sm:px-6">
              {/* Action row: 42px rect full width · sm 40px pill — title-card.tsx:206, :325; content.tsx:683 */}
              <div className="order-1 flex items-center justify-center gap-3 sm:order-3 sm:mt-4 sm:justify-start">
                <Skeleton
                  className={`h-[42px] w-full rounded-[8px] sm:h-10 sm:w-40 sm:rounded-full ${onDark}`}
                />
              </div>

              {/* Description: line-clamp-3 at 20px; above sm the "… more" link
                  takes a 4th line — title-card.tsx:226, :401-429.
                  `text-[15px]` kept so `42ch` resolves to the same width. */}
              <div className="order-2 text-[15px] leading-[20px] sm:order-5 sm:mt-3 sm:max-w-[42ch]">
                <div className="flex h-5 items-center">
                  <Skeleton className={`h-3.5 w-full ${onDark}`} />
                </div>
                <div className="flex h-5 items-center">
                  <Skeleton className={`h-3.5 w-full ${onDark}`} />
                </div>
                <div className="flex h-5 items-center">
                  <Skeleton className={`h-3.5 w-2/3 ${onDark}`} />
                </div>
                <div className="hidden h-5 items-center sm:flex">
                  <Skeleton className={`h-3.5 w-12 ${onDark}`} />
                </div>
              </div>

              {/* Marks row: 4K solid, CC, AD — title-card.tsx:236, :303, :308
                  (boxed 17+4+2 = 23px · sm 21+4+2 = 27px). */}
              <div className="order-3 flex flex-wrap items-center gap-1.5 text-sm sm:order-1 sm:mt-2">
                <Skeleton
                  className={`h-[21px] w-7 rounded-[3px] sm:h-[25px] sm:w-8 sm:rounded ${onDark}`}
                />
                <Skeleton
                  className={`h-[23px] w-8 rounded-[3px] sm:h-[27px] sm:w-9 sm:rounded ${onDark}`}
                />
                <Skeleton
                  className={`h-[23px] w-8 rounded-[3px] sm:h-[27px] sm:w-9 sm:rounded ${onDark}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "More from <course>" — content.tsx:975-1023 */}
      <div className="space-y-3">
        {/* h2 text-lg → 28px line */}
        <Skeleton className="h-7 w-56" />
        {/* shelfScroller (shelf-card.tsx) with overflow-x-auto → overflow-hidden */}
        <div className="-mx-1 flex gap-3 overflow-hidden px-1 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            // ShelfCard titleBelow — shelf-card.tsx:68-82, :150-158
            <div key={i} className="relative w-60 shrink-0">
              <Skeleton className="aspect-[3/2] w-full rounded-lg" />
              <div className="pt-2">
                {/* eyebrow: text-[11px] → 16.5px */}
                <div className="flex h-[16.5px] items-center">
                  <Skeleton className="h-3 w-24" />
                </div>
                {/* title: 15px leading-tight, line-clamp-2 → 2 × 18.75px */}
                <div className="flex h-[18.75px] items-center">
                  <Skeleton className="h-3.5 w-full" />
                </div>
                <div className="flex h-[18.75px] items-center">
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructors — content.tsx:1026-1100 */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <div className="flex flex-wrap gap-3">
          {/* Tile: border + py-3 around a size-10 avatar and name/badge stack (66px) */}
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz — conditional on questions; content.tsx:1408-1466 */}
      <div className="bg-card text-card-foreground rounded-xl border">
        {/* CardHeader p-6 · CardTitle text-lg leading-none (18px) */}
        <div className="flex flex-col space-y-1.5 p-6">
          <Skeleton className="h-[18px] w-16" />
        </div>
        {/* CardContent p-6 pt-0 space-y-4 */}
        <div className="space-y-4 p-6 pt-0">
          {Array.from({ length: 2 }).map((_, q) => (
            // QuizQuestion — content.tsx:1494-1540
            <div key={q} className="space-y-2 rounded-lg border p-4">
              {/* stem: text-sm → 20px */}
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, c) => (
                  // choice: border + py-2 + 20px → 38px
                  <div
                    key={c}
                    className="flex h-[38px] w-full items-center rounded-md border px-3"
                  >
                    <Skeleton className="h-3.5 w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Submit — Button default h-9 w-full */}
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Mint lesson-info card — content.tsx:1129-1188 */}
      <section className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-[#9fe5b1] px-6 py-14 text-center sm:gap-9 sm:rounded-[56px] sm:px-12">
        <div className="flex w-full flex-col items-center">
          {/* chapter • course: text-2xl lh 1.5em (36) · sm 3xl (45) */}
          <div className="flex h-9 w-full items-center justify-center sm:h-[45px]">
            <Skeleton className={`h-6 w-2/3 max-w-sm sm:h-7 ${onMint}`} />
          </div>
          {/* lesson title: text-3xl lh 1.5em (45) · sm 4xl (54) */}
          <div className="flex h-[45px] w-full items-center justify-center sm:h-[54px]">
            <Skeleton className={`h-8 w-1/2 max-w-xs sm:h-9 ${onMint}`} />
          </div>
        </div>
        {/* duration: text-sm → 20px */}
        <Skeleton className={`h-5 w-32 ${onMint}`} />
        {/* Mark as Complete pill: h-11 px-9 rounded-full */}
        <Skeleton className={`h-11 w-52 rounded-full ${onMint}`} />
      </section>
    </div>
  )
}

export function LumosCertificateSkeleton() {
  return (
    // Page column — certificate/content.tsx:826
    <div className="mx-auto max-w-2xl py-10">
      {/* Card — ui/card.tsx; content.tsx:829 */}
      <div className="bg-card text-card-foreground rounded-xl border">
        {/* CardContent `p-6 pt-0` + `space-y-6 py-10 text-center` — content.tsx:830 */}
        <div className="space-y-6 px-6 py-10 text-center">
          {/* Award disc: size-16 rounded-full — :831-835 */}
          <div className="flex justify-center">
            <Skeleton className="size-16 rounded-full" />
          </div>

          {/* h1 title (24px) + .muted school name (20px) — :837-842 */}
          <div className="space-y-2">
            <Skeleton className="mx-auto h-6 w-56" />
            <Skeleton className="mx-auto h-5 w-36" />
          </div>

          {/* h3 learner (24px) — :844 */}
          <Skeleton className="mx-auto h-6 w-40" />

          {/* h2 subject title (24px) — :846 */}
          <Skeleton className="mx-auto h-6 w-52" />

          {/* Completed + certificate number: <p><small> keeps a 24px line — :848-860 */}
          <div className="space-y-1">
            <Skeleton className="mx-auto h-6 w-44" />
            <Skeleton className="mx-auto h-6 w-60" />
          </div>

          {/* Download + All Courses: Button size sm (h-8 rounded-md) — :862-869 */}
          <div className="flex justify-center gap-2 pt-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LUMOS (app) SURFACES + PAYMENT — dashboard, enrollments, instructors, review, videos
// =============================================================================

/**
 * Loading skeletons for the lumos (app) surfaces + payment return pages.
 *
 * Every (app) route renders inside `lumos/(app)/layout.tsx`
 * (`<div className="space-y-6"><LumosSectionNav/>{children}</div>`). That
 * layout PERSISTS while a route's loading.tsx shows, so none of these draw the
 * heading / PageNav tab strip — only what each page's children render.
 *
 * Data facts used for empty-vs-populated (read-only psql on the local DB, which
 * the prod demo was copied from on 2026-09-11): demo school has 34 `enrollments`,
 * 130 active subject selections, the demo student has 1 enrollment, and
 * `lesson_videos` has ZERO rows in the whole database (the catalog video seed
 * `prisma/seeds/catalog/videos.ts` is only reachable via `single.ts`, not the
 * default seed path).
 *
 * ---------------------------------------------------------------------------
 * LumosDashboardSkeleton
 *   Mirrors the ADMIN branch: (app)/dashboard/page.tsx:197-227
 *     → settings/overview.tsx (4 stat Cards in `grid gap-4 md:grid-cols-2
 *       lg:grid-cols-4`, then the "Recent courses" CourseCarousel)
 *     → shared/course-carousel.tsx + ui/carousel.tsx (CarouselContent/Item)
 *   Role choice: STAFF. loading.tsx cannot see the session, and the only way
 *   into this route is the "Dashboard" tab, which getTabsForRole
 *   (permissions.ts:54) shows to video-managing roles only — students get no
 *   tab strip at all. Teachers open on an h1 row + the same 4-up stats
 *   (teach/overview-content.tsx:37), so the stats grid fits both staff roles.
 *   The trailing enrolled-courses strip (page.tsx:215, only when the admin
 *   has enrollments) sits below the fold and is omitted.
 *
 * LumosEnrollmentsSkeleton
 *   Mirrors: components/lumos/settings/enrollments/content.tsx:64-82
 *     → school-dashboard/shared/platform-toolbar.tsx:293-374 (search only —
 *       no facets: `student` is variant "text", other columns have no variant;
 *       view toggle off; view-options button is `hidden lg:flex`)
 *     → components/table/data-table.tsx:75-172 + ui/table.tsx (th h-10 px-2,
 *       td p-2, rows border-b) + data-table-load-more.tsx:39 (empty p-1 div)
 *     → settings/enrollments/columns.tsx:36-126 (6 columns; Status is a Badge,
 *       22px, which sets the row at 38px + border)
 *   Populated (demo has 34 rows; all render since pageSize = rows.length);
 *   12 rows drawn for the fold. Real <table> markup so column widths and
 *   horizontal overflow behave like the real table on phones.
 *
 * LumosInstructorsSkeleton
 *   Mirrors: components/lumos/settings/instructor-settings.tsx:142-152 (EMPTY
 *   state: `flex min-h-[400px] items-center justify-center` + one 16px/24px
 *   line). Empty because the roster is built from published videos and
 *   `lesson_videos` is empty; the populated shape (lock row :157 + table :206)
 *   would be the right mirror once videos exist.
 *
 * LumosReviewSkeleton
 *   Mirrors: components/lumos/settings/video-review-content.tsx:52-62 (EMPTY
 *   state card). Same reason: `getSubmittedVideos` reads `lesson_videos`,
 *   which has no rows for any school.
 *
 * LumosVideosSkeleton
 *   Mirrors: components/lumos/teach/videos-content.tsx:147-181
 *     stats grid :148-160 (always rendered; CardContent p-6 + pt-4, 24px icon,
 *       text-xl 28px + text-xs 16px)
 *     toolbar :162-172 (search + 2 dashed facet buttons for the multiSelect
 *       Status/Visibility columns in videos-columns.tsx:133,162; view-options
 *       `hidden lg:flex`; upload trigger propose-video-dialog.tsx:899
 *       `h-8 w-8 rounded-full` — demo has 130 selections so the dialog renders)
 *     table :174 → 9 columns (videos-columns.tsx:45-240), EMPTY body = one
 *       `h-24` no-results row (data-table.tsx:149-156), since the demo admin
 *       owns 0 videos; empty load-more p-1
 *     ownership note :177 (text-xs, 2 lines on phones, 1 from sm)
 *   Facet / view-options widths are measured estimates (px-2.5 + 16px icon +
 *   gap-1.5 + label), not copied classes — the real buttons are content-sized.
 *
 * LumosPaymentSkeleton
 *   Mirrors: components/lumos/payment/success-content.tsx:120-161 (success
 *   state: w-[400px], CardContent pt-6, 2 buttons) — default.
 *   `variant="cancel"` mirrors payment/cancel-content.tsx:19-44 (w-[350px],
 *   CardContent WITHOUT pt-6, 1 button). The cancel route's loading.tsx should
 *   pass it; success/loading.tsx can keep calling it bare.
 *   Fixes vs the old skeleton in lumos/loading.tsx:689: `mt-3 sm:mt-5` (was
 *   mt-5), title h-7 = text-xl line box (was h-6), description two 20px lines
 *   (was one h-4), buttons h-9 = buttonVariants default (were h-10).
 *   Omitted: the no-session / verification-failed states (one button).
 * ---------------------------------------------------------------------------
 */

// =============================================================================
// Shared pieces
// =============================================================================

/** components/lumos/shared/course-carousel.tsx — COURSE_SLIDE_BASIS + ui/carousel item */
const SLIDE_CLASS =
  "min-w-0 shrink-0 grow-0 basis-full ps-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/5"

function CourseCarouselSkeleton() {
  return (
    // <Carousel className="w-full"> → "relative w-full"
    <div className="relative w-full">
      {/* Heading row — course-carousel.tsx:52 */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* h2 typographyVariants.cardTitle: text-lg leading-none = 18px */}
          <Skeleton className="h-[18px] w-36" />
        </div>
      </div>

      {/* CarouselContent — overflow-hidden > flex -ms-4 */}
      <div className="overflow-hidden">
        <div className="-ms-4 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={SLIDE_CLASS}>
              {/* Link.group.block > image box */}
              <div className="block">
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                {/* Caption — content.tsx:142 */}
                <div className="space-y-1 px-1 pt-3">
                  {/* h3 text-sm → 20px */}
                  <Skeleton className="h-5 w-3/4" />
                  {/* p text-xs → 16px */}
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** platform-toolbar.tsx:293 — Toolbar "flex w-full items-center gap-2" + "flex-wrap p-1" */
function ToolbarShell({ start, end }: { start: ReactNode; end: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 p-1">
      {/* ToolbarGroup — atom/toolbar.tsx:66 */}
      <div className="flex flex-wrap items-center gap-2">{start}</div>
      <div className="flex flex-wrap items-center gap-2">{end}</div>
    </div>
  )
}

/** Search input — platform-toolbar.tsx:303 "h-9 w-40 ps-8 lg:w-56" (Input rounded-md) */
function ToolbarSearchSkeleton() {
  return <Skeleton className="h-9 w-40 rounded-md lg:w-56" />
}

/** DataTableViewOptions trigger — data-table-view-options.tsx:79 "hidden h-9 lg:flex" */
function ViewOptionsSkeleton() {
  return <Skeleton className="hidden h-9 w-[94px] rounded-md lg:block" />
}

/** ui/table.tsx TableHead classes */
const TH = "h-10 px-2 text-start align-middle whitespace-nowrap"
/** ui/table.tsx TableCell classes */
const TD = "p-2 align-middle whitespace-nowrap"

/** data-table.tsx:161 + data-table-load-more.tsx:39 — empty load-more strip (hasMore=false) */
function LoadMoreShell() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex w-full items-center justify-center gap-4 overflow-auto p-1" />
    </div>
  )
}

// =============================================================================
// /lumos/dashboard — staff overview (stats + recent courses)
// =============================================================================

export function LumosDashboardSkeleton() {
  return (
    // page.tsx:206 → overview.tsx:76
    <div className="space-y-12">
      <div className="space-y-8">
        {/* Stat cards — overview.tsx:79 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              {/* CardTitle text-sm keeps a 20px line (measured) beside a size-4 icon */}
              <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                <div className="flex h-5 items-center">
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="size-4" />
              </div>
              <CardContent>
                {/* text-2xl font-bold → 32px line */}
                <div className="flex h-8 items-center">
                  <Skeleton className="h-6 w-16" />
                </div>
                {/* text-xs → 16px line */}
                <div className="flex h-4 items-center">
                  <Skeleton className="h-3 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* "Recent courses" — overview.tsx CourseCarousel */}
        <CourseCarouselSkeleton />
      </div>
    </div>
  )
}

// =============================================================================
// /lumos/enrollments — toolbar + 6-column DataTable (populated)
// =============================================================================

export function LumosEnrollmentsSkeleton() {
  // Per-column cell widths: student, email, subject, status badge, completed, enrolled
  const cells = ["w-28", "w-40", "w-24", "badge", "w-16", "w-20"] as const

  return (
    // enrollments/content.tsx:64
    <div className="space-y-6">
      <ToolbarShell
        start={<ToolbarSearchSkeleton />}
        end={<ViewOptionsSkeleton />}
      />

      {/* DataTable — data-table.tsx:75 */}
      <div className="flex w-full flex-col gap-2.5">
        <div className="overflow-x-auto rounded-md">
          {/* ui/table.tsx Table wrapper */}
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b">
                  {cells.map((_, i) => (
                    <th key={i} className={TH}>
                      {/* DataTableColumnHeader trigger: h-8, label 20px */}
                      <Skeleton className="h-4 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {Array.from({ length: 12 }).map((_, r) => (
                  <tr key={r} className="border-b">
                    {cells.map((w, c) => (
                      <td key={c} className={TD}>
                        {w === "badge" ? (
                          // Badge: text-xs + py-0.5 + border = 22px, rounded-full
                          <Skeleton className="h-[22px] w-16 rounded-full" />
                        ) : (
                          // text-sm cell → 20px line box
                          <Skeleton className={`h-5 ${w}`} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <LoadMoreShell />
      </div>
    </div>
  )
}

// =============================================================================
// /lumos/instructors — empty roster (no published videos yet)
// =============================================================================

export function LumosInstructorsSkeleton() {
  return (
    // instructor-settings.tsx:144
    <div className="flex min-h-[400px] items-center justify-center">
      {/* p.text-muted-foreground — base 16px/24px, one line */}
      <Skeleton className="h-6 w-72 max-w-full" />
    </div>
  )
}

// =============================================================================
// /lumos/review — empty submission feed card
// =============================================================================

export function LumosReviewSkeleton() {
  return (
    // video-review-content.tsx:54
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {/* CheckCircle2 size-12 mb-4 */}
        <Skeleton className="mb-4 size-12 rounded-full" />
        {/* p text-sm → 20px */}
        <Skeleton className="h-5 w-48" />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// /lumos/videos — stats + toolbar + 9-column DataTable (empty) + note
// =============================================================================

export function LumosVideosSkeleton() {
  return (
    // videos-content.tsx:147
    <div className="space-y-6">
      {/* Stats — videos-content.tsx:148 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 pt-4">
              {/* lucide icon, default 24px */}
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <div>
                {/* p text-xl font-bold → 28px */}
                <Skeleton className="h-7 w-10" />
                {/* p text-xs → 16px */}
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PlatformToolbar — videos-content.tsx:162 */}
      <ToolbarShell
        start={
          <>
            <ToolbarSearchSkeleton />
            {/* DataTableFacetedFilter triggers — "h-9 border-dashed" (Status, Visibility) */}
            <Skeleton className="h-9 w-[76px] rounded-md" />
            <Skeleton className="h-9 w-[78px] rounded-md" />
          </>
        }
        end={
          <>
            <ViewOptionsSkeleton />
            {/* ProposeVideoDialog trigger — "h-8 w-8 rounded-full p-0" */}
            <Skeleton className="size-8 rounded-full" />
          </>
        }
      />

      {/* DataTable — videos-content.tsx:174 */}
      <div className="flex w-full flex-col gap-2.5">
        <div className="overflow-x-auto rounded-md">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b">
                  {/* title, subject, lesson, status, visibility, pricing, views, date */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <th key={i} className={TH}>
                      <Skeleton className="h-4 w-14" />
                    </th>
                  ))}
                  {/* actions column has no header */}
                  <th className={TH} />
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                <tr className="border-b">
                  {/* No-results row — data-table.tsx:151 "h-24 text-center" */}
                  <td colSpan={9} className={`${TD} h-24 text-center`}>
                    <Skeleton className="mx-auto h-5 w-24" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <LoadMoreShell />
      </div>

      {/* Ownership note — videos-content.tsx:177, text-xs centered */}
      <div className="flex flex-col items-center">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-2/3 sm:hidden" />
      </div>
    </div>
  )
}

// =============================================================================
// /lumos/payment/{success,cancel} — centered confirmation card
// =============================================================================

export function LumosPaymentSkeleton({
  variant = "success",
}: {
  variant?: "success" | "cancel"
} = {}) {
  const isCancel = variant === "cancel"

  return (
    // success-content.tsx:121 / cancel-content.tsx:19
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className={isCancel ? "w-[350px]" : "w-[400px]"}>
        {/* success: CardContent pt-6; cancel: default p-6 pt-0 */}
        <CardContent className={isCancel ? undefined : "pt-6"}>
          {/* Check / X icon — size-12 */}
          <div className="flex w-full justify-center">
            <Skeleton className="size-12 rounded-full" />
          </div>
          <div className="mt-3 w-full text-center sm:mt-5">
            {/* h2 text-xl → 28px */}
            <Skeleton className="mx-auto h-7 w-48" />
            {/* p text-sm mt-2 — two 20px line boxes = 40px, drawn as 18+4+18 so the bars read as separate lines */}
            <div className="mt-2 flex flex-col items-center space-y-1">
              <Skeleton className="h-[18px] w-full" />
              <Skeleton className="h-[18px] w-3/4" />
            </div>
            {isCancel ? (
              // "Browse Courses" — buttonVariants mt-5 w-full (h-9)
              <Skeleton className="mt-5 h-9 w-full rounded-md" />
            ) : (
              // "Start Learning" + "Go to Dashboard" — mt-5 space-y-2
              <div className="mt-5 space-y-2">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// LUMOS COURSE SLUG — minimal centred loader (the page redirects to its first
// lesson)
// =============================================================================

export function LumosCourseSlugSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-foreground/20 border-t-foreground size-8 animate-spin rounded-full border-2" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-5 w-36" />
          <Skeleton className="mx-auto h-4 w-52" />
        </div>
      </div>
    </div>
  )
}
