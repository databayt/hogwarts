// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Library } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CatalogImage } from "@/components/ui/catalog-image"

import type { CommunityBookCard } from "../types"

interface Props {
  item: CommunityBookCard
}

export function BookCard({ item }: Props) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div
        className="bg-muted relative aspect-[3/4] w-full overflow-hidden"
        style={item.coverKey ? undefined : { backgroundColor: item.coverColor }}
      >
        {item.coverKey ? (
          <CatalogImage
            thumbnail={item.coverKey}
            size="md"
            alt={item.title}
            className="h-full w-full"
          />
        ) : (
          <div className="text-background/60 flex h-full w-full items-center justify-center">
            <Library className="size-10" aria-hidden />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-tight font-semibold tracking-tight">
          {item.title}
        </h3>
        <p className="text-muted-foreground line-clamp-1 text-sm">
          {item.author}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-xs">
          <Badge variant="secondary" className="font-normal">
            {item.genre}
          </Badge>
          {item.subjectName ? (
            <Badge variant="outline" className="font-normal">
              {item.subjectName}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
