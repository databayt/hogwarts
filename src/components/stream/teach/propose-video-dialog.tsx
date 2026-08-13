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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileVideo,
  Globe,
  Loader2,
  Lock,
  School,
  Upload,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { isValidVideoUrl } from "@/components/stream/shared/url-validators"
import {
  uploadVideo,
  type VideoAudience,
  type VideoPricing,
} from "@/components/stream/video/video-actions"

import type {
  ProposableChapter,
  ProposableGrade,
  ProposableLesson,
} from "./get-proposable-lessons"

interface Props {
  /**
   * The grade → subject tree the caller may contribute to — a couple of
   * hundred rows at most. Chapters and lessons are never shipped up front;
   * step 1 walks down to them through the two /api/stream/proposable-*
   * endpoints.
   */
  grades: ProposableGrade[]
  /** Display locale — the picker's search results translate to it. */
  lang?: string
  children?: React.ReactNode
  dictionary?: Record<string, any>
}

/** Radix Select forbids an empty item value, so "no filter" needs a sentinel. */
const ANY = "__all__"

type Step = "select-lesson" | "add-video" | "confirm"

const STEPS: Step[] = ["select-lesson", "add-video", "confirm"]

type UploadStatus = "idle" | "uploading" | "done" | "error"

interface UploadedMeta {
  name: string
  size: number
  key: string
  storageProvider: string
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
}: Props) {
  // Callers pass either the full dictionary (teacher dashboard) or the
  // `stream` subtree (settings videos tab) — accept both.
  const d = dictionary?.stream?.proposeVideo ?? dictionary?.proposeVideo ?? {}
  const dSteps = d.steps ?? {}
  const dDesc = d.descriptions ?? {}
  const dFields = d.fields ?? {}
  const dAudience = d.audience ?? {}
  const dPricing = d.pricing ?? {}
  const dConfirm = d.confirm ?? {}
  const dActions = d.actions ?? {}
  const dToast = d.toast ?? {}
  const dSearch = d.search ?? {}
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
  const [title, setTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [description, setDescription] = useState("")
  const [videoSource, setVideoSource] = useState<"url" | "upload">("url")
  const [audience, setAudience] = useState<VideoAudience>("SCHOOL")
  const [pricing, setPricing] = useState<VideoPricing>("FREE")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")

  // Direct-to-S3 upload state (presign → PUT). On success `videoUrl` holds the
  // final CDN URL and `uploadedMeta` carries key/size for quota + invalidation.
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadPct, setUploadPct] = useState(0)
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
    setUploadedMeta(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const resetForm = useCallback(() => {
    setStep("select-lesson")
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
    setTitle("")
    setVideoUrl("")
    setDescription("")
    setVideoSource("url")
    setAudience("SCHOOL")
    setPricing("FREE")
    setPrice("")
    setCurrency("USD")
    clearUpload()
  }, [clearUpload, grades])

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

      // A file name is usually the intended title — prefill, never overwrite.
      setTitle((current) =>
        current.trim() ? current : file.name.replace(/\.[^./]+$/, "")
      )

      setUploadStatus("uploading")
      setUploadPct(0)
      setVideoUrl("")
      setUploadedMeta(null)

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
          throw new Error(body?.error || "presign-failed")
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
        })
        setUploadPct(100)
        setUploadStatus("done")
      } catch (error) {
        xhrRef.current = null
        if ((error as Error).message === "upload-aborted") {
          setUploadStatus("idle")
          return
        }
        console.error("Direct video upload failed:", error)
        setUploadStatus("error")
        toast.error(dFields.uploadFailed ?? "Upload failed. Please try again.")
      }
    },
    // Primitives, not `dFields` — the subtree is re-created every render when
    // a caller's dictionary lacks it, which would churn this callback.
    [dFields.uploadInvalidType, dFields.uploadTooLarge, dFields.uploadFailed]
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
    if (!selectedLesson || !title.trim() || !videoUrl.trim()) return

    const priceNumber = pricing === "PAID" ? Number(price) : undefined
    const currencyCode =
      pricing === "PAID" ? currency.trim().toUpperCase() : undefined
    const isDirectUpload = videoSource === "upload" && uploadedMeta !== null

    startTransition(async () => {
      const result = await uploadVideo({
        catalogLessonId: selectedLesson.id,
        title: title.trim(),
        description: description.trim() || undefined,
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
            }
          : {}),
      })

      if (result.status === "success") {
        // The Video row now owns the uploaded object — nothing to clean up.
        cleanupKeyRef.current = null
        toast.success(
          dToast.success ??
            "Video uploaded. It'll appear on the lesson shortly."
        )
        setOpen(false)
        resetForm()
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
  // the presigned CDN URL, which is valid by construction.
  const urlOk =
    videoSource === "upload" ? !!videoUrl : isValidVideoUrl(videoUrl.trim())
  const showUrlHint =
    videoSource === "url" &&
    !!videoUrl.trim() &&
    !isValidVideoUrl(videoUrl.trim())
  const canProceedFromVideo = urlOk && !!title.trim() && isPaidValid

  // Bare padded number for the pill row (mirrors /lumos/courses), and the
  // spelled label for places that need a word — breadcrumb, step-2 chip,
  // confirm. Both derive from the number: school grade names are prose that
  // translates inconsistently and sorts badly.
  const gradeNumberLabel = useCallback(
    (grade: ProposableGrade) =>
      grade.gradeNumber === 0
        ? (dSearch.ungraded ?? "Ungraded")
        : String(grade.gradeNumber).padStart(2, "0"),
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

  const activeGrade = useMemo(
    () => grades.find((grade) => grade.id === gradeFilter) ?? grades[0],
    [grades, gradeFilter]
  )
  const activeSubjects = activeGrade?.subjects ?? []
  const activeSubject = activeSubjects.find(
    (subject) => subject.id === subjectFilter
  )

  // Step 1 is a drill-down, not a form: pane one browses grade → subject the
  // way the catalog page does, pane two picks the lesson inside it.
  const pane = subjectFilter === ANY ? "browse" : "lessons"

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
          `/api/stream/proposable-chapters?${params.toString()}`,
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
          `/api/stream/proposable-lessons?${params.toString()}`,
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
  }, [step])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Video className="me-2 size-4" />
            {d.trigger ?? "Upload Video"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select-lesson" &&
              (dSteps.selectLesson ?? "Select Lesson")}
            {step === "add-video" && (dSteps.addVideo ?? "Add Your Video")}
            {step === "confirm" && (dSteps.confirm ?? "Review & Submit")}
          </DialogTitle>
          <DialogDescription>
            {step === "select-lesson" &&
              (dDesc.selectLesson ??
                "Choose which lesson you want to contribute a video for.")}
            {step === "add-video" &&
              (dDesc.addVideo ??
                "Provide the video URL and details. Your video will be reviewed before going live.")}
            {step === "confirm" &&
              (dDesc.confirm ??
                "Review your submission. You retain full ownership and control over your video.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators — a completed step is a button back to it. */}
        <div className="flex items-center justify-center gap-2 py-1">
          {STEPS.map((s, i) => {
            const done = STEPS.indexOf(step) > i
            const stepName =
              s === "select-lesson"
                ? (dSteps.selectLesson ?? "Select Lesson")
                : s === "add-video"
                  ? (dSteps.addVideo ?? "Add Your Video")
                  : (dSteps.confirm ?? "Review & Submit")
            return (
              <div key={s} className="flex items-center gap-2">
                {done ? (
                  <button
                    type="button"
                    onClick={() => !isPending && setStep(s)}
                    aria-label={stepName}
                    className="bg-primary/20 text-primary hover:bg-primary/30 flex size-7 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors"
                  >
                    <Check className="size-3.5" />
                  </button>
                ) : (
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-medium",
                      s === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </div>
                )}
                {i < 2 && <div className="bg-muted h-px w-8" />}
              </div>
            )
          })}
        </div>

        {/* Scrollable step body — header, dots and footer stay put. */}
        <div
          ref={bodyRef}
          className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1"
        >
          {/* Step 1: Select lesson — a drill-down, not a form. Pane one
            browses grade → subject the way /lumos/courses does; pane two
            picks the lesson inside the chosen subject. */}
          {step === "select-lesson" && (
            <div className="animate-in fade-in-0 space-y-3 duration-200">
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
                  {/* Numbered grade pills — same control as the catalog page. */}
                  {grades.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {grades.map((grade) => (
                        <button
                          key={grade.id}
                          type="button"
                          onClick={() => setGradeFilter(grade.id)}
                          className={cn(
                            "cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors",
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

                  {/* Subjects of the active grade. */}
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {activeSubjects.length === 0 ? (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        {d.empty ?? "No lessons available to upload to."}
                      </p>
                    ) : (
                      activeSubjects.map((subject) => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => {
                            setSubjectFilter(subject.id)
                            setChapterFilter(ANY)
                            setQuery("")
                          }}
                          className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-3 py-2 text-start transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {subject.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {(
                                dSearch.lessonCount ?? "{count} lessons"
                              ).replace("{count}", String(subject.lessonCount))}
                            </p>
                          </div>
                          <ChevronRight className="text-muted-foreground size-4 shrink-0 rtl:scale-x-[-1]" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Where you are, and the way back up. */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setSubjectFilter(ANY)
                        setChapterFilter(ANY)
                        setQuery("")
                      }}
                    >
                      <ArrowLeft className="size-3.5 rtl:scale-x-[-1]" />
                      {dActions.back ?? "Back"}
                    </Button>
                    <p className="text-muted-foreground min-w-0 truncate text-xs">
                      {activeGrade ? gradeLabel(activeGrade) : ""}
                      {activeSubject ? ` · ${activeSubject.name}` : ""}
                    </p>
                  </div>

                  {chapters.length > 0 && (
                    <Select
                      value={chapterFilter}
                      onValueChange={setChapterFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={dSearch.allChapters ?? "All chapters"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>
                          {dSearch.allChapters ?? "All chapters"}
                        </SelectItem>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.name} ({chapter.lessonCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Command shouldFilter={false} className="rounded-md border">
                    <div className="relative">
                      <CommandInput
                        autoFocus
                        value={query}
                        onValueChange={setQuery}
                        placeholder={dSearch.placeholder ?? "Search lessons…"}
                        className="pe-8"
                      />
                      {/* In-flight over existing results: a quiet corner spinner —
                        swapping the list for a loader on every keystroke flickers. */}
                      {searching && filteredResults.length > 0 && (
                        <Loader2 className="text-muted-foreground absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                    <CommandList
                      className={cn(
                        "max-h-64 transition-opacity",
                        searching && filteredResults.length > 0 && "opacity-60"
                      )}
                    >
                      {searching && filteredResults.length === 0 ? (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                          <Loader2 className="size-4 animate-spin" />
                          {dSearch.loading ?? "Searching…"}
                        </div>
                      ) : filteredResults.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                          {searchFailed
                            ? (dSearch.failed ??
                              "Search failed — check your connection and try again.")
                            : query.trim()
                              ? (dSearch.empty ??
                                "No lessons match that search.")
                              : (d.empty ??
                                "No lessons available to upload to.")}
                        </p>
                      ) : (
                        groupedResults.map(([groupName, groupLessons]) => (
                          <CommandGroup
                            key={groupName || "all"}
                            heading={groupName || undefined}
                          >
                            {groupLessons.map((lesson) => (
                              <CommandItem
                                key={lesson.id}
                                value={lesson.id}
                                onSelect={() => {
                                  // Picking IS the decision — advance. Back (or a
                                  // completed step dot) returns with state intact.
                                  setSelectedLesson(lesson)
                                  setStep("add-video")
                                }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {lesson.name}
                                  </p>
                                </div>
                                {selectedLesson?.id === lesson.id && (
                                  <Check className="text-primary size-4 shrink-0" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))
                      )}
                    </CommandList>
                  </Command>

                  {hasMore && !searching && (
                    <p className="text-muted-foreground text-xs">
                      {(
                        dSearch.truncated ??
                        "Showing the first {count} — pick a chapter or search to narrow it down."
                      ).replace("{count}", String(filteredResults.length))}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Add video */}
          {step === "add-video" && (
            <div className="animate-in fade-in-0 space-y-4 duration-200">
              {/* Which lesson this video is for — the step-1 pick, kept in view. */}
              {selectedLesson && (
                <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-xs">
                  <Video className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {selectedLesson.name} · {lessonSubjectLabel(selectedLesson)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>{dFields.title ?? "Video Title"}</Label>
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    dFields.titlePlaceholder ??
                    "e.g. Introduction to Algebra - Lesson 1"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{dFields.source ?? "Video Source"}</Label>
                <Tabs
                  value={videoSource}
                  onValueChange={(v) => {
                    const next = v as "url" | "upload"
                    setVideoSource(next)
                    // Don't carry a URL across sources: the S3 finalUrl must not
                    // appear (editable) in the URL field, nor a pasted URL count
                    // as an upload.
                    if (next === "url" && uploadedMeta) {
                      clearUpload()
                      setVideoUrl("")
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">
                      <ExternalLink className="me-1.5 size-3.5" />
                      {dFields.sourceUrl ?? "URL"}
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                      <Upload className="me-1.5 size-3.5" />
                      {dFields.sourceUpload ?? "Upload"}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="space-y-2">
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
                  </TabsContent>
                  <TabsContent value="upload" className="space-y-2">
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
                          // Type/size guards live in handleFileSelected.
                          if (file) void handleFileSelected(file)
                        }}
                        className={cn(
                          "text-muted-foreground hover:border-primary/50 hover:text-foreground w-full rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors",
                          dragOver &&
                            "border-primary bg-primary/5 text-foreground"
                        )}
                      >
                        <Upload className="mx-auto mb-2 size-8 opacity-50" />
                        <p>
                          {dFields.uploadDrop ?? "Click to choose a video file"}
                        </p>
                        <p className="text-xs">
                          {dFields.uploadDragHint ??
                            "…or drag and drop it here"}
                        </p>
                        <p className="text-xs">
                          {dFields.uploadHint ??
                            "MP4, WebM, MOV or AVI — up to 5GB"}
                        </p>
                      </button>
                    ) : uploadStatus === "uploading" ? (
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="size-4 shrink-0 animate-spin" />
                          <span className="truncate">
                            {dFields.uploading ?? "Uploading…"} {uploadPct}%
                          </span>
                          <button
                            type="button"
                            onClick={clearUpload}
                            className="text-muted-foreground hover:text-foreground ms-auto"
                            aria-label={dFields.uploadCancel ?? "Cancel upload"}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <Progress value={uploadPct} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border p-4">
                        <FileVideo className="text-muted-foreground size-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {uploadedMeta?.name}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <CheckCircle2 className="size-3 text-green-600" />
                            {dFields.uploadComplete ?? "Upload complete"}
                            {uploadedMeta
                              ? ` · ${formatBytes(uploadedMeta.size)}`
                              : null}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            clearUpload()
                            setVideoUrl("")
                          }}
                        >
                          {dFields.uploadRemove ?? "Remove"}
                        </Button>
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {dFields.uploadQuotaNote ??
                        "Uploaded files count toward your school's video storage quota."}
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>{dFields.description ?? "Description (optional)"}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    dFields.descriptionPlaceholder ??
                    "Brief description of what this video covers..."
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{dAudience.label ?? "Audience"}</Label>
                {/* Compact cards; the helper line below describes the current
                  pick — three stacked helper paragraphs made this step tall. */}
                <RadioGroup
                  value={audience}
                  onValueChange={(v) => setAudience(v as VideoAudience)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(
                    [
                      {
                        value: "PUBLIC",
                        icon: Globe,
                        label: dAudience.public ?? "Public catalog",
                      },
                      {
                        value: "SCHOOL",
                        icon: School,
                        label: dAudience.school ?? "Just my school",
                      },
                      {
                        value: "PRIVATE",
                        icon: Lock,
                        label: dAudience.private ?? "Private",
                      },
                    ] as const
                  ).map(({ value, icon: Icon, label }) => (
                    <label
                      key={value}
                      className="hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:focus-visible]:ring-ring/50 flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-2.5 text-center transition-colors has-[:focus-visible]:ring-[3px]"
                    >
                      <RadioGroupItem value={value} className="sr-only" />
                      <Icon className="text-muted-foreground size-4" />
                      <span className="text-xs leading-tight font-medium">
                        {label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <p className="text-muted-foreground text-xs">
                  {audience === "PUBLIC"
                    ? (dAudience.publicHelper ??
                      "Visible to every school once approved.")
                    : audience === "SCHOOL"
                      ? (dAudience.schoolHelper ??
                        "Only users in your school can see this video.")
                      : (dAudience.privateHelper ??
                        "Only you can see this until you share it.")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{dPricing.label ?? "Pricing"}</Label>
                <RadioGroup
                  value={pricing}
                  onValueChange={(v) => setPricing(v as VideoPricing)}
                  className="grid grid-cols-2 gap-2"
                >
                  <label className="hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center justify-center rounded-md border p-2.5 transition-colors has-[:focus-visible]:ring-[3px]">
                    <RadioGroupItem value="FREE" className="sr-only" />
                    <span className="text-sm font-medium">
                      {dPricing.free ?? "Free"}
                    </span>
                  </label>
                  <label className="hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center justify-center rounded-md border p-2.5 transition-colors has-[:focus-visible]:ring-[3px]">
                    <RadioGroupItem value="PAID" className="sr-only" />
                    <span className="text-sm font-medium">
                      {dPricing.paid ?? "Paid"}
                    </span>
                  </label>
                </RadioGroup>
                {pricing === "PAID" && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {dFields.price ?? "Price"}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={dFields.pricePlaceholder ?? "9.99"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {dFields.currency ?? "Currency"}
                      </Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  {dPricing.helper ??
                    "A reviewer may adjust audience or pricing before approving."}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedLesson && (
            <div className="animate-in fade-in-0 space-y-3 duration-200">
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.lesson ?? "Lesson"}
                  </span>
                  <span className="font-medium">{selectedLesson.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.course ?? "Course"}
                  </span>
                  <span>{lessonSubjectLabel(selectedLesson)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.title ?? "Title"}
                  </span>
                  <span>{title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.source ?? "Source"}
                  </span>
                  <span className="max-w-48 truncate text-xs">
                    {videoSource === "upload" && uploadedMeta
                      ? uploadedMeta.name
                      : videoUrl}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.audience ?? "Audience"}
                  </span>
                  <span>
                    {audience === "PUBLIC"
                      ? (dAudience.public ?? "Public catalog")
                      : audience === "SCHOOL"
                        ? (dAudience.school ?? "Just my school")
                        : (dAudience.private ?? "Private")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dConfirm.pricing ?? "Pricing"}
                  </span>
                  <span>
                    {pricing === "PAID"
                      ? (dPricing.paidSummary ?? "Paid · {price} {currency}")
                          .replace("{price}", Number(price).toFixed(2))
                          .replace("{currency}", currency)
                      : (dPricing.free ?? "Free")}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <p className="mb-1 font-medium">
                  {dConfirm.rightsTitle ?? "Your rights are protected"}
                </p>
                <ul className="list-inside list-disc space-y-0.5">
                  <li>
                    {dConfirm.rightsOwnership ??
                      "You retain full ownership of your video"}
                  </li>
                  <li>
                    {dConfirm.rightsVisibility ??
                      "You can change visibility or delete at any time"}
                  </li>
                  <li>
                    {dConfirm.rightsReview ??
                      "Admin review is required before the video goes live"}
                  </li>
                  <li>
                    {dConfirm.rightsControl ??
                      "Even after approval, you control who can see your video"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          {step !== "select-lesson" && (
            <Button
              variant="outline"
              onClick={() =>
                setStep(step === "confirm" ? "add-video" : "select-lesson")
              }
              disabled={isPending}
            >
              <ArrowLeft className="me-1.5 size-3.5 rtl:scale-x-[-1]" />
              {dActions.back ?? "Back"}
            </Button>
          )}
          <div className="flex-1" />
          {step === "select-lesson" && (
            <Button
              onClick={() => setStep("add-video")}
              disabled={!canProceedFromLesson}
            >
              {dActions.next ?? "Next"}
              <ArrowRight className="ms-1.5 size-3.5 rtl:scale-x-[-1]" />
            </Button>
          )}
          {step === "add-video" && (
            <Button
              onClick={() => setStep("confirm")}
              disabled={!canProceedFromVideo}
            >
              {dActions.review ?? "Review"}
              <ArrowRight className="ms-1.5 size-3.5 rtl:scale-x-[-1]" />
            </Button>
          )}
          {step === "confirm" && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {dActions.submit ?? "Submit for Review"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
