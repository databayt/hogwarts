"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  checkExamConflicts,
  findAvailableExamSlots,
  type AvailableSlot,
  type ConflictDetail,
} from "./actions/conflict-detection"

// ---------------------------------------------------------------------------
// ConflictDisplay
// ---------------------------------------------------------------------------

interface ConflictDisplayProps {
  classId: string
  examDate: Date | null
  startTime: string
  endTime: string
  classroomId?: string
  teacherId?: string
  examId?: string
}

export function ConflictDisplay({
  classId,
  examDate,
  startTime,
  endTime,
  classroomId,
  teacherId,
  examId,
}: ConflictDisplayProps) {
  const [conflicts, setConflicts] = useState<ConflictDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canCheck = Boolean(classId && examDate && startTime && endTime)

  const runCheck = useCallback(async () => {
    if (!classId || !examDate || !startTime || !endTime) return

    setLoading(true)
    setError(null)

    try {
      const result = await checkExamConflicts({
        classId,
        examDate,
        startTime,
        endTime,
        classroomId,
        teacherId,
        examId,
      })

      if (result.success && result.data) {
        setConflicts(result.data.conflicts)
      } else if (!result.success) {
        setError(result.error)
        setConflicts([])
      }
    } catch {
      setError("Failed to check conflicts")
      setConflicts([])
    } finally {
      setLoading(false)
      setChecked(true)
    }
  }, [classId, examDate, startTime, endTime, classroomId, teacherId, examId])

  // Debounced auto-check when props change
  useEffect(() => {
    if (!canCheck) {
      setConflicts([])
      setChecked(false)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void runCheck()
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [canCheck, runCheck])

  // Nothing to show if inputs are incomplete
  if (!canCheck) return null

  // Loading state
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Checking for scheduling conflicts...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Conflict check failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // No conflicts found
  if (checked && conflicts.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
        <CheckCircle className="size-4 text-emerald-500" />
        <span>No scheduling conflicts detected</span>
      </div>
    )
  }

  // Conflicts found
  if (conflicts.length > 0) {
    const highCount = conflicts.filter((c) => c.severity === "high").length
    const mediumCount = conflicts.filter((c) => c.severity === "medium").length
    const lowCount = conflicts.filter((c) => c.severity === "low").length

    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}{" "}
            detected
          </AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {highCount > 0 && (
                <Badge variant="destructive">{highCount} high severity</Badge>
              )}
              {mediumCount > 0 && (
                <Badge className="border-transparent bg-amber-500 text-white">
                  {mediumCount} medium
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge variant="secondary">{lowCount} low</Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {conflicts.map((conflict, index) => (
            <ConflictItem
              key={`${conflict.entityId}-${index}`}
              conflict={conflict}
            />
          ))}
        </div>

        <AvailableSlotsPanel
          classId={classId}
          examDate={examDate!}
          startTime={startTime}
          endTime={endTime}
        />
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// ConflictItem
// ---------------------------------------------------------------------------

function ConflictItem({ conflict }: { conflict: ConflictDetail }) {
  const severityStyles: Record<ConflictDetail["severity"], string> = {
    high: "border-destructive/50 bg-destructive/5",
    medium: "border-amber-500/50 bg-amber-500/5",
    low: "border-blue-500/50 bg-blue-500/5",
  }

  const TypeIcon = conflictTypeIcon(conflict.type)

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${severityStyles[conflict.severity]}`}
    >
      <TypeIcon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{conflict.entityName}</span>
          <SeverityBadge severity={conflict.severity} />
        </div>
        <p className="text-muted-foreground text-sm">
          {conflict.conflictingEvent}
        </p>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="size-3" />
          <span>{conflict.conflictTime}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SeverityBadge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: ConflictDetail["severity"] }) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">High</Badge>
    case "medium":
      return (
        <Badge className="border-transparent bg-amber-500 text-white">
          Medium
        </Badge>
      )
    case "low":
      return <Badge variant="secondary">Low</Badge>
  }
}

// ---------------------------------------------------------------------------
// conflictTypeIcon
// ---------------------------------------------------------------------------

function conflictTypeIcon(type: ConflictDetail["type"]) {
  switch (type) {
    case "class":
      return Users
    case "teacher":
      return GraduationCap
    case "classroom":
      return MapPin
    case "student":
      return Users
  }
}

// ---------------------------------------------------------------------------
// AvailableSlotsPanel
// ---------------------------------------------------------------------------

interface AvailableSlotsPanelProps {
  classId: string
  examDate: Date
  startTime: string
  endTime: string
  onSelectSlot?: (startTime: string, endTime: string) => void
}

export function AvailableSlotsPanel({
  classId,
  examDate,
  startTime,
  endTime,
  onSelectSlot,
}: AvailableSlotsPanelProps) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate duration from start/end times
  const durationMinutes = (() => {
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    return eh * 60 + em - (sh * 60 + sm)
  })()

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await findAvailableExamSlots({
        classId,
        date: examDate,
        duration: durationMinutes > 0 ? durationMinutes : 60,
      })

      if (result.success && result.data) {
        setSlots(result.data)
      } else if (!result.success) {
        setError(result.error)
        setSlots([])
      }
    } catch {
      setError("Failed to find available slots")
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [classId, examDate, durationMinutes])

  const handleToggle = () => {
    if (!open) {
      void fetchSlots()
    }
    setOpen((prev) => !prev)
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={handleToggle}>
        <Clock className="me-2 size-4" />
        {open ? "Hide available slots" : "See available slots"}
      </Button>

      {open && (
        <Card>
          <CardContent className="p-4">
            {loading && (
              <div className="text-muted-foreground flex items-center gap-2 py-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Finding available slots...</span>
              </div>
            )}

            {error && <p className="text-destructive py-2 text-sm">{error}</p>}

            {!loading && !error && slots.length === 0 && (
              <p className="text-muted-foreground py-2 text-sm">
                No available slots found for this date.
              </p>
            )}

            {!loading && !error && slots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {slots.length} available slot{slots.length > 1 ? "s" : ""}{" "}
                  found
                </p>
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <SlotItem
                      key={`${slot.startTime}-${slot.endTime}`}
                      slot={slot}
                      onSelect={onSelectSlot}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SlotItem
// ---------------------------------------------------------------------------

function SlotItem({
  slot,
  onSelect,
}: {
  slot: AvailableSlot
  onSelect?: (startTime: string, endTime: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">
            {slot.startTime} - {slot.endTime}
          </span>
          <Badge variant="outline" className="text-xs">
            Score: {slot.score}
          </Badge>
        </div>
        {slot.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {slot.reasons.map((reason) => (
              <Badge key={reason} variant="secondary" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {onSelect && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(slot.startTime, slot.endTime)}
        >
          Use this slot
        </Button>
      )}
    </div>
  )
}
