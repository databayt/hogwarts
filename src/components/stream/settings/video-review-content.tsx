"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Loader2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import type { PendingVideoItem } from "./video-review-actions"
import { reviewVideo } from "./video-review-actions"

interface Props {
  videos: PendingVideoItem[]
  // PUBLIC/PAID videos surface across all schools, so only the platform lane
  // (DEVELOPER via /catalog/approvals) may approve them — the server enforces
  // this; the flag just keeps the UI honest.
  userRole?: string
  lang?: string
  // The `stream` dictionary subtree.
  dictionary?: Record<string, any>
}

export function VideoReviewContent({
  videos: initialVideos,
  userRole,
  lang = "en",
  dictionary,
}: Props) {
  const d = dictionary?.videoReview ?? {}
  const isDeveloper = userRole === "DEVELOPER"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({})
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null)
  // Track locally dismissed items for instant UI feedback
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const dateFmt = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    return (date: Date | string) => fmt.format(new Date(date))
  }, [lang])

  const videos = initialVideos.filter((v) => !dismissed.has(v.id))

  function handleApprove(videoId: string) {
    setReviewingId(videoId)
    startTransition(async () => {
      const result = await reviewVideo(videoId, "APPROVED")
      if (result.status === "success") {
        toast.success(d.toastApproved ?? result.message)
        setDismissed((prev) => new Set(prev).add(videoId))
        router.refresh()
      } else {
        toast.error(d.failedReview ?? result.message)
      }
      setReviewingId(null)
    })
  }

  function handleReject(videoId: string) {
    setReviewingId(videoId)
    startTransition(async () => {
      const result = await reviewVideo(
        videoId,
        "REJECTED",
        rejectionReasons[videoId]
      )
      if (result.status === "success") {
        toast.success(d.toastRejected ?? result.message)
        setDismissed((prev) => new Set(prev).add(videoId))
        setShowRejectInput(null)
        router.refresh()
      } else {
        toast.error(d.failedReview ?? result.message)
      }
      setReviewingId(null)
    })
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="text-muted-foreground mb-4 size-12" />
          <p className="text-muted-foreground text-sm">
            {d.emptyState ?? "No videos pending review."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Inbox className="size-5" />
        <h3 className="font-semibold">
          {videos.length} {d.pendingSuffix ?? "pending review"}
        </h3>
      </div>

      {videos.map((video) => {
        const isGlobalSurface = ["PUBLIC", "PAID"].includes(video.visibility)
        const platformOnly = isGlobalSurface && !isDeveloper
        return (
          <Card key={video.id}>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                {/* Submitter info */}
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={video.user.image || undefined} />
                  <AvatarFallback>
                    {(video.user.username || video.user.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {d.by ?? "by"} {video.user.username || video.user.email}{" "}
                        &middot; {dateFmt(video.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isGlobalSurface && (
                        <Badge variant="outline">{video.visibility}</Badge>
                      )}
                      <Badge variant="secondary">{video.provider}</Badge>
                    </div>
                  </div>

                  {/* Context */}
                  <p className="text-muted-foreground text-sm">
                    {video.lesson.chapter.subject.name} &rarr;{" "}
                    {video.lesson.chapter.name} &rarr; {video.lesson.name}
                  </p>

                  {video.description && (
                    <p className="text-sm">{video.description}</p>
                  )}

                  {/* Video link */}
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    {d.previewVideo ?? "Preview video"}{" "}
                    <ExternalLink className="size-3" />
                  </a>

                  {/* Actions */}
                  {platformOnly && (
                    <p className="text-muted-foreground text-xs">
                      {d.platformHint ??
                        "Public and paid videos are approved by the platform catalog team. You can still reject."}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(video.id)}
                      disabled={
                        platformOnly || (isPending && reviewingId === video.id)
                      }
                    >
                      {isPending && reviewingId === video.id ? (
                        <Loader2 className="me-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Check className="me-1.5 size-3.5" />
                      )}
                      {d.approve ?? "Approve"}
                    </Button>

                    {showRejectInput === video.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={
                            d.reasonPlaceholder ?? "Reason (optional)"
                          }
                          value={rejectionReasons[video.id] || ""}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [video.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-48"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(video.id)}
                          disabled={isPending && reviewingId === video.id}
                        >
                          {d.confirmReject ?? "Confirm Reject"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowRejectInput(null)}
                        >
                          {d.cancel ?? "Cancel"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRejectInput(video.id)}
                        disabled={isPending && reviewingId === video.id}
                      >
                        <X className="me-1.5 size-3.5" />
                        {d.reject ?? "Reject"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
