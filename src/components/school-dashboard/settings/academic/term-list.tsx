"use client"

import * as React from "react"
import { CalendarDays, Pencil, Star, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { Term } from "./types"

interface TermListProps {
  terms: Term[]
  selectedYearId: string | null
  onEditTerm: (term: Term) => void
  onDeleteTerm: (termId: string) => void
  onSetActiveTerm: (termId: string) => void
  dictionary?: Dictionary
  isLoading?: boolean
}

export function TermList({
  terms,
  selectedYearId,
  onEditTerm,
  onDeleteTerm,
  onSetActiveTerm,
  dictionary,
  isLoading = false,
}: TermListProps) {
  const dict = useAcademicDictionary(dictionary)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading terms">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-border rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Loading terms...</span>
      </div>
    )
  }

  if (!selectedYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-3">
          <CalendarDays
            className="text-muted-foreground h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.selectYearFirst || "Select an academic year first"}
        </p>
      </div>
    )
  }

  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-3">
          <CalendarDays
            className="text-muted-foreground h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.noTerms || "No terms configured"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {dict.addTermHint || "Add terms for this academic year"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {terms.map((term) => (
        <div
          key={term.id}
          className={cn(
            "group relative rounded-lg border p-4 transition-all",
            "hover:border-primary/50 hover:bg-accent/50",
            term.isActive
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {dict.term || "Term"} {term.termNumber}
                </h4>
                {term.isActive && (
                  <Badge className="gap-1 text-xs">
                    <Star className="h-3 w-3" />
                    {dict.active || "Active"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDate(term.startDate)} - {formatDate(term.endDate)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!term.isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onSetActiveTerm(term.id)}
                  aria-label={`${dict.setActive || "Set as active"} - ${dict.term || "Term"} ${term.termNumber}`}
                  title={dict.setActive || "Set as active"}
                >
                  <Star className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditTerm(term)}
                aria-label={`${dict.edit || "Edit"} ${dict.term || "Term"} ${term.termNumber}`}
                title={`${dict.edit || "Edit"} ${dict.term || "Term"} ${term.termNumber}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-7 w-7"
                onClick={() => onDeleteTerm(term.id)}
                aria-label={`${dict.delete || "Delete"} ${dict.term || "Term"} ${term.termNumber}`}
                title={`${dict.delete || "Delete"} ${dict.term || "Term"} ${term.termNumber}`}
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
