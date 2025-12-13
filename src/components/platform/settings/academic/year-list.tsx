"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil, Trash2, Calendar } from "lucide-react"
import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
import type { SchoolYear } from "./types"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface YearListProps {
  years: SchoolYear[]
  selectedYearId: string | null
  onSelectYear: (yearId: string) => void
  onEditYear: (year: SchoolYear) => void
  onDeleteYear: (yearId: string) => void
  dictionary?: Dictionary
  isLoading?: boolean
}

export function YearList({
  years,
  selectedYearId,
  onSelectYear,
  onEditYear,
  onDeleteYear,
  dictionary,
  isLoading = false,
}: YearListProps) {
  const dict = useAcademicDictionary(dictionary)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading academic years">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-3 mt-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading academic years...</span>
      </div>
    )
  }

  if (years.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Calendar className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.noYears || "No academic years configured"}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {dict.addYearHint || "Add a year to get started"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {years.map((year) => (
        <div
          key={year.id}
          onClick={() => onSelectYear(year.id)}
          className={cn(
            "group relative rounded-lg border p-4 cursor-pointer transition-all",
            "hover:border-primary/50 hover:bg-accent/50",
            selectedYearId === year.id
              ? "border-primary bg-accent"
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{year.yearName}</h4>
                {selectedYearId === year.id && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {dict.selected || "Selected"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(year.startDate)} - {formatDate(year.endDate)}
              </p>
              {year._count && (
                <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                  <span>
                    {year._count.terms} {dict.terms || "terms"}
                  </span>
                  <span>
                    {year._count.periods} {dict.periods || "periods"}
                  </span>
                </div>
              )}
            </div>

            {/* Actions - visible on hover */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditYear(year)
                }}
                aria-label={`${dict.edit || "Edit"} ${year.yearName}`}
                title={`${dict.edit || "Edit"} ${year.yearName}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteYear(year.id)
                }}
                aria-label={`${dict.delete || "Delete"} ${year.yearName}`}
                title={`${dict.delete || "Delete"} ${year.yearName}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
