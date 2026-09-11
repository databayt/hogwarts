"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  Loader2,
  Lock,
  Play,
  Plus,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { enqueue } from "@/lib/offline/outbox"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type {
  AvailableVideo,
  LessonWithProgress,
} from "@/components/lumos/data/catalog/get-lesson-with-progress"
import { InstructorSwitcher } from "@/components/lumos/lesson/instructor-switcher"
import type {
  LessonQuizQuestion,
  LessonQuizResult,
  LessonQuizVerdict,
} from "@/components/lumos/lib/lesson-quiz"
import { MaterialViewerTrigger } from "@/components/lumos/shared/material-viewer/material-viewer"
import { ShelfCard, shelfScroller } from "@/components/lumos/shared/shelf-card"
import {
  TitleCard,
  titleCardChip,
  titleCardChipSolid,
  TitleCardDescription,
  titleCardPill,
  titleCardTopPill,
} from "@/components/lumos/shared/title-card"
import {
  VideoPlayer,
  type VideoPlayerLabels,
  type VideoProgress,
} from "@/components/lumos/shared/video-player"
import { purchaseVideo } from "@/components/lumos/video/video-purchase-actions"

import {
  markLessonComplete,
  markLessonIncomplete,
  updateLessonProgress,
} from "./catalog-actions"
import { submitLessonQuiz } from "./quiz-actions"

interface LumosLessonContentProps {
  dictionary: Record<string, unknown>
  lang: string
  schoolId: string | null
  subdomain: string
  lesson: LessonWithProgress
  /**
   * Answer-key-free questions from `getLessonContent`. The correct option and
   * any explanation arrive only in the graded response — they used to ship
   * with the question, which made a gradebook-bound score self-serve.
   */
  quizQuestions?: LessonQuizQuestion[]
  /**
   * Who is watching. Feeds the forensic watermark on the MATERIAL viewer —
   * the lesson's own video player no longer carries one. Renders nothing at
   * all when this is absent.
   */
  viewer?: { id: string; email: string | null }
}

// When a lesson has no playable video of its own (no approved lesson video, or
// the selected instructor video is paid+unpurchased), fall back to the
// marketing "story" video so the player surface is never empty. This is the
// same clip shown on the public SaaS marketing page (saas-marketing/
// story-section.tsx) and the docs story video.
//
// Until real lesson videos are uploaded this is what EVERY lesson plays: the
// catalog carries no approved video rows, so every lesson takes this branch.
// The moment a real video lands for a lesson, that lesson plays it instead —
// this is a fallback, not a hard-wire, which is why it stays here rather than
// replacing the resolution above.
//
// A full CDN URL rather than `asset()`: that helper flattens any path to its
// bare file name (`/media/story.mp4` → `hogwarts/story.mp4`), and the flat key
// is served `application/octet-stream` while this one is served `video/mp4`.
// Chromium plays either; a `<video>` source is exactly where a wrong MIME type
// is worth not betting on. `asset()`'s own docs call out grouped assets moving
// to a full URL like this.
const FALLBACK_VIDEO_URL = `https://${
  process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim() || "cdn.databayt.org"
}/hogwarts/media/story.mp4`

