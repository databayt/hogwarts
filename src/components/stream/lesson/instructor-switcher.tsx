"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { AvailableVideo } from "@/components/stream/data/catalog/get-lesson-with-progress"
import { purchaseVideo } from "@/components/stream/video/video-purchase-actions"

interface Props {
  videos: AvailableVideo[]
  activeVideoId: string | null
  onSwitch: (videoId: string) => void
  className?: string
  dictionary?: Record<string, any>
}

function sourceLabel(
  v: AvailableVideo,
  d: { hogwarts: string; yourSchool: string; partnerSchool: string }
): string {
  if (v.source === "featured") return d.hogwarts
  if (v.source === "own-school") return v.school.name ?? d.yourSchool
  return v.school.name ?? d.partnerSchool
}

export function InstructorSwitcher({
  videos,
  activeVideoId,
  onSwitch,
  className,
  dictionary,
}: Props) {
  // Receives the `stream` dictionary subtree from the lesson content component,
  // so descend a single level (not `?.stream?.instructorSwitcher`).
  const d = dictionary?.instructorSwitcher ?? {}
  const labels = {
    hogwarts: d.hogwarts ?? "Hogwarts",
    yourSchool: d.yourSchool ?? "Your school",
    partnerSchool: d.partnerSchool ?? "Partner school",
  }
  const [isPending, startTransition] = useTransition()

  if (videos.length <= 1) return null

  function handleUnlock(videoId: string) {
    startTransition(async () => {
      const result = await purchaseVideo(videoId)
      if (result.status === "success" && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
        return
      }
      toast.error(
        result.message ?? d.errors?.startPurchase ?? "Failed to start purchase"
      )
    })
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 overflow-x-auto pb-2",
        className
      )}
    >
      {videos.map((video) => {
        const isActive = video.id === activeVideoId
        const locked = video.requiresPayment && !video.hasPurchased
        const instructorName = video.instructor.name ?? "Instructor"

        return (
          <button
            key={video.id}
            type="button"
            onClick={() => {
              if (locked) return
              onSwitch(video.id)
            }}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-muted border-border",
              locked && "opacity-80"
            )}
          >
            <Avatar className="size-6">
              <AvatarImage src={video.instructor.image ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {instructorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex flex-col items-start leading-tight">
              <span className="font-medium">{instructorName}</span>
              <span className="text-muted-foreground text-[10px]">
                {sourceLabel(video, labels)}
              </span>
            </span>
            {locked && (
              <span
                className="ms-1 inline-flex items-center gap-1"
                role="presentation"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnlock(video.id)
                }}
              >
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-6 rounded-full px-2 text-[10px]"
                  disabled={isPending}
                >
                  <span className="inline-flex items-center gap-1">
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Lock className="size-3" />
                    )}
                    {video.price != null
                      ? `${video.price.toFixed(2)} ${video.currency ?? ""}`
                      : (d.unlock ?? "Unlock")}
                  </span>
                </Button>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
