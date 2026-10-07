"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { generateReportCards } from "@/components/school-dashboard/grades/actions/report-cards"

interface GenerateButtonProps {
  termId: string
  /** Grades in order, each with its sections — generate one or the other. */
  grades: Array<{
    id: string
    name: string
    sections: Array<{ id: string; name: string }>
  }>
  copy: Dictionary["results"]["reportCards"]
}

export function GenerateButton({ termId, grades, copy }: GenerateButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // "all", "g:<gradeId>" or "s:<sectionId>"
  const [scope, setScope] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const t = copy.generateDialog

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)

    const result = await generateReportCards({
      termId,
      gradeId: scope.startsWith("g:") ? scope.slice(2) : undefined,
      sectionId: scope.startsWith("s:") ? scope.slice(2) : undefined,
    })

    if (result.success && result.data) {
      // Rich pipeline returns {created, updated, skipped}: created + updated
      // is the count of cards now in good shape (skipped = no grades).
      const generated = result.data.created + result.data.updated
      SuccessToast(
        t.generated.replace("{count}", String(generated)),
        result.data.skipped > 0
          ? {
              description: t.skipped.replace(
                "{count}",
                String(result.data.skipped)
              ),
            }
          : undefined
      )
      setOpen(false)
      router.refresh()
    } else if (!result.success) {
      toast.error(result.error)
    }

    setIsGenerating(false)
  }, [termId, scope, router, t])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          {copy.actions.generate}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.scope}</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue placeholder={copy.filters.allGrades} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.filters.allGrades}</SelectItem>
                {grades.map((grade) => (
                  <SelectGroup key={grade.id}>
                    <SelectLabel>{grade.name}</SelectLabel>
                    <SelectItem value={`g:${grade.id}`}>
                      {t.wholeGrade.replace("{grade}", grade.name)}
                    </SelectItem>
                    {grade.sections.map((section) => (
                      <SelectItem key={section.id} value={`s:${section.id}`}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.actions.generating}
              </>
            ) : (
              t.generate
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
