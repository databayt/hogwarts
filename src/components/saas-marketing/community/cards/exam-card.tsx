// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import type { CommunityExamCard } from "../types"

interface Props {
  item: CommunityExamCard
}

export function ExamCard({ item }: Props) {
  return (
    <Card className="flex h-full flex-col p-4">
      <CardContent className="flex flex-1 flex-col gap-2 p-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base leading-tight font-semibold tracking-tight">
            {item.title}
          </h3>
          <Badge variant="outline" className="shrink-0 font-normal">
            {item.examType}
          </Badge>
        </div>
        {item.description ? (
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-xs">
          <Badge variant="secondary" className="font-normal">
            {item.subjectName}
          </Badge>
          {item.totalQuestions ? (
            <Badge variant="outline" className="font-normal">
              {item.totalQuestions} Q
            </Badge>
          ) : null}
          {item.durationMinutes ? (
            <Badge variant="outline" className="font-normal">
              {item.durationMinutes} min
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