export function LumosLessonContent({
  dictionary,
  lang,
  schoolId,
  lesson,
  quizQuestions,
  viewer,
}: LumosLessonContentProps) {
  const router = useRouter()
  // The page passes the `lumos` subtree (dictionary.lumos) as `dictionary`,
  // so descend a single level here — NOT `?.lumos?.lesson` (that double-nest
  // bug left ~45 player strings rendering English fallbacks on every tenant).
  const d = (dictionary as Record<string, any>)?.lesson
  // Instructor video source labels (localized).
  const sourceLabels: Record<AvailableVideo["source"], string> = {
    "own-school": d?.yourSchool || "Your School",
    featured: d?.featured || "Featured",
    "other-school": d?.community || "Community",
  }
  // VideoPlayer + VideoUpNext display strings. chapterShort/lessonShort are
  // REUSED from `dictionary.lesson` (the same keys used a few lines below for
  // the hero's own "C1 L2" badge) rather than duplicated under videoPlayer —
  // everything else is new (lumos.videoPlayer namespace).
  const vp = (dictionary as Record<string, any>)?.videoPlayer
  const off = (dictionary as Record<string, any>)?.offline
  const viewerLabels = (dictionary as Record<string, any>)?.viewer
  // Downloadable resources = legacy attachments + catalog lesson materials
  // (worksheets/notes contributed by schools or the platform).
  const resourceCount = lesson.attachments.length + lesson.materials.length
  const playerLabels: VideoPlayerLabels = {
    play: vp?.play,
    pause: vp?.pause,
    rewind: vp?.rewind,
    forward: vp?.forward,
    pictureInPicture: vp?.pictureInPicture,
    share: vp?.share,
    copyLink: vp?.copyLink,
    airdrop: vp?.airdrop,
    messages: vp?.messages,
    notes: vp?.notes,
    reminders: vp?.reminders,
    volume: vp?.volume,
    speed: vp?.speed,
    mute: vp?.mute,
    unmute: vp?.unmute,
    chapterShort: d?.chapterShort,
    lessonShort: d?.lessonShort,
    upNext: vp?.upNext,
    playNow: vp?.playNow,
    cancelAutoPlay: vp?.cancelAutoPlay,
    keyboardHint: vp?.keyboardHint,
    minUnit: vp?.minUnit,
    hourUnit: vp?.hourUnit,
    minuteUnit: vp?.minuteUnit,
  }
  const [showHero, setShowHero] = useState(true)
  // Play opens the player straight into fullscreen; leaving fullscreen brings
  // the poster back, so the lesson page is what the viewer comes out onto
  // rather than a stranded inline video. Only the Play pill sets this — an
  // instructor switch further down the page just swaps the source in place.
  const [openFullscreen, setOpenFullscreen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const pendingProgressRef = useRef<Promise<void> | null>(null)

  // The page opens ON the hero, not above it.
  //
  // The lesson is what the reader came for, and the chrome over it — the
  // header, the row's own `pt-6` — is about 72px of app furniture between them
  // on arrival. So the page lands scrolled to the poster's own top edge, which
  // is the reference app's opening frame; the header is one short scroll up,
  // where anyone looking for it already scrolls.
  //
  // MEASURED, not computed: the offset above the hero is the header plus the
  // layout's padding plus whatever the live strip and the offline banner
  // decided to render today, and any constant here would be wrong the first
  // time one of them appears.
  useEffect(() => {
    if (!showHero) return
    const el = heroRef.current
    if (!el) return
    // A restored position — back/forward, a reload part-way down — is the
    // reader's own and outranks this.
    if (window.scrollY !== 0) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (top <= 0) return
    // `instant`: this is where the page STARTS, not somewhere it travels to.
    window.scrollTo({ top, behavior: "instant" })
  }, [lesson.id, showHero])
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false
  )
  const [isPending, startTransition] = useTransition()

  // Multi-instructor video toggle
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    lesson.availableVideos[0]?.id ?? null
  )
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showDescDialog, setShowDescDialog] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [wishlistDialog, setWishlistDialog] = useState<
    "added" | "removed" | null
  >(null)
  // The real video's source failed to load (dead URL, bad codec) — swap in the
  // marketing fallback clip rather than leaving a black player.
  const [sourceFailed, setSourceFailed] = useState(false)
  const [isPurchasePending, startPurchaseTransition] = useTransition()

  // Auto-dismiss wishlist overlay after 1.5s
  useEffect(() => {
    if (!wishlistDialog) return
    const timer = setTimeout(() => setWishlistDialog(null), 1500)
    return () => clearTimeout(timer)
  }, [wishlistDialog])

  const activeVideo = useMemo(
    () => lesson.availableVideos.find((v) => v.id === activeVideoId) ?? null,
    [lesson.availableVideos, activeVideoId]
  )

  // Resolve the current video URL — prefer the selected instructor video, then
  // the lesson default. When the lesson has NO videos at all — or the real
  // video's source failed to load — fall back to the marketing story clip so
  // the surface is never empty. We deliberately do NOT fall back when videos
  // exist but are paywalled (paid + unpurchased) — that must keep the
  // locked/purchase UX, not play a marketing clip.
  const lessonVideoUrl = activeVideo?.videoUrl ?? lesson.videoUrl
  const isFallbackVideo = lesson.availableVideos.length === 0
  // Any fallback playback (no videos, or broken source) must never write
  // lesson watch-progress or auto-complete.
  const playingFallback = isFallbackVideo || sourceFailed
  const currentVideoUrl = sourceFailed
    ? FALLBACK_VIDEO_URL
    : (lessonVideoUrl ?? (isFallbackVideo ? FALLBACK_VIDEO_URL : null))

  // Paid + unpurchased selected video → the server sent no URL. Surface a
  // purchase CTA (the InstructorSwitcher only renders with 2+ videos, so a
  // lone paid video would otherwise be a dead end with a disabled Play).
  const lockedVideo =
    activeVideo && activeVideo.requiresPayment && !activeVideo.hasPurchased
      ? activeVideo
      : null

  const baseUrl = `/${lang}/lumos/courses/${lesson.chapter.course.slug}`

  const handleUnlock = useCallback(
    (videoId: string) => {
      startPurchaseTransition(async () => {
        const result = await purchaseVideo(videoId)
        if (result.status === "success" && result.checkoutUrl) {
          window.location.href = result.checkoutUrl
          return
        }
        toast.error(
          result.message ?? d?.purchaseFailed ?? "Failed to start purchase"
        )
      })
    },
    [d?.purchaseFailed]
  )

  // A new instructor selection gets a fresh chance at its real source.
  const handleSwitchVideo = useCallback((videoId: string) => {
    setSourceFailed(false)
    setActiveVideoId(videoId)
  }, [])

  const handleSourceError = useCallback(() => {
    // If the fallback clip itself fails there is nothing further to swap in.
    if (playingFallback) return
    setSourceFailed(true)
  }, [playingFallback])

  const handleToggleComplete = () => {
    startTransition(async () => {
      try {
        if (isCompleted) {
          const result = await markLessonIncomplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(d?.failedToUpdateProgress || result.message)
            return
          }
          setIsCompleted(false)
          toast.success(d?.markedIncomplete || "Marked as incomplete")
        } else {
          const result = await markLessonComplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(d?.failedToUpdateProgress || result.message)
            return
          }
          setIsCompleted(true)
          toast.success(d?.markedComplete || "Marked as complete!")
        }
      } catch {
        toast.error(d?.failedToUpdateProgress || "Failed to update progress")
      }
    })
  }

  // Save video progress for resume functionality. Skip when playing the
  // marketing fallback — it isn't this lesson's content, so it must not write
  // watch progress.
  const handleProgress = useCallback(
    (progress: VideoProgress) => {
      if (playingFallback) return
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        // No connection: keep the newest position on the device; the outbox
        // replays it (and the completion it implies) when one returns.
        void enqueue({
          kind: "progress",
          coalesceKey: `progress:${lesson.id}`,
          payload: {
            lessonId: lesson.id,
            watchedSeconds: Math.floor(progress.watchedSeconds),
            totalSeconds: Math.floor(progress.duration),
          },
        })
        return
      }
      // The server owns the completion rule (watched-through, see
      // lib/progress-core.ts) — reflect its verdict rather than waiting for
      // the <video> element's unreliable `ended`.
      // Held so the fullscreen exit can wait for it: the poster's resume pill
      // reads `lesson.progress` from the server, and refreshing while this
      // write is still in flight paints the position from before the watch.
      pendingProgressRef.current = updateLessonProgress({
        lessonId: lesson.id,
        watchedSeconds: Math.floor(progress.watchedSeconds),
        totalSeconds: Math.floor(progress.duration),
      })
        .then((r) => {
          if (r.status === "success" && r.completed) setIsCompleted(true)
        })
        .catch(() => {
          /* a lost heartbeat is recaptured by the next one */
        })
    },
    [lesson.id, playingFallback]
  )

  // Auto-mark complete when video finishes
  const handleVideoComplete = useCallback(() => {
    if (isCompleted) return
    // The marketing fallback clip must not auto-complete a real lesson; the
    // student can still mark it complete manually.
    if (playingFallback) return

    startTransition(async () => {
      try {
        const result = await markLessonComplete(
          lesson.id,
          lesson.chapter.course.slug
        )
        if (result.status === "error") {
          toast.error(d?.failedToComplete || result.message)
          return
        }
        setIsCompleted(true)
        toast.success(d?.lessonCompleted || "Lesson completed!")
      } catch {
        toast.error(d?.failedToComplete || "Failed to mark lesson as complete")
      }
    })
  }, [isCompleted, playingFallback, lesson.id, lesson.chapter.course.slug])

  // Press Play → the poster gives way to the player, which opens fullscreen
  // and starts playing. Both Play pills (fresh lesson, and part-watched with
  // its progress bar) run this.
  const handlePlay = useCallback(() => {
    if (!currentVideoUrl) return
    setAutoPlay(true)
    setOpenFullscreen(true)
    setShowHero(false)
  }, [currentVideoUrl])

  // Coming out of fullscreen lands back on the lesson page — the same URL,
  // the poster and its "continue watching" pill. `router.refresh()` is what
  // makes that pill honest: its bar reads `lesson.progress` from the server,
  // and the position just watched was written by a server action the client
  // tree knows nothing about.
  const handleFullscreenChange = useCallback(
    (isFullscreen: boolean) => {
      if (isFullscreen) return
      setAutoPlay(false)
      setOpenFullscreen(false)
      setShowHero(true)
      // AFTER the position the player just flushed has landed — the player
      // fires that write on its way out of fullscreen, and refreshing
      // alongside it reads the row as it was before the watch.
      const pending = pendingProgressRef.current
      if (pending) void pending.finally(() => router.refresh())
      else router.refresh()
    },
    [router]
  )

  // Handle auto-play next lesson
  const handleNextLesson = useCallback(() => {
    if (lesson.nextLesson) {
      router.push(`${baseUrl}/${lesson.nextLesson.id}`)
    }
  }, [lesson.nextLesson, baseUrl, router])

  // Prepare next lesson data for video player
  const nextLessonData = lesson.nextLesson
    ? {
        id: lesson.nextLesson.id,
        title: lesson.nextLesson.title,
        chapterTitle: lesson.chapter.title,
        duration: undefined,
      }
    : null

  // Get initial position for resume (from server)
  const initialPosition = lesson.progress?.watchedSeconds ?? 0

  // The frame's button does not just say "Play" — it says `Play S2, E1`,
  // naming the episode it is about to open. A lesson's equivalent is the
  // chapter and lesson it sits at, which the info line above already prints in
  // the same shorthand. The live room draws the identical button from the same
  // shared card, so the two say the same kind of thing.
  //
  // The label also stays put once there is progress, where the frame drops it:
  // that leaves the pill saying nothing about what it does, and here it is the
  // only way into the lesson.
  const playLabel = (d?.playAt || "Play {c}{cn}, {l}{ln}")
    .replace("{c}", d?.chapterShort || "C")
    .replace("{cn}", String(lesson.chapter.position))
    .replace("{l}", d?.lessonShort || "L")
    .replace("{ln}", String(lesson.position))

  // The info line, built the way the live room's card builds its own.
  //
  // THREE facts, like the frame's "Documentary · Jun 27, 2021 · 30 min TV+" —
  // what kind of thing this is, when it is from, how long it runs. The room
  // reads them as grade · start time · duration; a lesson has no clock, so its
  // middle fact is the year.
  //
  // What is NOT here is the point. This line used to open with "C1 L2", which
  // the button underneath already says, and then name the course and the
  // chapter, which is three more items on a line the frame keeps to one. The
  // room hit the same wall and moved its chapter and lesson into the
  // PARAGRAPH, where the frame puts its narrator; the course and chapter go
  // there for the same reason, in `heroBlurb` below.
  const gradeLabel =
    lesson.chapter.course.grades.length > 0
      ? `${d?.grade || "Grade"} ${lesson.chapter.course.grades
          .map((g) => gradeWord(g, lang))
          .join(" / ")}`
      : null
  const heroMeta = [
    gradeLabel,
    lesson.year ? String(lesson.year) : null,
    formatDuration(lesson.duration, lesson.videoDuration) || null,
  ].filter((part): part is string => Boolean(part))

  // The paragraph under the button, in the room's own shape: the facts that
  // place the thing first, then what it is actually about. The room reads
  // "Taught by X. <chapter> · <lesson> <synopsis>"; a lesson has no teacher of
  // its own, so it opens on the course and chapter the meta line handed over.
  // Joined by a plain space, exactly as the room joins its parts.
  const heroBlurb = [
    [lesson.chapter.course.title, lesson.chapter.title]
      .filter(Boolean)
      .join(" · ") || null,
    lesson.description ||
      lesson.chapter.course.description ||
      d?.exploreLesson ||
      "Explore this lesson and discover new concepts.",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    /* `data-immersive` — read by the school-dashboard layout, which unpins the
       header and lets the container stop clipping so the hero below can reach
       the page edges. On the page ROOT rather than on the hero, so pressing
       Play does not pop a sticky bar back over the player. */
    <div data-immersive className="space-y-6 pt-2 pb-6">
      {/* Hero / Video Player */}
      <div
        ref={heroRef}
        className={cn(
          "relative w-full",
          // The HERO flows; the PLAYER is a 16:9 box.
          //
          // The hero used to be a box too — `aspect-[4/5] sm:aspect-video`
          // with `overflow-hidden`, the card `absolute inset-0` inside it —
          // and that is a different shape from the card it holds. The card's
          // phone layout is a poster with a stack FLOWING under it, so a
          // parent that fixes the height cuts the stack off at the poster's
          // foot: on a 390px screen the Play button was sliced in half and
          // the mark row was gone entirely. The live room, drawing the same
          // card, never had this because it never wrapped it.
          //
          // So the hero takes the height its content needs, and only the
          // player keeps a ratio — a taller box would letterbox the video.
          //
          // Full-bleed, the way the room's own layout does it: the artwork is
          // the page here, and a card inset from the page ground reads as a
          // picture in a frame.
          //
          // TWO gutters stand between this and the page edge, not one. The
          // dashboard container's own `px-2` exists only on a phone; the ROOT
          // layout's `layout-container` puts `--container-px` outside it at
          // every width (8px on a phone, 32px at `xl`), and cancelling that is
          // exactly what the live room's layout does. Cancelling only the
          // first, which is what this did, left the artwork short of the edge
          // by 8-32px on every screen wider than `sm`.
          //
          // The start side is asymmetric above `sm` ON PURPOSE: the sidebar
          // sits between the page edge and this container, so a negative
          // inline-start margin would run the poster UNDER it rather than out
          // to the glass. Flush against the sidebar is as far start as
          // full-bleed goes here. Below `sm` the sidebar is off-canvas and
          // both sides escape.
          showHero
            ? "ms-[calc(-0.5rem-var(--container-px,0px))] me-[calc(-0.5rem-var(--container-px,0px))] -mt-2 w-[calc(100%+1rem+2*var(--container-px,0px))] sm:ms-0 sm:me-[calc(-1*var(--container-px,0px))] sm:w-[calc(100%+var(--container-px,0px))]"
            : "aspect-video overflow-hidden"
        )}
        style={{ backgroundColor: lesson.color || "#1a1a1a" }}
      >
        {showHero ? (
          <>
            <TitleCard
              // The room's own geometry, imported rather than guessed: four
              // fifths of the viewport above `sm` so the shelf under it peeks
              // and says the page continues, and a poster clamped against the
              // same fraction on a phone, where its height would otherwise
              // come from the card's WIDTH and run off a short screen.
              className="sm:min-h-[85dvh]"
              posterClassName="max-h-[calc(85dvh-10rem)] sm:max-h-none"
              sizes="100vw"
              thumbnailUrl={lesson.thumbnailUrl}
              color={lesson.color}
              alt={lesson.title}
              title={lesson.title}
              /* TWO rows of type above the button, which is what the live
                 room's card has: the title, then one grey sentence. This card
                 carried four — a grade badge over the title and a "بالقلم"
                 byline under it — and the two callers drawing the same frame
                 disagreed by 90px of stack before the reader reached the same
                 button.

                 Neither row was carrying its weight. The byline names the
                 publisher of a catalog every lesson in this block belongs to,
                 which is the one fact a reader on this page already has. The
                 badge named the grade, and a student's whole catalog is their
                 own grade — the room dropped the same chip for the same
                 reason, and the grade is still on the course page above.

                 The band this stack sits in is measured for exactly these two
                 rows (see the card's own `-mt-[108px] h-20` note), so removing
                 them puts the title where the room puts it rather than
                 wherever four rows happened to end. */
              meta={
                /* One grey sentence, built in `heroMeta` above. Undefined
                   rather than an empty span when a lesson knows none of the
                   three — the card drops the row instead of leaving a gap. */
                heroMeta.length > 0 ? (
                  <span>{heroMeta.join(" · ")}</span>
                ) : undefined
              }
              description={
                /* The frame's paragraph, which this hero never had: it kept
                   the lesson's own words behind a chip. Three lines, then
                   `… more` into the sheet that holds the rest. */
                <TitleCardDescription
                  text={heroBlurb}
                  more={d?.more || "MORE"}
                  onMore={() => setShowDescDialog(true)}
                />
              }
              chips={
                /* Marks, then counts — the room's row exactly. The year and
                   the runtime used to open this row as bare text among the
                   boxes; they are facts you read BEFORE deciding, so they sit
                   on the info line now and the row is left holding only what
                   the frame puts here: one filled mark, then outlined ones,
                   then whatever the thing comes with. */
                <>
                  <span className={titleCardChipSolid}>4K</span>
                  {lesson.isFree && (
                    <span className={titleCardChip}>{d?.free || "Free"}</span>
                  )}
                  <span className={titleCardChip}>CC</span>
                  <span className={titleCardChip}>AD</span>
                  {lesson.availableVideos.length > 1 && (
                    <>
                      <span>&middot;</span>
                      <span>
                        {lesson.availableVideos.length}{" "}
                        {d?.instructors || "instructors"}
                      </span>
                    </>
                  )}
                  {resourceCount > 0 && (
                    <>
                      <span>&middot;</span>
                      <span>
                        {resourceCount}{" "}
                        {resourceCount > 1
                          ? d?.resourceMany || "resources"
                          : d?.resourceOne || "resource"}
                      </span>
                    </>
                  )}
                </>
              }
              action={
                /* Locked (paid + unpurchased) with no playable source →
                   purchase pill. Without this, a lone paid video is a dead
                   end: the switcher needs 2+ videos and Play stays disabled. */
                lockedVideo && !currentVideoUrl ? (
                  <button
                    onClick={() => handleUnlock(lockedVideo.id)}
                    disabled={isPurchasePending}
                    className={cn(
                      titleCardPill,
                      "w-full justify-center sm:w-auto"
                    )}
                  >
                    {isPurchasePending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                    {d?.unlock || "Unlock"}
                    {lockedVideo.price != null && (
                      <span className="text-black/60">
                        {lockedVideo.price.toFixed(2)}{" "}
                        {lockedVideo.currency ?? ""}
                      </span>
                    )}
                  </button>
                ) : /* Play button — two states based on watch progress */
                lesson.progress &&
                  lesson.progress.watchedSeconds > 0 &&
                  lesson.progress.totalSeconds ? (
                  <button
                    onClick={handlePlay}
                    disabled={!currentVideoUrl}
                    className={cn(
                      titleCardPill,
                      "w-full justify-center px-5 sm:w-auto"
                    )}
                  >
                    <Play className="size-4 shrink-0 fill-current" />
                    <span className="shrink-0">{playLabel}</span>
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-black/20">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{
                          width: `${Math.min(100, (lesson.progress.watchedSeconds / lesson.progress.totalSeconds) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-black/60">
                      {formatRemaining(
                        lesson.progress.watchedSeconds,
                        lesson.progress.totalSeconds
                      )}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handlePlay}
                    disabled={!currentVideoUrl}
                    className={cn(
                      titleCardPill,
                      "w-full justify-center sm:w-auto"
                    )}
                  >
                    <Play className="size-4 fill-current" />
                    {playLabel}
                  </button>
                )
              }
              topEnd={
                /* The frame's `+ ADD`, over the artwork rather than beside the
                   button. That is what leaves the button the whole width on a
                   phone, which is where the reference puts it and how the live
                   room already draws the same card. */
                <button
                  onClick={() => {
                    setIsInWishlist((prev) => {
                      setWishlistDialog(prev ? "removed" : "added")
                      return !prev
                    })
                  }}
                  className={titleCardTopPill}
                  title={d?.addToWatchlist || "Add to your watchlist"}
                  aria-label={d?.addToWatchlist || "Add to your watchlist"}
                >
                  {isInWishlist ? (
                    <Check className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {d?.add || "ADD"}
                </button>
              }
            />

            {/* About this Lesson — Apple TV+ info sheet */}
            <Dialog open={showDescDialog} onOpenChange={setShowDescDialog}>
              <DialogContent
                showCloseButton={false}
                className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-[380px]"
              >
                {/* Fixed header — title + subtitle only */}
                <div className="shrink-0 px-6 pt-2.5 pb-0.5">
                  {/* Done pill — top-right */}
                  <DialogClose asChild>
                    <button className="absolute end-4 top-3 rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-light text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                      {d?.done || "Done"}
                    </button>
                  </DialogClose>

                  {/* Header — centered title + subtitle */}
                  <DialogHeader className="items-center gap-0 text-center">
                    <DialogTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {lesson.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {lesson.chapter.course.title}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto px-6 pb-6">
                  {/* Description */}
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {lesson.description ||
                      lesson.chapter.course.description ||
                      d?.exploreLesson ||
                      "Explore this lesson and discover new concepts."}
                  </p>

                  {/* Metadata badges row */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px]">
                    {lesson.year && <span>{lesson.year}</span>}
                    {lesson.year &&
                      formatDuration(lesson.duration, lesson.videoDuration) && (
                        <span>&middot;</span>
                      )}
                    {formatDuration(lesson.duration, lesson.videoDuration) && (
                      <span>
                        {formatDuration(lesson.duration, lesson.videoDuration)}
                      </span>
                    )}
                    <span className="bg-foreground text-background rounded px-1 text-[10px] leading-4 font-bold">
                      4K
                    </span>
                    {lesson.isFree && (
                      <span className="rounded border px-1 text-[10px] leading-4">
                        {d?.free || "Free"}
                      </span>
                    )}
                    <span className="rounded border px-1 text-[10px] leading-4">
                      CC
                    </span>
                    <span className="rounded border px-1 text-[10px] leading-4">
                      AD
                    </span>
                  </div>
                  {/* ── Information ── */}
                  <div className="mt-5 pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {d?.information || "Information"}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {lesson.year && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.released || "Released"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.year}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.course || "Course"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.course.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.chapter || "Chapter"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.title}
                        </p>
                      </div>
                      {lesson.chapter.course.grades.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.grade || "Grade"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.chapter.course.grades
                              .map(
                                (g) =>
                                  `${d?.grade || "Grade"} ${gradeWord(g, lang)}`
                              )
                              .join(", ")}
                          </p>
                        </div>
                      )}
                      {lesson.availableVideos.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.instructors || "Instructors"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.availableVideos
                              .map(
                                (v) =>
                                  v.instructor.name ??
                                  d?.instructor ??
                                  "Instructor"
                              )
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── About this Course ── */}
                  {(lesson.chapter.course.description ||
                    lesson.chapter.course.objectives.length > 0 ||
                    lesson.chapter.course.prerequisites ||
                    lesson.chapter.course.targetAudience) && (
                    <div className="mt-5 pt-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {d?.aboutThisCourse || "About this Course"}
                      </h3>
                      <div className="mt-3 space-y-3">
                        {lesson.chapter.course.description && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.description || "Description"}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.description}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.objectives.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.objectives || "Objectives"}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.objectives.join(", ")}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.prerequisites && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.prerequisites || "Prerequisites"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.prerequisites}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.targetAudience && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.targetAudience || "Target Audience"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.targetAudience}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Current Lesson ── */}
                  {lesson.description && (
                    <div className="mt-5 pt-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {d?.currentLesson || "Current Lesson"}
                      </h3>
                      <div className="mt-3">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.description || "Description"}
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Wishlist overlay — Apple TV transient feedback */}
            {wishlistDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 shadow-xl dark:bg-neutral-800">
                  <Bookmark className="h-16 w-10 text-gray-700 dark:text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {wishlistDialog === "added"
                      ? d?.addedToWatchlist || "Added to Watchlist"
                      : d?.removed || "Removed"}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : currentVideoUrl ? (
          <VideoPlayer
            // Remount on instructor switch — a <video> won't reload just from a
            // changed `src` attribute (it needs .load()), so keying on the
            // active video id gives the new instructor's source a fresh
            // element. Same reason the fallback swap is part of the key.
            key={`${activeVideoId ?? "default"}${sourceFailed ? ":fallback" : ""}`}
            url={currentVideoUrl}
            title={lesson.title}
            lessonId={lesson.id}
            initialPosition={initialPosition}
            posterUrl={lesson.thumbnailUrl}
            nextLesson={nextLessonData}
            onProgress={handleProgress}
            onComplete={handleVideoComplete}
            onNextLesson={handleNextLesson}
            onSourceError={handleSourceError}
            autoPlay={autoPlay}
            startFullscreen={openFullscreen}
            onFullscreenChange={handleFullscreenChange}
            chapterNumber={lesson.chapter.position}
            lessonNumber={lesson.position}
            courseTitle={lesson.chapter.course.title}
            className="h-full w-full"
            labels={playerLabels}
          />
        ) : null}
      </div>

      {lesson.availableVideos.length > 1 && (
        <InstructorSwitcher
          videos={lesson.availableVideos}
          activeVideoId={activeVideoId}
          onSwitch={handleSwitchVideo}
          dictionary={dictionary as Record<string, any>}
        />
      )}

      {/* More from Course */}
      {lesson.siblingLessons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {d?.moreFrom || "More from"} {lesson.chapter.course.title}
          </h2>
          <div className={shelfScroller}>
            {lesson.siblingLessons.map((sibling) => (
              <ShelfCard
                key={sibling.id}
                href={`${baseUrl}/${sibling.id}`}
                title={sibling.title}
                thumbnailUrl={sibling.thumbnailUrl}
                color={sibling.color}
                meta={
                  <>
                    <Play className="size-3 fill-current" />
                    {sibling.watchedMinutes != null &&
                    sibling.watchedMinutes > 0 ? (
                      <span>
                        {sibling.watchedMinutes}{" "}
                        {d?.minWatched || "min watched"}
                      </span>
                    ) : (
                      <>
                        <span>
                          {d?.chapterShort || "C"}
                          {sibling.chapterPosition}, {d?.lessonShort || "L"}
                          {sibling.lessonPosition}
                        </span>
                        <span>&middot;</span>
                        <span>
                          {sibling.duration ?? "?"} {d?.min || "min"}
                        </span>
                      </>
                    )}
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructors — real data from availableVideos */}
      {lesson.availableVideos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {d?.instructors || "Instructors"}
          </h2>
          <div className="flex flex-wrap gap-3">
            {lesson.availableVideos.map((video) => {
              const locked = video.requiresPayment && !video.hasPurchased
              return (
                <button
                  key={video.id}
                  disabled={locked && isPurchasePending}
                  onClick={() => {
                    // Locked (paid + unpurchased) videos have no playable URL —
                    // switching would blank the player. Start the purchase
                    // instead so a lone paid video is never a dead end.
                    if (locked) {
                      handleUnlock(video.id)
                      return
                    }
                    handleSwitchVideo(video.id)
                    setShowHero(false)
                  }}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    activeVideoId === video.id
                      ? "border-primary bg-primary/5"
                      : "bg-muted/50 hover:bg-muted"
                  } ${locked ? "opacity-75" : ""}`}
                >
                  <Avatar className="size-10">
                    <AvatarImage src={video.instructor.image ?? undefined} />
                    <AvatarFallback>
                      {locked ? (
                        <Lock className="size-4" />
                      ) : (
                        (video.instructor.name?.charAt(0) ?? (
                          <User className="size-5" />
                        ))
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-start">
                    <p className="text-sm font-medium">
                      {video.instructor.name ?? d?.instructor ?? "Instructor"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          video.source === "own-school"
                            ? "default"
                            : video.source === "featured"
                              ? "secondary"
                              : "outline"
                        }
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {video.source === "other-school" && video.school.name
                          ? video.school.name
                          : sourceLabels[video.source]}
                      </Badge>
                      {locked && (
                        <span className="text-muted-foreground text-[10px]">
                          {video.price != null
                            ? `${video.price.toFixed(2)} ${video.currency ?? ""}`
                            : (d?.unlock ?? "Unlock")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quiz — graded; the score is written to the gradebook server-side */}
      {quizQuestions && quizQuestions.length > 0 && (
        <LessonQuiz
          questions={quizQuestions}
          lessonId={lesson.id}
          d={d}
          off={off}
        />
      )}

      {/* Lesson Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                {lesson.isFree && (
                  <Badge variant="secondary">
                    {d?.freePreview || "Free Preview"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {lesson.chapter.title} &bull; {lesson.chapter.course.title}
              </p>
            </div>
            <Button
              onClick={handleToggleComplete}
              disabled={isPending}
              variant={isCompleted ? "secondary" : "default"}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="me-2 size-4 text-green-500" />
              ) : (
                <Circle className="me-2 size-4" />
              )}
              {isCompleted
                ? d?.completed || "Completed"
                : d?.markAsComplete || "Mark as Complete"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          {lesson.description && (
            <div className="prose dark:prose-invert mb-6 max-w-none">
              <p>{lesson.description}</p>
            </div>
          )}

          {/* Duration */}
          {(lesson.videoDuration || lesson.duration) && (
            <p className="text-muted-foreground mb-4 text-sm">
              {d?.duration || "Duration"}:{" "}
              {lesson.videoDuration
                ? `${Math.floor(lesson.videoDuration / 60)}m ${Math.floor(lesson.videoDuration % 60)}s`
                : `${lesson.duration} ${d?.minutes || "minutes"}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resources — legacy attachments + catalog lesson materials */}
      {resourceCount > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {d?.resources || "Resources"}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {lesson.attachments.map((attachment) => (
              <MaterialViewerTrigger
                key={attachment.id}
                url={attachment.url}
                title={attachment.name}
                icon={
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                }
                viewer={viewer}
                labels={viewerLabels}
              />
            ))}
            {lesson.materials.map((material) =>
              material.url ? (
                <MaterialViewerTrigger
                  key={material.id}
                  url={material.url}
                  title={material.title}
                  description={material.description}
                  icon={
                    <FileText className="text-muted-foreground size-4 shrink-0" />
                  }
                  viewer={viewer}
                  labels={viewerLabels}
                />
              ) : (
                <div
                  key={material.id}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">
                      {material.title}
                    </span>
                    {material.description && (
                      <span className="text-muted-foreground block truncate text-xs">
                        {material.description}
                      </span>
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {lesson.previousLesson ? (
          <Link href={`${baseUrl}/${lesson.previousLesson.id}`}>
            <Button variant="outline">
              <ChevronLeft className="me-2 size-4 rtl:rotate-180" />
              <span className="hidden sm:inline">
                {d?.previous || "Previous"}:
              </span>{" "}
              <span className="max-w-[150px] truncate">
                {lesson.previousLesson.title}
              </span>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {lesson.nextLesson ? (
          <Link href={`${baseUrl}/${lesson.nextLesson.id}`}>
            <Button>
              <span className="hidden sm:inline">{d?.next || "Next"}:</span>{" "}
              <span className="max-w-[150px] truncate">
                {lesson.nextLesson.title}
              </span>
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              {d?.backToCourse || "Back to Course"}
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Helper: number to word (1-12), locale-aware
const GRADE_WORDS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
  11: "Eleven",
  12: "Twelve",
}
const GRADE_WORDS_AR: Record<number, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
  7: "السابع",
  8: "الثامن",
  9: "التاسع",
  10: "العاشر",
  11: "الحادي عشر",
  12: "الثاني عشر",
}
function gradeWord(n: number, lang?: string): string {
  if (lang === "ar") return GRADE_WORDS_AR[n] ?? String(n)
  return GRADE_WORDS[n] ?? String(n)
}

// Helper: format duration from minutes or seconds
function formatDuration(
  minutes?: number | null,
  seconds?: number | null
): string {
  const totalMin = minutes ?? (seconds ? Math.ceil(seconds / 60) : 0)
  if (totalMin === 0) return ""
  if (totalMin >= 60)
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60} min`
  return `${totalMin} min`
}

// Helper: format remaining time
function formatRemaining(watchedSeconds: number, totalSeconds: number): string {
  const remainSec = Math.max(0, totalSeconds - watchedSeconds)
  const remainMin = Math.ceil(remainSec / 60)
  if (remainMin >= 60)
    return `${Math.floor(remainMin / 60)}h ${remainMin % 60}m left`
  return `${remainMin}m left`
}

/**
 * Graded lesson quiz: collects one answer per question, submits them together,
 * and lets the SERVER grade against the SAME question set it rendered
 * (`lib/lesson-quiz.ts` owns that set for both sides).
 *
 * Nothing here knows the right answer until the server says so. `questions`
 * carries only the choice LABELS in grading order; the response carries the
 * verdicts. Answers go back as option INDEXES for choices, and as text for
 * fill-in-the-blank.
 */
function LessonQuiz({
  questions,
  lessonId,
  d,
  off,
}: {
  questions: LessonQuizQuestion[]
  lessonId: string
  d?: Record<string, any>
  off?: Record<string, any>
}) {
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [result, setResult] = useState<LessonQuizResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const [isSubmitting, startSubmit] = useTransition()

  // Every question the server returned is gradeable — non-answerable types are
  // excluded at the query, not hidden here.
  const allAnswered = questions.every((q) =>
    q.choices === null
      ? (texts[q.id] ?? "").trim().length > 0
      : choices[q.id] !== undefined
  )
  const submitted = result !== null
  const verdictFor = (id: string) =>
    result?.verdicts.find((v) => v.questionId === id)

  const handleSubmit = () => {
    setError(null)
    // One id per press: a retried request resolves to the same attempt — and
    // it is the outbox key when the answers have to wait for a connection.
    const attemptId = crypto.randomUUID()
    const answers = questions.map((q) =>
      q.choices === null
        ? { questionId: q.id, answerText: texts[q.id] ?? "" }
        : { questionId: q.id, selectedOptionIndex: choices[q.id] }
    )
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      void enqueue({
        kind: "quiz",
        id: attemptId,
        payload: { lessonId, answers },
      }).then(() => setQueued(true))
      return
    }
    startSubmit(async () => {
      const res = await submitLessonQuiz({ lessonId, attemptId, answers })
      if (res.success) {
        setResult(res.data)
      } else {
        setError(d?.quizSubmitFailed || "Couldn't submit your answers")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{d?.quiz || "Quiz"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, idx) => (
          <QuizQuestion
            key={q.id}
            question={q}
            index={idx}
            d={d}
            selectedIndex={choices[q.id]}
            text={texts[q.id] ?? ""}
            verdict={verdictFor(q.id)}
            onSelect={(i) => setChoices((prev) => ({ ...prev, [q.id]: i }))}
            onType={(v) => setTexts((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}

        {error && <p className="text-destructive text-sm">{error}</p>}
        {queued && (
          <p className="text-muted-foreground text-sm" role="status">
            {off?.quizQueued ||
              "Answers saved on this device — they'll be graded when you're back online."}
          </p>
        )}

        {submitted ? (
          <div className="bg-muted space-y-1 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{result.percentage}%</p>
            <p className="muted text-sm">
              {result.score} / {result.total}
            </p>
            {/* Only the first attempt reaches the gradebook — say so rather
                than letting a retake look like it re-scored the report card. */}
            <p className="text-muted-foreground text-xs">
              {result.recorded
                ? d?.quizRecorded || "This score was added to your gradebook."
                : d?.quizPractice ||
                  "Practice attempt — your gradebook keeps your first score."}
            </p>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={
              !allAnswered || isSubmitting || queued || questions.length === 0
            }
            className="w-full"
          >
            {isSubmitting
              ? d?.quizSubmitting || "Submitting..."
              : d?.quizSubmit || "Submit Quiz"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Single question. Controlled by LessonQuiz; correctness is whatever the
// server's `verdict` says — the client has no answer key to consult.
function QuizQuestion({
  question,
  index,
  d,
  selectedIndex,
  text,
  verdict,
  onSelect,
  onType,
}: {
  question: LessonQuizQuestion
  index: number
  d?: Record<string, any>
  selectedIndex: number | undefined
  text: string
  verdict: LessonQuizVerdict | undefined
  onSelect: (index: number) => void
  onType: (value: string) => void
}) {
  const submitted = verdict !== undefined
  const isFreeText = question.choices === null

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-medium">
        {index + 1}. {question.questionText}
      </p>

      {isFreeText ? (
        <Input
          value={text}
          onChange={(e) => onType(e.target.value)}
          disabled={submitted}
          placeholder={d?.quizAnswerPlaceholder || "Type your answer"}
          className={
            submitted
              ? verdict?.isCorrect
                ? "border-green-500"
                : "border-red-500"
              : undefined
          }
        />
      ) : (
        question.choices !== null &&
        question.choices.length > 0 && (
          <div className="space-y-1.5">
            {question.choices.map((label, i) => {
              const isCorrect = submitted && verdict?.correctIndex === i
              const isPicked = selectedIndex === i
              return (
                <button
                  key={i}
                  onClick={() => onSelect(i)}
                  disabled={submitted}
                  className={`w-full rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : isPicked && submitted
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : isPicked
                          ? "border-primary"
                          : "hover:bg-muted/50"
                  } ${submitted ? "cursor-default" : "cursor-pointer"}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )
      )}

      {submitted && verdict?.correctAnswers && !verdict.isCorrect && (
        <p className="text-muted-foreground mt-2 text-xs">
          {d?.answer || "Answer"}: {verdict.correctAnswers.join(" / ")}
        </p>
      )}

      {submitted && verdict?.sampleAnswer && (
        <p className="text-muted-foreground mt-2 text-xs">
          {d?.answer || "Answer"}: {verdict.sampleAnswer}
        </p>
      )}

      {submitted && verdict?.explanation && (
        <p className="text-muted-foreground mt-2 text-xs">
          {verdict.explanation}
        </p>
      )}
    </div>
  )
}
