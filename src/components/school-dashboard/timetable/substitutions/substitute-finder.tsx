"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Check, Search, Star, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

import { assignSubstitute, findAvailableSubstitutes } from "../actions"

interface Substitute {
  id: string
  name: string
  hasSubjectExpertise: boolean
  expertiseLevel: string | null
  currentWorkload: number
  isPreferred: boolean
  unavailableReason: string | null
}

interface SubstituteFinderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  absenceId: string
  slotId: string
  slotDate: Date
  termId: string
  originalTeacherId: string
  subjectId?: string
  dayOfWeek: number
  periodId: string
  periodName: string
  className?: string
  subjectName?: string
  onSuccess: () => void
  dictionary?: {
    substitutions?: {
      findSubstitute?: string
      findSubstituteDescription?: string
      searching?: string
      noSubstitutes?: string
      preferredMatch?: string
      subjectMatch?: string
      workload?: string
      periods?: string
      assign?: string
      cancel?: string
    }
  }
}

export function SubstituteFinder({
  open,
  onOpenChange,
  absenceId,
  slotId,
  slotDate,
  termId,
  originalTeacherId,
  subjectId,
  dayOfWeek,
  periodId,
  periodName,
  className,
  subjectName,
  onSuccess,
  dictionary,
}: SubstituteFinderProps) {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const t = dictionary?.substitutions || {}

  useEffect(() => {
    if (open) {
      setLoading(true)
      setSelectedId(null)
      findAvailableSubstitutes({
        originalTeacherId,
        dayOfWeek,
        periodId,
        slotDate,
        termId,
        subjectId,
      })
        .then((result) => {
          setSubstitutes(result.substitutes)
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to find substitutes",
            variant: "destructive",
          })
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [
    open,
    originalTeacherId,
    dayOfWeek,
    periodId,
    slotDate,
    termId,
    subjectId,
    toast,
  ])

  const handleAssign = useCallback(() => {
    if (!selectedId) return

    startTransition(async () => {
      try {
        await assignSubstitute({
          absenceId,
          originalSlotId: slotId,
          substituteTeacherId: selectedId,
          slotDate,
        })

        toast({
          title: "Success",
          description: "Substitute assigned successfully",
        })

        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to assign substitute",
          variant: "destructive",
        })
      }
    })
  }, [selectedId, absenceId, slotId, slotDate, onOpenChange, onSuccess, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.findSubstitute || "Find Substitute"}</DialogTitle>
          <DialogDescription>
            {t.findSubstituteDescription ||
              `Select a substitute for ${periodName}${
                subjectName ? ` - ${subjectName}` : ""
              }${className ? ` (${className})` : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : substitutes.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="text-muted-foreground mx-auto h-12 w-12" />
              <h4 className="mt-4">
                {t.noSubstitutes || "No Available Substitutes"}
              </h4>
              <p className="text-muted-foreground mt-2 text-sm">
                No teachers are available for this time slot
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {substitutes.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedId(sub.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-start transition-colors",
                      selectedId === sub.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {t.workload || "Workload"}: {sub.currentWorkload}{" "}
                            {t.periods || "periods/week"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.isPreferred && (
                          <Badge
                            variant="default"
                            className="bg-yellow-500 text-xs"
                          >
                            <Star className="me-1 h-3 w-3" />
                            {t.preferredMatch || "Preferred"}
                          </Badge>
                        )}
                        {sub.hasSubjectExpertise && !sub.isPreferred && (
                          <Badge variant="secondary" className="text-xs">
                            {t.subjectMatch || "Subject Match"}
                          </Badge>
                        )}
                        {selectedId === sub.id && (
                          <Check className="text-primary h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button onClick={handleAssign} disabled={isPending || !selectedId}>
            {isPending ? "Assigning..." : t.assign || "Assign Substitute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
