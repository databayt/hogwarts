"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  termId: string | null
  onSaved?: () => void
}

export function ScheduleSettingsDialog({
  open,
  onOpenChange,
  termId,
  onSaved,
}: Props) {
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [periods, setPeriods] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [lunchAfter, setLunchAfter] = useState<string>("")
  const disabled = !termId

  useEffect(() => {
    ;(async () => {
      if (!termId) return
      const [cfgRes, perRes] = await Promise.all([
        fetch(`/api/schedule?termId=${termId}`),
        fetch(`/api/periods?termId=${termId}`),
      ])
      const cfg = await cfgRes.json()
      const pr = await perRes.json()
      setWorkingDays(cfg.config?.workingDays ?? [0, 1, 2, 3, 4])
      setLunchAfter(
        cfg.config?.defaultLunchAfterPeriod != null
          ? String(cfg.config.defaultLunchAfterPeriod)
          : ""
      )
      setPeriods(pr.periods ?? [])
    })()
  }, [termId])

  const toggleDay = (d: number) => {
    setWorkingDays((prev) =>
      prev.includes(d)
        ? prev.filter((x) => x !== d)
        : [...prev, d].sort((a, b) => a - b)
    )
  }

  const onSave = async () => {
    if (!termId) return
    await fetch("/api/schedule/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        termId,
        workingDays,
        defaultLunchAfterPeriod: lunchAfter ? Number(lunchAfter) : null,
      }),
    })
    onSaved?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Schedule settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Working days</Label>
            <div className="flex flex-wrap gap-3">
              {DAY_LABELS.map((label, idx) => (
                <label key={label} className="flex items-center gap-2">
                  <Checkbox
                    checked={workingDays.includes(idx)}
                    onCheckedChange={() => toggleDay(idx)}
                    disabled={disabled}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Lunch after period</Label>
            <Select value={lunchAfter} onValueChange={setLunchAfter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not set</SelectItem>
                {periods.map((p, idx) => (
                  <SelectItem key={p.id} value={String(idx)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} disabled={disabled}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
