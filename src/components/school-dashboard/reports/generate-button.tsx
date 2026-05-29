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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { generateReportCards } from "./actions"

interface GenerateButtonProps {
  termId: string
  classes: { id: string; name: string }[]
}

export function GenerateButton({ termId, classes }: GenerateButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [classId, setClassId] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)

    const result = await generateReportCards({
      termId,
      classId: classId === "all" ? undefined : classId,
    })

    if (result.success && result.data) {
      toast.success(
        `Generated ${result.data.generated} report card${result.data.generated !== 1 ? "s" : ""}`
      )
      setOpen(false)
      router.refresh()
    } else if (!result.success) {
      toast.error(result.error)
    }

    setIsGenerating(false)
  }, [termId, classId, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Report Cards
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report Cards</DialogTitle>
          <DialogDescription>
            Generate report cards from exam results for the selected term. This
            will aggregate all exam scores by subject and create a PDF report
            card for each student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class (optional)</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
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
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
