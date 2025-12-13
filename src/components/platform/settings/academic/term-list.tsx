"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil, Trash2, CalendarDays, Star } from "lucide-react"
import { useAcademicDictionary } from "@/hooks/use-academic-dictionary"
import type { Term } from "./types"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
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
        <div className="rounded-full bg-muted p-3 mb-4">
          <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
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
        <div className="rounded-full bg-muted p-3 mb-4">
          <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          {dict.noTerms || "No terms configured"}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
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
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {dict.term || "Term"} {term.termNumber}
                </h4>
                {term.isActive && (
                  <Badge className="text-xs gap-1">
                    <Star className="h-3 w-3" />
                    {dict.active || "Active"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(term.startDate)} - {formatDate(term.endDate)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                className="h-7 w-7 text-destructive hover:text-destructive"
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
