// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CheckCircle2, ExternalLink, Inbox } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import type { SubmittedVideoItem } from "./video-review-actions"

/**
 * The school's submission STATUS FEED.
 *
 * Every video now goes through one pipeline — the school uploads, the platform
 * decides — so this surface deliberately carries no approve/reject controls.
 * It exists so a school can see where each of its submissions stands and read
 * back the platform's feedback on anything rejected. Hiding the mechanics must
 * never hide actionable feedback.
 *
 * Once the mutation UI went, every piece of client state went with it — this is
 * a Server Component now, and should stay one.
 */
interface Props {
  videos: SubmittedVideoItem[]
  lang?: string
  // The `lumos` dictionary subtree.
  dictionary?: Record<string, any>
}

const STATUS_VARIANT: Record<
  string,
  "secondary" | "default" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
}

export function VideoReviewContent({ videos, lang = "en", dictionary }: Props) {
  const d = dictionary?.videoReview ?? {}
  const locale = lang === "ar" ? "ar" : "en"
  const dateFmt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const statusLabel = (status: string) =>
    d.status?.[status.toLowerCase()] ??
    status.charAt(0) + status.slice(1).toLowerCase()

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="text-muted-foreground mb-4 size-12" />
          <p className="text-muted-foreground text-sm">
            {d.emptyState ?? "No videos submitted yet."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const pendingCount = videos.filter(
    (v) => v.approvalStatus === "PENDING"
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Inbox className="size-5" />
        <h3 className="font-semibold">
          {videos.length} {d.submittedSuffix ?? "submitted"}
        </h3>
      </div>

      <p className="text-muted-foreground text-sm">
        {pendingCount > 0
          ? (d.awaitingPlatform ??
            "The platform team reviews every submission. Videos go live on their lesson once approved.")
          : (d.allReviewed ?? "Everything here has been reviewed.")}
      </p>

      {videos.map((video) => (
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
                      &middot; {dateFmt.format(video.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={
                        STATUS_VARIANT[video.approvalStatus] ?? "outline"
                      }
                    >
                      {statusLabel(video.approvalStatus)}
                    </Badge>
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

                {/* Rejection feedback — the reason this feed shows non-PENDING
                    rows at all. */}
                {video.approvalStatus === "REJECTED" &&
                  video.rejectionReason && (
                    <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3">
                      <p className="text-xs font-medium">
                        {d.whatToFix ?? "What to fix"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {video.rejectionReason}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
