"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

type Conflict = {
  type: "TEACHER" | "ROOM"
  classA: { id: string; name: string }
  classB: { id: string; name: string }
  teacher?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

type Props = {
  termId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplySuggestion: (s: { dayOfWeek: number; periodId: string }) => void
}

export function ConflictsDrawer({
  termId,
  open,
  onOpenChange,
  onApplySuggestion,
}: Props) {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<
    Record<
      string,
      Array<{ dayOfWeek: number; periodId: string; periodName: string }>
    >
  >({})

  useEffect(() => {
    ;(async () => {
      if (!open || !termId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/timetable/conflicts?termId=${termId}`)
        const data = await res.json()
        setConflicts(data.conflicts || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [termId, open])

  const loadSuggestions = async (
    key: string,
    teacherId?: string,
    classroomId?: string
  ) => {
    if (!termId) return
    const params = new URLSearchParams({ termId })
    if (teacherId) params.set("teacherId", teacherId)
    if (classroomId) params.set("classroomId", classroomId)
    const res = await fetch(`/api/timetable/suggest?${params.toString()}`)
    const data = await res.json()
    setSuggestions((prev) => ({ ...prev, [key]: data.suggestions || [] }))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[65%]">
        <DrawerHeader>
          <DrawerTitle>Conflicts</DrawerTitle>
        </DrawerHeader>
        <div className="h-full overflow-auto px-4 pb-6">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : conflicts.length === 0 ? (
            <p className="muted">No conflicts</p>
          ) : (
            <ul className="space-y-4">
              {conflicts.map((c, idx) => {
                const key = `${c.type}:${c.classA.id}:${c.classB.id}`
                const sug = suggestions[key] || []
                return (
                  <li key={key} className="rounded-md border p-3">
                    <h6 className="mb-1">
                      {c.type === "TEACHER" ? "Teacher" : "Room"}:{" "}
                      {c.teacher?.name || c.room?.name || ""}
                    </h6>
                    <p className="muted mb-2">
                      {c.classA.name} vs {c.classB.name}
                    </p>
                    <div className="mb-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          loadSuggestions(
                            key,
                            c.teacher?.id || undefined,
                            undefined
                          )
                        }
                      >
                        Suggest for teacher
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          loadSuggestions(
                            key,
                            undefined,
                            c.room?.id || undefined
                          )
                        }
                      >
                        Suggest for room
                      </Button>
                    </div>
                    {sug.length > 0 && (
                      <div>
                        <p className="mb-1">
                          <small>Suggestions:</small>
                        </p>
                        <ul className="max-h-28 list-disc space-y-1 overflow-auto ps-5">
                          {sug.map((s) => (
                            <li
                              key={`${s.dayOfWeek}:${s.periodId}`}
                              className="flex items-center justify-between"
                            >
                              <span>
                                Day {s.dayOfWeek} — {s.periodName}
                              </span>
                              <Button
                                size="sm"
                                onClick={() =>
                                  onApplySuggestion({
                                    dayOfWeek: s.dayOfWeek,
                                    periodId: s.periodId,
                                  })
                                }
                              >
                                Apply
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
