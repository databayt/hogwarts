"use client"

import * as React from "react"
import { Calendar, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { SchoolYear } from "./types"

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
      <div
        className="space-y-2"
        role="status"
        aria-label="Loading academic years"
      >
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-border rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="mt-2 flex gap-3">
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
        <div className="bg-muted mb-4 rounded-full p-3">
          <Calendar
            className="text-muted-foreground h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.noYears || "No academic years configured"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
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
            "group relative cursor-pointer rounded-lg border p-4 transition-all",
            "hover:border-primary/50 hover:bg-accent/50",
            selectedYearId === year.id
              ? "border-primary bg-accent"
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-medium">{year.yearName}</h4>
                {selectedYearId === year.id && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {dict.selected || "Selected"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDate(year.startDate)} - {formatDate(year.endDate)}
              </p>
              {year._count && (
                <div className="text-muted-foreground mt-2 flex gap-3 text-xs">
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
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                className="text-destructive hover:text-destructive h-7 w-7"
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
