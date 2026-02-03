"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  termId: string | null
  initialDayOfWeek?: number
  initialPeriodId?: string
  initialClassId?: string
  initialTeacherId?: string
  initialClassroomId?: string
}

export function SlotEditor({
  open,
  onOpenChange,
  termId,
  initialDayOfWeek,
  initialPeriodId,
  initialClassId,
  initialTeacherId,
  initialClassroomId,
}: Props) {
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [periods, setPeriods] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [classes, setClasses] = useState<Array<{ id: string; label: string }>>(
    []
  )
  const [teachers, setTeachers] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; roomName: string }>
  >([])
  const [dayOfWeek, setDayOfWeek] = useState("0")
  const [periodId, setPeriodId] = useState("")
  const [classId, setClassId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [classroomId, setClassroomId] = useState("")
  const [suggestions, setSuggestions] = useState<
    Array<{ dayOfWeek: number; periodId: string; periodName: string }>
  >([])

  useEffect(() => {
    ;(async () => {
      if (!termId) return
      const [cfgRes, perRes, cRes, tRes, rRes] = await Promise.all([
        fetch(`/api/schedule?termId=${termId}`),
        fetch(`/api/periods?termId=${termId}`),
        fetch(`/api/classes?termId=${termId}`),
        fetch(`/api/teachers?termId=${termId}`),
        fetch(`/api/classrooms`),
      ])
      const cfg = await cfgRes.json()
      const pr = await perRes.json()
      const c = await cRes.json()
      const t = await tRes.json()
      const r = await rRes.json()
      setDays(cfg.config?.workingDays ?? [0, 1, 2, 3, 4])
      setPeriods(pr.periods ?? [])
      setClasses(c.classes ?? [])
      setTeachers(t.teachers ?? [])
      setClassrooms(r.classrooms ?? [])
      if (pr.periods?.[0]) setPeriodId(pr.periods[0].id)
      if (c.classes?.[0]) setClassId(c.classes[0].id)
      if (t.teachers?.[0]) setTeacherId(t.teachers[0].id)
      if (r.classrooms?.[0]) setClassroomId(r.classrooms[0].id)
    })()
  }, [termId])

  useEffect(() => {
    if (typeof initialDayOfWeek === "number")
      setDayOfWeek(String(initialDayOfWeek))
    if (initialPeriodId) setPeriodId(initialPeriodId)
    if (initialClassId) setClassId(initialClassId)
    if (initialTeacherId) setTeacherId(initialTeacherId)
    if (initialClassroomId) setClassroomId(initialClassroomId)
  }, [
    initialDayOfWeek,
    initialPeriodId,
    initialClassId,
    initialTeacherId,
    initialClassroomId,
    open,
  ])

  const onSave = async () => {
    if (!termId || !periodId || !classId || !teacherId || !classroomId) return
    await fetch("/api/timetable/slot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        termId,
        dayOfWeek: Number(dayOfWeek),
        periodId,
        classId,
        teacherId,
        classroomId,
      }),
    })
    onOpenChange(false)
  }

  const onSuggest = async () => {
    if (!termId) return
    const params = new URLSearchParams({ termId })
    if (teacherId) params.set("teacherId", teacherId)
    if (classroomId) params.set("classroomId", classroomId)
    const res = await fetch(`/api/timetable/suggest?${params.toString()}`)
    const data = await res.json()
    setSuggestions(data.suggestions || [])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create/Update slot</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Period</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Classroom</Label>
            <Select value={classroomId} onValueChange={setClassroomId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.roomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-4">
            <p className="muted mb-2">Suggested free slots</p>
            <ul className="muted max-h-40 list-disc overflow-auto ps-5">
              {suggestions.map((s, idx) => (
                <li key={`${s.dayOfWeek}:${s.periodId}:${idx}`}>
                  Day {s.dayOfWeek} — {s.periodName}
                </li>
              ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onSuggest} disabled={!termId}>
            Suggest
          </Button>
          <Button onClick={onSave} disabled={!termId}>
            Save slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
