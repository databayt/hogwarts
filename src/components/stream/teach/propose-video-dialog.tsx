"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Upload,
  Video,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  uploadVideo,
  type VideoAudience,
  type VideoPricing,
} from "@/components/stream/video/video-actions"

interface LessonOption {
  id: string
  name: string
  chapterName: string
  subjectName: string
  subjectSlug: string
}

interface Props {
  lessons: LessonOption[]
  children?: React.ReactNode
  dictionary?: Record<string, any>
}

type Step = "select-lesson" | "add-video" | "confirm"

export function ProposeVideoDialog({ lessons, children, dictionary }: Props) {
  const d = dictionary?.stream?.proposeVideo ?? {}
  const dSteps = d.steps ?? {}
  const dDesc = d.descriptions ?? {}
  const dFields = d.fields ?? {}
  const dAudience = d.audience ?? {}
  const dPricing = d.pricing ?? {}
  const dConfirm = d.confirm ?? {}
  const dActions = d.actions ?? {}
  const dToast = d.toast ?? {}
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("select-lesson")
  const [isPending, startTransition] = useTransition()

  // Form state
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [title, setTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [description, setDescription] = useState("")
  const [videoSource, setVideoSource] = useState<"url" | "upload">("url")
  const [audience, setAudience] = useState<VideoAudience>("SCHOOL")
  const [pricing, setPricing] = useState<VideoPricing>("FREE")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId)

  const resetForm = useCallback(() => {
    setStep("select-lesson")
    setSelectedLessonId("")
    setTitle("")
    setVideoUrl("")
    setDescription("")
    setVideoSource("url")
    setAudience("SCHOOL")
    setPricing("FREE")
    setPrice("")
    setCurrency("USD")
  }, [])

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
    if (!selectedLessonId || !title.trim() || !videoUrl.trim()) return

    const priceNumber = pricing === "PAID" ? Number(price) : undefined
    const currencyCode =
      pricing === "PAID" ? currency.trim().toUpperCase() : undefined

    startTransition(async () => {
      const result = await uploadVideo({
        catalogLessonId: selectedLessonId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim(),
        provider: detectProvider(videoUrl),
        audience,
        pricing,
        price: priceNumber,
        currency: currencyCode,
      })

      if (result.status === "success") {
        toast.success(
          dToast.success ??
            "Video submitted for review. You'll be notified when it's approved."
        )
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.message)
      }
    })
  }

  const canProceedFromLesson = !!selectedLessonId
  const isPaidValid =
    pricing === "FREE" || (Number(price) > 0 && currency.trim().length === 3)
  const canProceedFromVideo = !!videoUrl.trim() && !!title.trim() && isPaidValid

  // Group lessons by subject for easier browsing
  const lessonsBySubject = lessons.reduce(
    (acc, lesson) => {
      const key = lesson.subjectName
      if (!acc[key]) acc[key] = []
      acc[key].push(lesson)
      return acc
    },
    {} as Record<string, LessonOption[]>
  )

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
            {d.trigger ?? "Propose a Video"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
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

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(["select-lesson", "add-video", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : (
                          ["select-lesson", "add-video", "confirm"] as Step[]
                        ).indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {(["select-lesson", "add-video", "confirm"] as Step[]).indexOf(
                  step
                ) > i ? (
                  <Check className="size-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="bg-muted h-px w-8" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select lesson */}
        {step === "select-lesson" && (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {Object.entries(lessonsBySubject).map(
              ([subjectName, subjectLessons]) => (
                <div key={subjectName}>
                  <p className="text-muted-foreground sticky top-0 bg-white px-2 py-1 text-xs font-semibold">
                    {subjectName}
                  </p>
                  {subjectLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`w-full rounded-md px-3 py-2 text-start text-sm transition-colors ${
                        selectedLessonId === lesson.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">{lesson.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {lesson.chapterName}
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
            {lessons.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {d.empty ?? "No lessons available for video proposals."}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Add video */}
        {step === "add-video" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{dFields.title ?? "Video Title"}</Label>
              <Input
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
                onValueChange={(v) => setVideoSource(v as "url" | "upload")}
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
                  <p className="text-muted-foreground text-xs">
                    {dFields.urlHelper ??
                      "Supports YouTube, Vimeo, or direct video URLs."}
                  </p>
                </TabsContent>
                <TabsContent value="upload">
                  <div className="text-muted-foreground rounded-lg border-2 border-dashed p-8 text-center text-sm">
                    <Upload className="mx-auto mb-2 size-8 opacity-50" />
                    <p>
                      {dFields.uploadPlaceholderLine1 ??
                        "Direct upload coming soon."}
                    </p>
                    <p className="text-xs">
                      {dFields.uploadPlaceholderLine2 ??
                        "For now, use a YouTube or Vimeo URL."}
                    </p>
                  </div>
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
              <RadioGroup
                value={audience}
                onValueChange={(v) => setAudience(v as VideoAudience)}
                className="grid gap-2"
              >
                <label className="hover:bg-muted flex cursor-pointer items-start gap-3 rounded-md border p-3">
                  <RadioGroupItem value="PUBLIC" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {dAudience.public ?? "Public catalog"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {dAudience.publicHelper ??
                        "Visible to every school once approved."}
                    </p>
                  </div>
                </label>
                <label className="hover:bg-muted flex cursor-pointer items-start gap-3 rounded-md border p-3">
                  <RadioGroupItem value="SCHOOL" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {dAudience.school ?? "Just my school"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {dAudience.schoolHelper ??
                        "Only users in your school can see this video."}
                    </p>
                  </div>
                </label>
                <label className="hover:bg-muted flex cursor-pointer items-start gap-3 rounded-md border p-3">
                  <RadioGroupItem value="PRIVATE" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {dAudience.private ?? "Private"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {dAudience.privateHelper ??
                        "Only you can see this until you share it."}
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{dPricing.label ?? "Pricing"}</Label>
              <RadioGroup
                value={pricing}
                onValueChange={(v) => setPricing(v as VideoPricing)}
                className="grid grid-cols-2 gap-2"
              >
                <label className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-3">
                  <RadioGroupItem value="FREE" />
                  <span className="text-sm font-medium">
                    {dPricing.free ?? "Free"}
                  </span>
                </label>
                <label className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-3">
                  <RadioGroupItem value="PAID" />
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
          <div className="space-y-3">
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
                <span>{selectedLesson.subjectName}</span>
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
                <span className="max-w-48 truncate text-xs">{videoUrl}</span>
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
