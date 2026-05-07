// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PlayCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import type { CommunityVideoCard } from "../types"
import { formatVideoDuration } from "../util"

interface Props {
  item: CommunityVideoCard
}

export function VideoCard({ item }: Props) {
  const duration = formatVideoDuration(item.durationSeconds)

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <PlayCircle className="size-10" aria-hidden />
          </div>
        )}
        {duration ? (
          <span className="bg-foreground/80 text-background absolute end-2 bottom-2 rounded px-1.5 py-0.5 text-xs">
            {duration}
          </span>
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-tight font-semibold tracking-tight">
          {item.title}
        </h3>
        <p className="text-muted-foreground line-clamp-1 text-sm">
          {item.subjectName} · {item.lessonName}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-xs">
          {item.isFeatured ? (
            <Badge className="font-normal">Featured</Badge>
          ) : null}
          {item.viewCount > 0 ? (
            <Badge variant="outline" className="font-normal">
              {item.viewCount.toLocaleString()} views
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
