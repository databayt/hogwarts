// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import type { CommunityQuestionCard } from "../types"
import { truncate } from "../util"

interface Props {
  item: CommunityQuestionCard
}

export function QuestionCard({ item }: Props) {
  return (
    <Card className="flex h-full flex-col p-4">
      <CardContent className="flex flex-1 flex-col gap-2 p-0">
        <p className="line-clamp-4 text-sm leading-relaxed">
          {truncate(item.questionText, 200)}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {item.subjectName ? (
            <Badge variant="secondary" className="font-normal">
              {item.subjectName}
            </Badge>
          ) : null}
          <Badge variant="outline" className="font-normal">
            {humanize(item.questionType)}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {humanize(item.difficulty)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase()
}
