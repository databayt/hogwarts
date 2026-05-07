// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CatalogImage } from "@/components/ui/catalog-image"

import type { CommunityTextbookCard } from "../types"

interface Props {
  item: CommunityTextbookCard
}

export function TextbookCard({ item }: Props) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
        <CatalogImage
          thumbnail={item.coverKey}
          size="md"
          alt={item.title}
          className="h-full w-full"
        />
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-tight font-semibold tracking-tight">
          {item.title}
        </h3>
        {item.author ? (
          <p className="text-muted-foreground line-clamp-1 text-sm">
            {item.author}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          <Badge variant="secondary" className="font-normal">
            {item.subjectName}
          </Badge>
          {item.curriculumName ? (
            <Badge variant="outline" className="font-normal">
              {item.curriculumName}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
