"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** "New competition" — name, two dates, ≥ 2 sections, optional prize. */
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSectionsForSelection } from "@/components/school-dashboard/attendance/actions"

import { useRiskDict, type RiskDict } from "../early-warning/use-risk-dict"
import { createCompetition } from "./actions"

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function CreateCompetitionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { t: dict } = useRiskDict()
  const t: NonNullable<NonNullable<RiskDict["rewards"]>["create"]> =
    dict.rewards?.create ?? {}

  const [sections, setSections] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [name, setName] = useState("")
  const [start, setStart] = useState(() => iso(new Date()))
  const [end, setEnd] = useState(() => iso(new Date(Date.now() + 30 * 864e5)))
  const [reward, setReward] = useState("")
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open || sections.length > 0) return
    getSectionsForSelection().then((r) => {
      if (r.success && r.data) setSections(r.data.sections)
    })
  }, [open, sections.length])

  const valid = name.trim() && start && end && end >= start && picked.size >= 2

  const submit = () =>
    startTransition(async () => {
      const r = await createCompetition({
        name: name.trim(),
        lang: "ar",
        startDate: new Date(start),
        endDate: new Date(end),
        sectionIds: [...picked],
        winnerReward: reward.trim() || undefined,
        participantPoints: 0,
        winnerPoints: 100,
      })
      if (r.success) {
        setName("")
        setReward("")
        setPicked(new Set())
        onCreated()
      } else {
        toast.error(t.failed)
      }
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cc-name">{t.name}</Label>
            <Input
              id="cc-name"
              value={name}
              placeholder={t.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-start">{t.start}</Label>
              <Input
                id="cc-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-end">{t.end}</Label>
              <Input
                id="cc-end"
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-reward">{t.reward}</Label>
            <Input
              id="cc-reward"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.sections}</Label>
            <p className="text-muted-foreground text-xs">{t.sectionsHint}</p>
            <div className="bg-card divide-border/60 max-h-48 divide-y overflow-y-auto rounded-xl border">
              {sections.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={picked.has(s.id)}
                    onCheckedChange={() =>
                      setPicked((prev) => {
                        const next = new Set(prev)
                        if (next.has(s.id)) next.delete(s.id)
                        else next.add(s.id)
                        return next
                      })
                    }
                  />
                  <bdi>{s.name}</bdi>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            className="rounded-full"
            disabled={!valid || isPending}
            onClick={submit}
          >
            {isPending ? t.creating : t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
