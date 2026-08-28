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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  FileVideo,
  Loader2,
  Plus,
  School,
  Upload,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CelebrationAnimation } from "@/components/atom/celebration-animation"
import { isValidVideoUrl } from "@/components/lumos/shared/url-validators"
import {
  uploadVideo,
  type VideoAudience,
  type VideoPricing,
} from "@/components/lumos/video/video-actions"

import type {
  ProposableChapter,
  ProposableGrade,
  ProposableLesson,
  SuggestedPrice,
} from "./get-proposable-lessons"
import { VideoUploadSuccessArt } from "./video-upload-success-art"

interface Props {
  /**
   * The grade → subject tree the caller may contribute to — a couple of
   * hundred rows at most. Chapters and lessons are never shipped up front;
   * step 1 walks down to them through the two /api/lumos/proposable-*
   * endpoints.
   */
  grades: ProposableGrade[]
  /** Display locale — the picker's search results translate to it. */
  lang?: string
  children?: React.ReactNode
  dictionary?: Record<string, any>
  currency?: string
}

/** Radix Select forbids an empty item value, so "no filter" needs a sentinel. */
const ANY = "__all__"

type Step = "select-lesson" | "add-video" | "finish-up"

const STEPS: Step[] = ["select-lesson", "add-video", "finish-up"]

type UploadStatus = "idle" | "uploading" | "done" | "error"

interface UploadedMeta {
  name: string
  size: number
  key: string
  storageProvider: string
  /** Whole seconds, probed from the local file. null when the probe failed. */
  durationSeconds: number | null
}

// Mirrors the presign route's guards (src/app/api/blob/presign/route.ts) so
// bad files fail fast client-side instead of on the request.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024 // 5GB
const ALLOWED_UPLOAD_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]

/**
 * The four ways a video can land — who can see it, crossed with whether it
 * costs anything. One list rather than two toggles: to the teacher this is a
 * single decision ("public and free"), and splitting it across two radio
 * groups made the combination something you had to assemble in your head.
 */
const ACCESS_CHOICES: { audience: VideoAudience; pricing: VideoPricing }[] = [
  { audience: "PUBLIC", pricing: "FREE" },
  { audience: "PUBLIC", pricing: "PAID" },
  { audience: "PRIVATE", pricing: "FREE" },
  { audience: "PRIVATE", pricing: "PAID" },
]

/**
 * Runtime of a local video file, read before it is uploaded.
 *
 * Every video created through this dialog stored `durationSeconds: null`, and
 * the lesson surfaces render exactly that (`videoDuration`). The platform-side
 * uploader (`video/video-input.tsx`) has always probed its source this way; the
 * file is already on the client, so this costs one object URL and no traffic.
 *
 * Resolves null on anything unexpected — a codec the browser can't parse, a
 * stream with no duration, a slow decode. Duration is a nice-to-have and must
 * never hold up or fail an upload.
 */
function probeDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const probe = document.createElement("video")
    let settled = false

    const finish = (value: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      probe.removeAttribute("src")
      probe.load()
      URL.revokeObjectURL(objectUrl)
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), 10_000)

    probe.preload = "metadata"
    probe.muted = true
    probe.addEventListener("loadedmetadata", () => {
      const { duration } = probe
      finish(
        Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null
      )
    })
    probe.addEventListener("error", () => finish(null))
    probe.src = objectUrl
  })
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const sec = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function ProposeVideoDialog({
  grades,
  lang,
  children,
  dictionary,
  currency = "USD",
}: Props) {
  // Callers pass either the full dictionary (teacher dashboard) or the
  // `lumos` subtree (settings videos tab) — accept both.
  const d = dictionary?.lumos?.proposeVideo ?? dictionary?.proposeVideo ?? {}
  const dSteps = d.steps ?? {}
  const dDesc = d.descriptions ?? {}
  const dFields = d.fields ?? {}
  const dAudience = d.audience ?? {}
  const dPricing = d.pricing ?? {}
  const dConfirm = d.confirm ?? {}
  const dActions = d.actions ?? {}
  const dSearch = d.search ?? {}
  const dSuccess = d.success ?? {}
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("select-lesson")
  const [isPending, startTransition] = useTransition()

  // Form state
  const [selectedLesson, setSelectedLesson] = useState<ProposableLesson | null>(
    null
  )

  // Lesson picker (step 1) — the catalog's own hierarchy, walked down one
  // tier at a time: grade → subject → chapter → lesson. Only the first two
  // tiers arrive with the page; chapters load when a subject is picked and
  // lessons are always a bounded, searchable page from the server. A school
  // teaching 12 grades selects ~120 subjects carrying thousands of lessons —
  // none of that belongs in a dialog's props.
  // Grade is always concrete — the browse pane opens on one, the way
  // /lumos/courses opens on a grade rather than on "everything".
  const [gradeFilter, setGradeFilter] = useState(grades[0]?.id ?? "")
  const [subjectFilter, setSubjectFilter] = useState(ANY)
  const [chapterFilter, setChapterFilter] = useState(ANY)
  const [chapters, setChapters] = useState<ProposableChapter[]>([])
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProposableLesson[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoSource, setVideoSource] = useState<"url" | "upload">("upload")
  const [audience, setAudience] = useState<VideoAudience>("PUBLIC")
  const [pricing, setPricing] = useState<VideoPricing>("FREE")
  const [price, setPrice] = useState("")
  // What comparable videos on the chosen course already charge. Null until
  // fetched, and null forever for a course with no paid videos to average.
  const [suggestion, setSuggestion] = useState<SuggestedPrice | null>(null)

  // Where the finished submission landed. Set instead of closing the dialog:
  // the last thing a contributor sees should be their video arriving
  // somewhere, not a wizard vanishing under a toast.
  const [submitted, setSubmitted] = useState<{
    lessonName: string
    href: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Which way the wizard is travelling, so a panel slides out the side it
  // came from. Set at every navigation site — forward on a pick or Next,
  // backward on the one Back control.
  const [navDir, setNavDir] = useState<1 | -1>(1)
  // Measured height of the step body. The dialog animates to it instead of
  // snapping, so a short step and a tall one are one continuous movement.
  const [bodyHeight, setBodyHeight] = useState<number | null>(null)

  // Direct-to-S3 upload state (presign → PUT). On success `videoUrl` holds the
  // final CDN URL and `uploadedMeta` carries key/size for quota + invalidation.
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadPct, setUploadPct] = useState(0)
  // Why the last attempt failed, in the reader's language — rendered inside the
  // drop zone so the reason outlives the toast.
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedMeta, setUploadedMeta] = useState<UploadedMeta | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // The scrollable step body — each step starts reading from the top.
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  // Uploaded-but-not-yet-submitted object key. Submit success clears it; any
  // other exit (remove, tab switch, dialog close) deletes the stranded object
  // server-side. A ref, not state — cleanup runs from close callbacks where
  // state could be stale.
  const cleanupKeyRef = useRef<string | null>(null)

  // ── Motion ─────────────────────────────────────────────────────────────
  // One easing and one distance for every step change, so the wizard reads as
  // a single surface moving rather than a stack of independently animated
  // parts. Everything collapses to an instant swap under prefers-reduced-motion.
  const reduceMotion = useReducedMotion()
  const isRtl = (lang ?? "en").startsWith("ar")
  const slideBy = reduceMotion ? 0 : isRtl ? -14 : 14
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
  const panelVariants = useMemo(
    () => ({
      enter: (dir: number) => ({ opacity: 0, x: dir * slideBy }),
      center: { opacity: 1, x: 0 },
      exit: (dir: number) => ({ opacity: 0, x: -dir * slideBy }),
    }),
    [slideBy]
  )
  // A spring, not a duration: the body grows by wildly different amounts
  // between steps, and a fixed duration makes the small changes feel sluggish
  // and the large ones feel rushed.
  const resizeTransition = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 260, damping: 32, mass: 0.9 } as const)

  // The body's own height, fed to the animated shell around it. Measured
  // through a callback ref rather than an effect: the body only exists while
  // the dialog is open, and an effect keyed on `open` read the ref before
  // Radix had attached it — the shell then sat on `height: auto` and every
  // step change snapped. Observed, not derived from `step`, because a step
  // also grows mid-stay (the price field opening, an upload error appearing)
  // and those deserve the same movement a step change gets.
  const bodyObserverRef = useRef<ResizeObserver | null>(null)
  const attachBody = useCallback((node: HTMLDivElement | null) => {
    bodyRef.current = node
    bodyObserverRef.current?.disconnect()
    bodyObserverRef.current = null
    if (!node) {
      // Closed — forget the last step's height so reopening measures fresh
      // instead of animating down from it.
      setBodyHeight(null)
      return
    }
    setBodyHeight(node.offsetHeight)
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => setBodyHeight(node.offsetHeight))
    observer.observe(node)
    bodyObserverRef.current = observer
  }, [])

  const clearUpload = useCallback(() => {
    xhrRef.current?.abort()
    xhrRef.current = null
    // Best-effort server-side delete of an orphaned upload. The route refuses
    // (409) if a Video row already claimed the key, so this can never destroy
    // submitted content.
    const strandedKey = cleanupKeyRef.current
    if (strandedKey) {
      cleanupKeyRef.current = null
      void fetch("/api/blob/presign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: strandedKey }),
      }).catch(() => {})
    }
    setUploadStatus("idle")
    setUploadPct(0)
    setUploadError(null)
    setUploadedMeta(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const resetForm = useCallback(() => {
    setStep("select-lesson")
    setSubmitted(null)
    setCopied(false)
    setSelectedLesson(null)
    setGradeFilter(grades[0]?.id ?? "")
    setSubjectFilter(ANY)
    setChapterFilter(ANY)
    setChapters([])
    setQuery("")
    setResults([])
    setHasMore(false)
    setSearching(false)
    setSearchFailed(false)
    setVideoUrl("")
    setVideoSource("upload")
    setAudience("PUBLIC")
    setPricing("FREE")
    setPrice("")
    setSuggestion(null)
    clearUpload()
  }, [clearUpload, grades])

  // The up/down pair moves whole currency units — the adjustment a contributor
  // actually makes (9.99 → 10.99), not a cent at a time. Clamped at zero, and
  // hitting zero empties the field so the placeholder returns rather than
  // leaving a "0.00" that reads like a real, invalid price.
  const nudgePrice = useCallback((direction: 1 | -1) => {
    setPrice((current) => {
      const next = (Number(current) || 0) + direction
      if (next <= 0) return ""
      return (Math.round(next * 100) / 100).toFixed(2)
    })
  }, [])

  const handleCopy = useCallback(() => {
    if (!submitted) return
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${submitted.href}`
        : submitted.href
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [submitted])

  // When direct file upload completes, give the contributor 2s to see the
  // completion state before smoothly auto-advancing to the finish-up step.
  useEffect(() => {
    if (step === "add-video" && uploadStatus === "done") {
      const timer = setTimeout(() => {
        setNavDir(1)
        setStep("finish-up")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [step, uploadStatus])

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
        toast.error(
          dFields.uploadInvalidType ??
            "Unsupported file type — use MP4, WebM, MOV or AVI."
        )
        return
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(
          dFields.uploadTooLarge ?? "File is too large — the limit is 5GB."
        )
        return
      }

      setUploadStatus("uploading")
      setUploadPct(0)
      setUploadError(null)
      setVideoUrl("")
      setUploadedMeta(null)

      // Started here, awaited after the PUT: it decodes while the presign
      // round-trip and the transfer are in flight, so it costs no wall-clock.
      const durationPromise = probeDurationSeconds(file)

      try {
        const presignRes = await fetch("/api/blob/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        })
        if (!presignRes.ok) {
          const body = (await presignRes.json().catch(() => null)) as {
            error?: string
          } | null
          // Carry the STATUS, not the server's English prose — the reason is
          // then translatable at the catch (quota vs permissions vs S3 down),
          // instead of collapsing into one "try again" that never comes true.
          console.error(
            "Presign refused:",
            presignRes.status,
            body?.error ?? "(no body)"
          )
          throw new Error(`presign-status-${presignRes.status}`)
        }
        const presign = (await presignRes.json()) as {
          presignedUrl: string
          finalUrl: string
          key: string
          storageProvider: string
        }

        // XMLHttpRequest instead of fetch — fetch has no upload progress.
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr
          xhr.open("PUT", presign.presignedUrl)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadPct(Math.round((e.loaded / e.total) * 100))
            }
          }
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`upload-status-${xhr.status}`))
          xhr.onerror = () => reject(new Error("upload-network-error"))
          xhr.onabort = () => reject(new Error("upload-aborted"))
          xhr.send(file)
        })

        xhrRef.current = null
        cleanupKeyRef.current = presign.key
        setVideoUrl(presign.finalUrl)
        setUploadedMeta({
          name: file.name,
          size: file.size,
          key: presign.key,
          storageProvider: presign.storageProvider,
          durationSeconds: await durationPromise,
        })
        setUploadPct(100)
        setUploadStatus("done")
      } catch (error) {
        xhrRef.current = null
        const reason = (error as Error).message
        if (reason === "upload-aborted") {
          setUploadStatus("idle")
          return
        }
        console.error("Direct video upload failed:", error)
        // Why it failed, in the reader's language — and kept on screen, not
        // only in a toast that the next click dismisses.
        const message =
          reason === "presign-status-413"
            ? (dFields.uploadQuotaExceeded ??
              "Your school's video storage is full — free up space or ask an admin to raise the quota.")
            : reason === "presign-status-401" || reason === "presign-status-403"
              ? (dFields.uploadForbidden ??
                "You don't have permission to upload videos here.")
              : reason === "presign-status-500"
                ? (dFields.uploadUnavailable ??
                  "Uploads aren't available right now — paste a video link instead.")
                : (dFields.uploadFailed ?? "Upload failed. Please try again.")
        setUploadStatus("error")
        setUploadError(message)
        toast.error(message)
      }
    },
    // Primitives, not `dFields` — the subtree is re-created every render when
    // a caller's dictionary lacks it, which would churn this callback.
    [
      dFields.uploadInvalidType,
      dFields.uploadTooLarge,
      dFields.uploadFailed,
      dFields.uploadQuotaExceeded,
      dFields.uploadForbidden,
      dFields.uploadUnavailable,
    ]
  )

  function detectProvider(
    url: string
  ): "YOUTUBE" | "VIMEO" | "SELF_HOSTED" | "OTHER" {
    if (url.includes("youtube.com") || url.includes("youtu.be"))
      return "YOUTUBE"
    if (url.includes("vimeo.com")) return "VIMEO"
    if (url.includes("s3.") || url.includes("cloudfront.net"))
      return "SELF_HOSTED"
    return "OTHER"
  }

  function handleSubmit() {
    if (!selectedLesson || !videoUrl.trim()) return

    const priceNumber = pricing === "PAID" ? Number(price) : undefined
    const currencyCode =
      pricing === "PAID" ? currency.trim().toUpperCase() : undefined
    const isDirectUpload = videoSource === "upload" && uploadedMeta !== null

    startTransition(async () => {
      const result = await uploadVideo({
        catalogLessonId: selectedLesson.id,
        title: selectedLesson.name,
        videoUrl: videoUrl.trim(),
        provider: isDirectUpload ? "SELF_HOSTED" : detectProvider(videoUrl),
        audience,
        pricing,
        price: priceNumber,
        currency: currencyCode,
        ...(isDirectUpload
          ? {
              fileSize: uploadedMeta.size,
              storageKey: uploadedMeta.key,
              storageProvider: uploadedMeta.storageProvider,
              ...(uploadedMeta.durationSeconds !== null
                ? { durationSeconds: uploadedMeta.durationSeconds }
                : {}),
            }
          : {}),
      })

      if (result.status === "success") {
        // The Video row now owns the uploaded object — nothing to clean up.
        cleanupKeyRef.current = null
        // Staff lesson view — the same route `uploadVideo` revalidates, so the
        // new video is already there when the link is followed.
        setSubmitted({
          lessonName: selectedLesson.name,
          href: `/${lang || "en"}/lumos/dashboard/${selectedLesson.subjectSlug}/${selectedLesson.id}`,
        })
      } else {
        toast.error(result.message)
      }
    })
  }

  const canProceedFromLesson = !!selectedLesson
  const isPaidValid =
    pricing === "FREE" || (Number(price) > 0 && currency.trim().length === 3)
  // Mirror the server's isValidVideoUrl so a bad link dies at step 2 with an
  // inline hint, not after submit as a toast two steps later. Uploads carry
  // the presigned CDN URL, which is valid by construction — but the test is
  // the finished upload, not a non-empty `videoUrl`: that alone let a URL
  // pasted on the other tab enable Review over an empty drop zone.
  const urlOk =
    videoSource === "upload"
      ? uploadStatus === "done" && !!uploadedMeta && !!videoUrl
      : isValidVideoUrl(videoUrl.trim())
  const showUrlHint =
    videoSource === "url" &&
    !!videoUrl.trim() &&
    !isValidVideoUrl(videoUrl.trim())
  const canProceedFromVideo = urlOk
  const canProceedFromFinishUp = isPaidValid

  // Bare padded number for the pill row (mirrors /lumos/courses), and the
  // spelled label for places that need a word — breadcrumb, step-2 chip,
  // confirm. Both derive from the number: school grade names are prose that
  // translates inconsistently and sorts badly.
  const gradeNumberLabel = useCallback(
    (grade: ProposableGrade) =>
      grade.gradeNumber === 0
        ? (dSearch.ungraded ?? "Ungraded")
        : String(grade.gradeNumber),
    [dSearch.ungraded]
  )

  const gradeLabel = useCallback(
    (grade: ProposableGrade) =>
      grade.gradeNumber === 0
        ? (dSearch.ungraded ?? "Ungraded")
        : `${dSearch.grade ?? "Grade"} ${String(grade.gradeNumber).padStart(2, "0")}`,
    // Primitives, not `dSearch`: the subtree is re-created (`d.search ?? {}`)
    // on every render when a caller passes a dictionary without it, and an
    // unstable label function would ripple into the search effect's deps.
    [dSearch.grade, dSearch.ungraded]
  )

  useEffect(() => {
    if (
      grades.length > 0 &&
      (!gradeFilter || !grades.some((g) => g.id === gradeFilter))
    ) {
      setGradeFilter(grades[0].id)
    }
  }, [grades, gradeFilter])

  const activeGrade = useMemo(
    () => grades.find((grade) => grade.id === gradeFilter) ?? grades[0],
    [grades, gradeFilter]
  )
  const activeSubjects = useMemo(
    () => activeGrade?.subjects ?? [],
    [activeGrade]
  )
  const activeSubject = activeSubjects.find(
    (subject) => subject.id === subjectFilter
  )
  const activeChapter = chapters.find((chapter) => chapter.id === chapterFilter)

  // Step 1 is a drill-down, not a form: pane one browses grade → subject,
  // pane two picks the chapter inside it, pane three picks the lesson.
  const pane: "browse" | "chapters" | "lessons" =
    subjectFilter === ANY
      ? "browse"
      : chapterFilter === ANY
        ? "chapters"
        : "lessons"

  // What the body is showing right now — the animation key. Steps AND the
  // three panes inside step 1 are all "a screen", so a pane swap gets the
  // same movement a step change does.
  const panelKey = submitted
    ? "success"
    : step === "select-lesson"
      ? `select-lesson-${pane}`
      : step

  const handleBottomBack = useCallback(() => {
    setNavDir(-1)
    if (step === "finish-up") {
      setStep("add-video")
    } else if (step === "add-video") {
      setStep("select-lesson")
    } else if (step === "select-lesson") {
      if (pane === "lessons") {
        setChapterFilter(ANY)
      } else if (pane === "chapters") {
        setSubjectFilter(ANY)
      }
    }
  }, [step, pane])

  const canGoBack =
    !isPending && (step !== "select-lesson" || pane !== "browse")

  // Subject id → what to call it on screen, for surfaces that only hold a
  // lesson (the pick chip, step 3) and still need its grade to be unambiguous.
  const subjectLabels = useMemo(() => {
    const labels = new Map<string, string>()
    for (const grade of grades) {
      for (const subject of grade.subjects) {
        if (!labels.has(subject.id)) {
          labels.set(subject.id, `${subject.name} · ${gradeLabel(grade)}`)
        }
      }
    }
    return labels
  }, [grades, gradeLabel])

  const lessonSubjectLabel = useCallback(
    (lesson: ProposableLesson) =>
      subjectLabels.get(lesson.subjectId) ?? lesson.subjectName,
    [subjectLabels]
  )

  // What the lesson query is narrowed to — as a query string, not an object.
  // The search effect depends on this: a string compares by value, so a
  // re-render that rebuilds the same scope can never re-fire the fetch (an
  // object identity there would loop). A chapter is the narrowest tier and
  // travels alone — the server filters it through the same subject scope.
  const searchScope = useMemo(() => {
    if (subjectFilter === ANY) return ""
    const params = new URLSearchParams()
    if (chapterFilter !== ANY) params.set("chapterId", chapterFilter)
    else params.set("subjectIds", subjectFilter)
    return params.toString()
  }, [subjectFilter, chapterFilter])

  // Chapters for the chosen subject. Loaded on demand — a school's subjects
  // carry ~8 chapters each, which is the flat list again if shipped up front.
  useEffect(() => {
    if (!open || subjectFilter === ANY) {
      setChapters([])
      return
    }
    const controller = new AbortController()
    void (async () => {
      try {
        const params = new URLSearchParams({ subjectId: subjectFilter })
        if (lang) params.set("locale", lang)
        const res = await fetch(
          `/api/lumos/proposable-chapters?${params.toString()}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`chapters-status-${res.status}`)
        const data = (await res.json()) as { chapters: ProposableChapter[] }
        setChapters(data.chapters)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        console.error("Proposable chapter fetch failed:", error)
        setChapters([])
      }
    })()
    return () => controller.abort()
  }, [open, subjectFilter, lang])

  // One fetch per (subject, chapter) — not per keystroke. Typing filters the
  // fetched page client-side below, so the whole subject arrives once and the
  // search reads the SAME translated text the user sees. A route handler and
  // not a server action on purpose: auth() rotates the session cookie inside
  // action requests, so an action would ship a full RSC re-render of the page
  // with every response. The AbortController is the race guard — a superseded
  // request can never overwrite a newer result.
  useEffect(() => {
    // The browse pane shows grades and subjects, which already arrived with
    // the page — no lesson query until a subject is picked.
    if (!open || !searchScope) {
      setResults([])
      setHasMore(false)
      setSearching(false)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    setSearchFailed(false)
    void (async () => {
      try {
        const params = new URLSearchParams(searchScope)
        if (lang) params.set("locale", lang)
        const res = await fetch(
          `/api/lumos/proposable-lessons?${params.toString()}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`lessons-status-${res.status}`)
        const data = (await res.json()) as {
          lessons: ProposableLesson[]
          hasMore: boolean
        }
        setResults(data.lessons)
        setHasMore(data.hasMore)
        setSearchFailed(false)
        setSearching(false)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        console.error("Proposable lesson fetch failed:", error)
        setResults([])
        setHasMore(false)
        setSearchFailed(true)
        setSearching(false)
      }
    })()
    return () => controller.abort()
  }, [open, searchScope, lang])

  // Typing filters what is on screen. Catalog content is stored in one
  // language and displayed in another, so a server-side `contains` would match
  // source text the user cannot read — "seven" would miss a lesson listed as
  // "the number seven". The page holds the whole subject, so this is complete.
  const filteredResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return results
    return results.filter(
      (lesson) =>
        lesson.name.toLocaleLowerCase().includes(term) ||
        lesson.chapterName.toLocaleLowerCase().includes(term)
    )
  }, [results, query])

  // Inside a subject the page groups by chapter; inside a chapter it is
  // already one group, so it renders flat. A Map keeps the server's
  // chapter → sequence ordering.
  const groupedResults = useMemo(() => {
    if (chapterFilter !== ANY) return [["", filteredResults] as const]
    const groups = new Map<string, ProposableLesson[]>()
    for (const lesson of filteredResults) {
      const bucket = groups.get(lesson.chapterName)
      if (bucket) bucket.push(lesson)
      else groups.set(lesson.chapterName, [lesson])
    }
    return [...groups]
  }, [filteredResults, chapterFilter])

  // Each step opens reading from its top — the body scrolls, not the dialog.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [step, pane, submitted])

  // What comparable videos on this course charge. One fetch per (course,
  // currency) once the paid lane is actually chosen — a GET route handler and
  // not a server action for the reason its proposable-* siblings give: auth()
  // rotates the session cookie inside action requests, so an action would ship
  // a full RSC re-render of the page with every response. Cleared whenever the
  // question stops being asked, so a course's average can never linger on a
  // different course.
  useEffect(() => {
    const subjectId = selectedLesson?.subjectId
    if (!open || step !== "finish-up" || pricing !== "PAID" || !subjectId) {
      setSuggestion(null)
      return
    }
    const controller = new AbortController()
    void (async () => {
      try {
        const params = new URLSearchParams({ subjectId, currency })
        const res = await fetch(
          `/api/lumos/suggested-price?${params.toString()}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`suggested-price-status-${res.status}`)
        const data = (await res.json()) as {
          suggestion: SuggestedPrice | null
        }
        setSuggestion(data.suggestion)
      } catch (error) {
        if ((error as Error).name === "AbortError") return
        // A missing suggestion is a missing nicety — never a blocked price.
        console.error("Suggested price fetch failed:", error)
        setSuggestion(null)
      }
    })()
    return () => controller.abort()
  }, [open, step, pricing, selectedLesson?.subjectId, currency])

  // A multi-GB PUT is minutes of the teacher's day — closing the tab on it
  // should cost a confirmation, not happen silently. Registered only while
  // bytes are moving, so it never nags an idle dialog.
  useEffect(() => {
    if (uploadStatus !== "uploading") return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older Chrome only shows the prompt when returnValue is set too.
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [uploadStatus])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Radix's corner X calls this directly — it never reaches
        // onInteractOutside/onEscapeKeyDown, so the busy check has to repeat
        // here or the one control that looks like "close" is the one that
        // silently destroys an in-flight upload.
        if (!v && uploadStatus === "uploading") {
          toast.warning(
            dFields.uploadBusyClose ??
              "Upload in progress — cancel it first, or wait for it to finish."
          )
          return
        }
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            aria-label={d.trigger ?? "Upload Video"}
            title={d.trigger ?? "Upload Video"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] flex-col overflow-hidden transition-all duration-300",
          submitted ? "sm:max-w-sm" : "sm:max-w-lg"
        )}
        // A stray click on the backdrop used to abort an in-flight upload and
        // delete the object, with no confirmation and hours of transfer gone.
        // Accidental dismissals are refused while bytes move; the explicit
        // Cancel control on the progress card is still the way out.
        onInteractOutside={(event) => {
          if (uploadStatus === "uploading") {
            event.preventDefault()
            toast.warning(
              dFields.uploadBusyClose ??
                "Upload in progress — cancel it first, or wait for it to finish."
            )
          }
        }}
        onEscapeKeyDown={(event) => {
          if (uploadStatus === "uploading") {
            event.preventDefault()
            toast.warning(
              dFields.uploadBusyClose ??
                "Upload in progress — cancel it first, or wait for it to finish."
            )
          }
        }}
      >
        <DialogHeader className={cn("pb-2 text-start", submitted && "sr-only")}>
          <div className="flex items-center gap-3.5">
            {!submitted && (
              <div className="text-foreground flex size-14 shrink-0 items-center justify-center sm:size-16">
                <VideoUploadSuccessArt className="size-full" />
              </div>
            )}
            {/* Re-keyed per screen so the title and its line fade in with
              the body they describe instead of snapping ahead of it. */}
            <motion.div
              key={panelKey}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={panelTransition}
              className="flex flex-col space-y-1 text-start"
            >
              <DialogTitle className="text-start text-lg font-semibold sm:text-xl">
                {submitted && (dSuccess.title ?? "Video uploaded")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "browse" &&
                  (dSteps.selectSubject ?? "Select Subject")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "chapters" &&
                  (dSteps.selectChapter ?? "Select Chapter")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "lessons" &&
                  (dSteps.selectLesson ?? "Select Lesson")}
                {!submitted &&
                  step === "add-video" &&
                  (dSteps.addVideo ?? "Add Video")}
                {!submitted &&
                  step === "finish-up" &&
                  (dSteps.finishUp ?? "Finish Up")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-start text-xs sm:text-sm">
                {submitted &&
                  (dSuccess.note ??
                    "It'll appear on the lesson shortly. You can change its visibility or remove it at any time.")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "browse" &&
                  (dDesc.selectSubject ??
                    "Filter by grade, swipe to explore subjects.")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "chapters" &&
                  (dDesc.selectChapter ??
                    "Choose the chapter this video belongs to.")}
                {!submitted &&
                  step === "select-lesson" &&
                  pane === "lessons" &&
                  (dDesc.selectLesson ??
                    "Choose the lesson this video belongs to.")}
                {!submitted &&
                  step === "add-video" &&
                  (dDesc.addVideo ??
                    "Choose a video file to upload or paste a video link.")}
                {!submitted &&
                  step === "finish-up" &&
                  (dDesc.finishUp ??
                    "Set who can see this video and its pricing.")}
              </DialogDescription>
            </motion.div>
          </div>
        </DialogHeader>

        {/* Step body. Two shells, one job each: the outer one animates the
          dialog's height between steps (so a 3-line step and a full lesson
          grid are one continuous movement, not a jump), the inner one owns
          the scroll and is what the height is measured from. */}
        <motion.div
          className="relative -mx-1 min-h-0 overflow-hidden"
          initial={false}
          animate={{ height: bodyHeight ?? "auto" }}
          transition={resizeTransition}
        >
          <div
            ref={attachBody}
            className="no-scrollbar max-h-[55vh] overflow-y-auto px-1 py-2"
          >
            <AnimatePresence mode="wait" custom={navDir} initial={false}>
              <motion.div
                key={panelKey}
                custom={navDir}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={panelTransition}
              >
                {/* Success — matching the school onboarding success dialog: a single
            centered column, the art on top, one muted lead line, the
            destination itself as the prominent clickable link, and the copy link action. */}
                {submitted && (
                  <div className="px-8 py-12 text-center">
                    {/* The same celebration the school-onboarding success dialog
                plays — every "you made it" surface in the product reads the
                same. */}
                    <CelebrationAnimation className="mb-4" />

                    {/* Success Message */}
                    <p className="text-muted-foreground mb-2 text-sm">
                      {dSuccess.lead ?? "Your video is on its way to"}
                    </p>

                    <h5 className="mb-6">
                      <Link
                        href={submitted.href}
                        className="text-primary font-medium underline transition-colors hover:opacity-80"
                      >
                        {submitted.lessonName}
                      </Link>
                    </h5>

                    {/* Copy video link - only icon is clickable */}
                    <div className="flex items-center justify-center gap-1.5">
                      {copied ? (
                        <>
                          <span className="text-xs text-green-700 dark:text-green-400">
                            {dSuccess.copiedToClipboard ||
                              "Copied to clipboard"}
                          </span>
                          <Check className="h-3 w-3 text-green-700 dark:text-green-400" />
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground text-xs">
                            {dSuccess.copyDetailsToClipboard ||
                              dSuccess.copyLinkToClipboard ||
                              "Copy link to clipboard"}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={
                              dSuccess.copyDetailsToClipboard ||
                              dSuccess.copyLinkToClipboard ||
                              "Copy link to clipboard"
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 1: Select lesson — a drill-down, not a form. Pane one
            browses grade → subject the way /lumos/courses does; pane two
            picks the lesson inside the chosen subject. */}
                {!submitted && step === "select-lesson" && (
                  <div className="space-y-4">
                    {/* The pick stays visible while browsing moves on past it. */}
                    {selectedLesson && (
                      <div className="bg-primary/5 border-primary/20 flex items-start gap-2 rounded-md border p-2.5">
                        <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {selectedLesson.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {lessonSubjectLabel(selectedLesson)} ·{" "}
                            {selectedLesson.chapterName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLesson(null)}
                          aria-label={dSearch.clear ?? "Clear selection"}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {pane === "browse" ? (
                      <>
                        {/* Numbered grade pills — single row horizontal scroll */}
                        {grades.length > 1 && (
                          <div className="no-scrollbar -mx-1 flex flex-nowrap items-center gap-1.5 overflow-x-auto px-1 py-0.5">
                            {grades.map((grade) => (
                              <button
                                key={grade.id}
                                type="button"
                                onClick={() => {
                                  setGradeFilter(grade.id)
                                }}
                                className={cn(
                                  "shrink-0 cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors",
                                  gradeFilter === grade.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {gradeNumberLabel(grade)}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Subjects horizontal scroll */}
                        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pt-3 pb-2">
                          {activeSubjects.length === 0 ? (
                            <div className="flex h-24 w-full items-center justify-center">
                              <p className="text-muted-foreground text-center text-sm">
                                {d.empty ??
                                  "No lessons available to upload to."}
                              </p>
                            </div>
                          ) : (
                            activeSubjects.map((subject) => (
                              <button
                                key={`${gradeFilter}-${subject.id}`}
                                type="button"
                                onClick={() => {
                                  setNavDir(1)
                                  setSubjectFilter(subject.id)
                                  setChapterFilter(ANY)
                                  setQuery("")
                                }}
                                className="group relative flex w-32 shrink-0 cursor-pointer flex-col overflow-hidden text-start transition-opacity hover:opacity-90"
                              >
                                {/* Thumbnail */}
                                <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
                                  {subject.imageUrl ? (
                                    <Image
                                      src={subject.imageUrl}
                                      alt={subject.name}
                                      fill
                                      className="object-cover"
                                      sizes="128px"
                                      unoptimized
                                    />
                                  ) : (
                                    <div
                                      className="text-muted-foreground flex size-full items-center justify-center"
                                      style={{
                                        backgroundColor:
                                          subject.color || undefined,
                                      }}
                                    >
                                      <BookOpen className="size-4 opacity-50" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="mt-1.5 min-w-0 flex-1 px-0.5">
                                  <p className="group-hover:text-primary truncate text-xs leading-tight font-medium transition-colors">
                                    {subject.name}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 truncate text-[10px] leading-tight">
                                    {(
                                      dSearch.chapterCount ?? "{count} chapters"
                                    ).replace(
                                      "{count}",
                                      String(subject.chapterCount ?? 0)
                                    )}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : pane === "chapters" ? (
                      <>
                        {/* Where you are: grade · subject */}
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">
                            {activeGrade ? gradeLabel(activeGrade) : ""}
                            {activeSubject ? ` · ${activeSubject.name}` : ""}
                          </p>
                        </div>

                        {/* Chapters horizontal scroll — mirrors first step closely, no chapter title above chapters grid */}
                        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pt-3 pb-2">
                          {chapters.length === 0 ? (
                            <div className="flex h-24 w-full items-center justify-center">
                              <p className="text-muted-foreground text-center text-sm">
                                {d.empty ?? "No chapters available."}
                              </p>
                            </div>
                          ) : (
                            chapters.map((ch) => (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => {
                                  setNavDir(1)
                                  setChapterFilter(ch.id)
                                  setQuery("")
                                }}
                                className="group relative flex w-32 shrink-0 cursor-pointer flex-col overflow-hidden text-start transition-opacity hover:opacity-90"
                              >
                                {/* Thumbnail */}
                                <div
                                  className="bg-muted relative aspect-video w-full overflow-hidden rounded-md"
                                  style={{
                                    backgroundColor:
                                      ch.color ||
                                      activeSubject?.color ||
                                      undefined,
                                  }}
                                >
                                  {ch.imageUrl || activeSubject?.imageUrl ? (
                                    <Image
                                      src={
                                        (ch.imageUrl ||
                                          activeSubject?.imageUrl)!
                                      }
                                      alt={ch.name}
                                      fill
                                      className="object-cover"
                                      sizes="128px"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="text-muted-foreground flex size-full items-center justify-center">
                                      <BookOpen className="size-4 opacity-50" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="mt-1.5 min-w-0 flex-1 px-0.5">
                                  <p className="group-hover:text-primary truncate text-xs leading-tight font-medium transition-colors">
                                    {ch.name}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 truncate text-[10px] leading-tight">
                                    {(
                                      dSearch.lessonCount ?? "{count} lessons"
                                    ).replace(
                                      "{count}",
                                      String(ch.lessonCount)
                                    )}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Where you are: grade · subject · chapter */}
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">
                            {activeGrade ? gradeLabel(activeGrade) : ""}
                            {activeSubject ? ` · ${activeSubject.name}` : ""}
                            {activeChapter ? ` · ${activeChapter.name}` : ""}
                          </p>
                        </div>

                        {/* Lessons horizontal scroll */}
                        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pt-3 pb-2">
                          {searching && filteredResults.length === 0 ? (
                            <div className="text-muted-foreground flex h-24 w-full items-center justify-center gap-2 text-sm">
                              <Loader2 className="size-4 animate-spin" />
                              {dSearch.loading ?? "Searching…"}
                            </div>
                          ) : filteredResults.length === 0 ? (
                            <div className="flex h-24 w-full items-center justify-center">
                              <p className="text-muted-foreground text-center text-sm">
                                {searchFailed
                                  ? (dSearch.failed ??
                                    "Search failed — check your connection and try again.")
                                  : (d.empty ??
                                    "No lessons available in this chapter.")}
                              </p>
                            </div>
                          ) : (
                            filteredResults.map((lesson) => (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => {
                                  setNavDir(1)
                                  setSelectedLesson(lesson)
                                  setStep("add-video")
                                }}
                                className="group relative flex w-32 shrink-0 cursor-pointer flex-col overflow-hidden text-start transition-opacity hover:opacity-90"
                              >
                                {/* Thumbnail */}
                                <div
                                  className="bg-muted relative aspect-video w-full overflow-hidden rounded-md"
                                  style={{
                                    backgroundColor:
                                      lesson.color ||
                                      activeChapter?.color ||
                                      activeSubject?.color ||
                                      undefined,
                                  }}
                                >
                                  {lesson.imageUrl ||
                                  activeChapter?.imageUrl ||
                                  activeSubject?.imageUrl ? (
                                    <Image
                                      src={
                                        (lesson.imageUrl ||
                                          activeChapter?.imageUrl ||
                                          activeSubject?.imageUrl)!
                                      }
                                      alt={lesson.name}
                                      fill
                                      className="object-cover"
                                      sizes="128px"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="text-muted-foreground flex size-full items-center justify-center">
                                      <Video className="size-4 opacity-50" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="mt-1.5 min-w-0 flex-1 px-0.5">
                                  <p className="group-hover:text-primary truncate text-xs leading-tight font-medium transition-colors">
                                    {lesson.name}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 truncate text-[10px] leading-tight">
                                    {lesson.durationMinutes
                                      ? `${lesson.durationMinutes} min`
                                      : lesson.chapterName}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Add video */}
                {!submitted && step === "add-video" && (
                  <div className="space-y-4">
                    {/* Where you are: lesson · subject · grade */}
                    {selectedLesson && (
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">
                          {selectedLesson.name} ·{" "}
                          {lessonSubjectLabel(selectedLesson)}
                        </p>
                      </div>
                    )}

                    {/* Video source toggles — matching bottom arrows */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant={
                          videoSource === "upload" ? "default" : "outline"
                        }
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          if (videoSource !== "upload") {
                            setVideoSource("upload")
                            if (uploadStatus !== "idle" || uploadedMeta)
                              clearUpload()
                            setVideoUrl("")
                          }
                        }}
                        aria-label={dFields.sourceUpload ?? "Upload"}
                        title={dFields.sourceUpload ?? "Upload"}
                      >
                        <Upload className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={videoSource === "url" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          if (videoSource !== "url") {
                            setVideoSource("url")
                            if (uploadStatus !== "idle" || uploadedMeta)
                              clearUpload()
                            setVideoUrl("")
                          }
                        }}
                        aria-label={dFields.sourceUrl ?? "URL"}
                        title={dFields.sourceUrl ?? "URL"}
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>

                    {videoSource === "upload" ? (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ALLOWED_UPLOAD_TYPES.join(",")}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) void handleFileSelected(file)
                          }}
                        />
                        {uploadStatus === "idle" || uploadStatus === "error" ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault()
                              setDragOver(true)
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setDragOver(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file) void handleFileSelected(file)
                            }}
                            className={cn(
                              "text-muted-foreground hover:border-primary/50 hover:text-foreground flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 text-center text-sm transition-colors",
                              dragOver &&
                                "border-primary bg-primary/5 text-foreground"
                            )}
                          >
                            <Upload className="mb-1 size-7 opacity-50" />
                            <p className="text-foreground text-xs font-medium">
                              {dFields.uploadDrop ??
                                "Choose video file or drag and drop"}
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              {dFields.uploadHint ?? "MP4, WebM, MOV up to 5GB"}
                            </p>
                            {/* The failed attempt states its own reason — quota,
                        permissions, or storage being down each need a
                        different response from the teacher. */}
                            {uploadStatus === "error" && uploadError && (
                              <p className="text-destructive mt-1 text-xs">
                                {uploadError}
                              </p>
                            )}
                          </button>
                        ) : uploadStatus === "uploading" ? (
                          <div className="border-border/80 flex h-36 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center">
                            <div className="w-52 max-w-full">
                              <Progress
                                value={uploadPct}
                                className="h-2 w-full rounded-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border-primary/40 bg-primary/5 flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 text-center text-sm">
                            <FileVideo className="text-primary size-6 opacity-80" />
                            <p className="text-foreground max-w-full truncate px-2 text-xs font-medium">
                              {uploadedMeta?.name}
                            </p>
                            <p className="text-muted-foreground flex items-center justify-center gap-1 text-[11px]">
                              <CheckCircle2 className="size-3 text-green-600" />
                              {dFields.uploadComplete ?? "Upload complete"}
                              {uploadedMeta
                                ? ` · ${formatBytes(uploadedMeta.size)}`
                                : null}
                              {uploadedMeta?.durationSeconds
                                ? ` · ${formatDuration(uploadedMeta.durationSeconds)}`
                                : null}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                clearUpload()
                                setVideoUrl("")
                              }}
                              className="text-muted-foreground hover:text-destructive mt-0.5 cursor-pointer text-[11px] underline-offset-2 transition-colors hover:underline"
                            >
                              {dFields.uploadRemove ?? "Remove"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder={
                            dFields.urlPlaceholder ??
                            "https://youtube.com/watch?v=... or https://vimeo.com/..."
                          }
                          type="url"
                        />
                        <p
                          className={cn(
                            "text-xs",
                            showUrlHint
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {showUrlHint
                            ? (dFields.urlInvalid ??
                              "That link doesn't look like a video — use YouTube, Vimeo, or a direct video file link.")
                            : (dFields.urlHelper ??
                              "Supports YouTube, Vimeo, or direct video URLs.")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Finish up — who can see it, and what it costs. */}
                {!submitted && step === "finish-up" && (
                  <div className="space-y-4">
                    {/* Where you are: lesson · subject · grade */}
                    {selectedLesson && (
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">
                          {selectedLesson.name} ·{" "}
                          {lessonSubjectLabel(selectedLesson)}
                        </p>
                      </div>
                    )}

                    {/* Access — the four real answers in one row. */}
                    <RadioGroup
                      value={`${audience}-${pricing}`}
                      onValueChange={(value) => {
                        const [nextAudience, nextPricing] = value.split(
                          "-"
                        ) as [VideoAudience, VideoPricing]
                        setAudience(nextAudience)
                        setPricing(nextPricing)
                      }}
                      className="grid grid-cols-4 gap-2"
                    >
                      {ACCESS_CHOICES.map(({ audience: a, pricing: pr }) => {
                        const value = `${a}-${pr}`
                        const selected = a === audience && pr === pricing
                        // One line, one weight — the two halves of the choice
                        // carry equal meaning, so neither is styled as the
                        // other's caption.
                        const label = `${
                          a === "PUBLIC"
                            ? (dAudience.public ?? "Public")
                            : (dAudience.private ?? "Private")
                        }/${
                          pr === "FREE"
                            ? (dPricing.free ?? "Free")
                            : (dPricing.paid ?? "Paid")
                        }`
                        return (
                          <div key={value}>
                            <RadioGroupItem
                              value={value}
                              id={`access-${value}`}
                              className="sr-only"
                            />
                            <label
                              htmlFor={`access-${value}`}
                              className={cn(
                                "hover:border-foreground/50 flex h-14 cursor-pointer items-center justify-center rounded-lg border px-1.5 text-center text-xs leading-tight transition-colors",
                                selected
                                  ? "border-foreground bg-accent"
                                  : "border-border"
                              )}
                            >
                              {label}
                            </label>
                          </div>
                        )
                      })}
                    </RadioGroup>

                    {/* Only the two paid choices have anything left to ask, so the
                price opens underneath the row it belongs to instead of
                holding a permanent slot beside it. The body's animated height
                does the reveal — the field only has to fade in behind it. */}
                    <AnimatePresence initial={false}>
                      {pricing === "PAID" && (
                        <motion.div
                          key="price-field"
                          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                          transition={{
                            ...panelTransition,
                            delay: reduceMotion ? 0 : 0.05,
                          }}
                          className="flex flex-wrap items-center gap-2"
                        >
                          {/* Field, its own up/down, then the school's
                            currency in muted — reading start-to-end, not a
                            boxed form. The native spinner is suppressed so the
                            steppers are the only ones and they sit where the
                            eye already is. */}
                          <div className="flex items-center">
                            <Input
                              autoFocus
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder={dFields.pricePlaceholder ?? "9.99"}
                              aria-label={dFields.price ?? "Price"}
                              className="h-8 w-24 [appearance:textfield] rounded-e-none text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <div className="border-input flex h-8 flex-col overflow-hidden rounded-e-md border border-s-0">
                              <button
                                type="button"
                                onClick={() => nudgePrice(1)}
                                aria-label={
                                  dFields.priceIncrease ?? "Increase price"
                                }
                                className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-4 w-6 cursor-pointer items-center justify-center transition-colors"
                              >
                                <ChevronUp className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => nudgePrice(-1)}
                                aria-label={
                                  dFields.priceDecrease ?? "Decrease price"
                                }
                                className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-4 w-6 cursor-pointer items-center justify-center transition-colors"
                              >
                                <ChevronDown className="size-3" />
                              </button>
                            </div>
                          </div>

                          <span className="text-muted-foreground font-mono text-[11px]">
                            {currency}
                          </span>

                          {/* What comparable videos on this course charge —
                            a starting point, one click away. Absent when the
                            course has no paid videos to average. */}
                          {suggestion && (
                            <button
                              type="button"
                              onClick={() =>
                                setPrice(suggestion.price.toFixed(2))
                              }
                              title={(
                                dFields.priceSimilarHint ??
                                "Average of {count} paid videos on this course"
                              ).replace(
                                "{count}",
                                String(suggestion.sampleSize)
                              )}
                              className="text-muted-foreground hover:border-foreground/50 hover:text-foreground border-border cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                            >
                              {(
                                dFields.priceSimilar ?? "Similar: {price}"
                              ).replace("{price}", suggestion.price.toFixed(2))}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <DialogFooter
          className={cn(
            "flex-row items-center justify-end gap-1.5 pt-2",
            submitted && "hidden"
          )}
        >
          {/* Back button — handles all backward navigation */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleBottomBack}
            disabled={!canGoBack}
            aria-label={dActions.back ?? "Back"}
            title={dActions.back ?? "Back"}
          >
            <ArrowLeft className="size-4 rtl:scale-x-[-1]" />
          </Button>

          {/* Next / Submit button — disabled until step requirements are met.
            Wrapped so the swap from an icon Next to the wider Submit is a
            crossfade rather than a control popping into existence. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
            >
              {step === "select-lesson" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    setNavDir(1)
                    setStep("add-video")
                  }}
                  disabled={!canProceedFromLesson}
                  aria-label={dActions.next ?? "Next"}
                  title={dActions.next ?? "Next"}
                >
                  <ArrowRight className="size-4 rtl:scale-x-[-1]" />
                </Button>
              )}
              {step === "add-video" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    setNavDir(1)
                    setStep("finish-up")
                  }}
                  disabled={!canProceedFromVideo}
                  aria-label={dActions.next ?? "Next"}
                  title={dActions.next ?? "Next"}
                >
                  <ArrowRight className="size-4 rtl:scale-x-[-1]" />
                </Button>
              )}
              {step === "finish-up" && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs font-medium"
                  onClick={handleSubmit}
                  disabled={!canProceedFromFinishUp || isPending}
                >
                  {dActions.submit ?? "Submit"}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
