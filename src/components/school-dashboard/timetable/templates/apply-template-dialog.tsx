"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { AlertTriangle, Info } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { applyTemplateToTerm, getTermsForCopy } from "../actions"

interface Term {
  id: string
  label: string
  startDate: Date
  endDate: Date
}

interface Template {
  id: string
  name: string
  stats: {
    totalSlots: number
    classCount: number
    teacherCount: number
  }
}

interface ApplyTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
  onSuccess: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any>
}

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
  dictionary,
}: ApplyTemplateDialogProps) {
  const [targetTermId, setTargetTermId] = useState("")
  const [clearExisting, setClearExisting] = useState(false)
  const [terms, setTerms] = useState<Term[]>([])
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const t = dictionary?.templates || {}

  useEffect(() => {
    if (open) {
      getTermsForCopy().then(setTerms).catch(console.error)
      setTargetTermId("")
      setClearExisting(false)
    }
  }, [open])

  const handleApply = useCallback(() => {
    if (!targetTermId) {
      toast({
        title: "Error",
        description: "Please select a target term",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await applyTemplateToTerm({
          templateId: template.id,
          targetTermId,
          clearExisting,
        })

        toast({
          title: t.success || "Template Applied",
          description: `Created ${result.slotsCreated} slots${
            result.conflictsFound > 0
              ? ` (${result.conflictsFound} conflicts)`
              : ""
          }`,
        })

        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to apply template",
          variant: "destructive",
        })
      }
    })
  }, [
    targetTermId,
    clearExisting,
    template.id,
    onOpenChange,
    onSuccess,
    toast,
    t.success,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t.applyTitle || `Apply Template: ${template.name}`}
          </DialogTitle>
          <DialogDescription>
            {t.applyDescription ||
              "Apply this template to another term. This will create timetable slots based on the template configuration."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Template Contents</AlertTitle>
            <AlertDescription>
              {template.stats.totalSlots} slots, {template.stats.classCount}{" "}
              classes, {template.stats.teacherCount} teachers
            </AlertDescription>
          </Alert>

          {/* Target Term Selection */}
          <div className="space-y-2">
            <Label htmlFor="targetTerm">{t.targetTerm || "Target Term"}</Label>
            <Select value={targetTermId} onValueChange={setTargetTermId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectTerm || "Select term"} />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Existing Option */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="clearExisting"
              checked={clearExisting}
              onCheckedChange={(checked) => setClearExisting(checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="clearExisting"
                className="cursor-pointer font-medium"
              >
                {t.clearExisting || "Clear existing timetable"}
              </Label>
              <p className="text-muted-foreground text-sm">
                {t.clearExistingDescription ||
                  "Remove all existing slots in the target term before applying"}
              </p>
            </div>
          </div>

          {/* Warning */}
          {clearExisting && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t.warning || "Warning"}</AlertTitle>
              <AlertDescription>
                {t.warningDescription ||
                  "This will permanently delete all existing timetable slots in the target term."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handleApply}
            disabled={isPending || !targetTermId}
            variant={clearExisting ? "destructive" : "default"}
          >
            {isPending ? "Applying..." : t.apply || "Apply Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
