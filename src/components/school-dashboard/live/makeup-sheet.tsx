"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class («حصة تعويضية») — the screens a teacher plans one on.
//
// `MakeupSheet` is a bottom sheet (phone-first) that asks the server for the
// times when the teacher AND the section are free, lets the teacher pick one
// — or type another — and books it. The same sheet re-plans a scheduled
// make-up (`mode="replan"`). `CancelMakeupButton` cancels one behind a confirm.
//
// Every time here is read and written in the SCHOOL's zone (`timeZone` comes
// back with the suggestions), never the device's: a teacher travelling, or a
// laptop on UTC, must book the same instant the school sees.
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { schoolWallTimeToUtc } from "@/lib/timezone"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import {
  cancelMakeupAction,
  createMakeupAction,
  replanMakeupAction,
  suggestMakeupSlotsAction,
} from "./actions/makeup"
import { resolveLiveClassError } from "./error-map"
import type { MakeupLabels } from "./makeup-badge"
import type { MakeupSlotDto, MakeupSuggestions } from "./makeup-core"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]

/** Booked-slot minimum touch target (44px) — every chip and button here. */
const TOUCH = "min-h-11"

/** "2026-11-18T16:00" typed in the school's wall clock → the UTC instant it means in `tz`. */
export function wallToIso(value: string, tz: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return new Date(value).toISOString()
  return schoolWallTimeToUtc(
    tz,
    +m[1],
    +m[2],
    +m[3],
    +m[4],
    +m[5]
  ).toISOString()
}

/** A server failure → the sentence to show. Make-up codes read the make-up labels first. */
function errorText(
  labels: MakeupLabels | undefined,
  dictionary: Parameters<typeof resolveLiveClassError>[0],
  code: string | undefined
): string {
  const errors = labels?.errors as Record<string, string> | undefined
  if (code && errors?.[code]) return errors[code]
  return resolveLiveClassError(dictionary, code)
}

function failureCode(result: unknown): string | undefined {
  if (result && typeof result === "object" && "error" in result) {
    const e = (result as { error?: unknown }).error
    return typeof e === "string" ? e : undefined
  }
  return undefined
}

function isSuccess<T>(result: unknown): result is { success: true; data: T } {
  return (
    !!result &&
    typeof result === "object" &&
    "success" in result &&
    (result as { success?: unknown }).success === true
  )
}

interface MakeupSheetProps {
  /** The missed class this makes up — always the ROOT, also when re-planning. */
  missedId: string
  /** `replan` moves a scheduled make-up (`makeupId`) instead of creating one. */
  mode?: "create" | "replan"
  makeupId?: string
  labels: MakeupLabels
  lang: string
  /** The trigger button's text. Defaults to the mode's own label. */
  triggerLabel?: string
  /** One line under the title: which class, which day. */
  description?: string
  variant?: ButtonVariant
  className?: string
}

export function MakeupSheet({
  missedId,
  mode = "create",
  makeupId,
  labels,
  lang,
  triggerLabel,
  description,
  variant = "default",
  className,
}: MakeupSheetProps) {
  const router = useRouter()
  const dictionary = useDictionaryFallback()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MakeupSuggestions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<MakeupSlotDto | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  // The viewer picked a day / time / custom time themselves — the lower
  // confirm button then books THEIR choice; untouched, the suggestion is one tap.
  const [touched, setTouched] = useState(false)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("")
  const [pending, startTransition] = useTransition()
  // A slow reply must not overwrite a newer one (a reload after a conflict).
  const requestId = useRef(0)
  // Read through a ref so a re-render with new label objects never refetches.
  const copy = useRef({ labels, dictionary })
  copy.current = { labels, dictionary }

  const locale = lang === "ar" ? "ar" : "en-US"

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const result = await suggestMakeupSlotsAction({ missedId })
      if (id !== requestId.current) return
      if (isSuccess<MakeupSuggestions>(result)) {
        setData(result.data)
        // One tap: the earliest free time is already chosen and shown as the
        // primary action; the day / time chips below only change it.
        setSlot(result.data.days[0]?.slots[0] ?? null)
        setDay(result.data.days[0]?.day ?? null)
        setTouched(false)
      } else {
        setData(null)
        setError(
          errorText(
            copy.current.labels,
            copy.current.dictionary,
            failureCode(result)
          )
        )
      }
    } catch {
      if (id === requestId.current) {
        setData(null)
        setError(
          errorText(copy.current.labels, copy.current.dictionary, undefined)
        )
      }
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [missedId])

  // Fresh suggestions every time the sheet opens — free time moves.
  useEffect(() => {
    if (!open) return
    setError(null)
    setSlot(null)
    setCustomOpen(false)
    void load()
  }, [open, load])

  const timeZone = data?.timeZone
  const days = data?.days ?? []
  const activeDay = days.find((d) => d.day === day) ?? null

  const fmtDay = (isoDay: string) =>
    // Noon UTC read in UTC: the calendar label of the school's own day.
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${isoDay}T12:00:00Z`))
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso))

  const customStartIso =
    customOpen && customDate && customTime && timeZone
      ? wallToIso(`${customDate}T${customTime}`, timeZone)
      : null
  const chosen: { startIso: string; endIso: string } | null = customStartIso
    ? {
        startIso: customStartIso,
        endIso: new Date(
          new Date(customStartIso).getTime() + (data?.durationMin ?? 0) * 60_000
        ).toISOString(),
      }
    : slot
      ? { startIso: slot.startIso, endIso: slot.endIso }
      : null

  // The earliest free time — the suggestion shown first and booked in one tap.
  const best: { day: string; slot: MakeupSlotDto } | null = days[0]?.slots[0]
    ? { day: days[0].day, slot: days[0].slots[0] }
    : null
  const pickedOther = customOpen || touched

  function confirm(target: { startIso: string; endIso: string } | null = chosen) {
    if (!target) return
    startTransition(async () => {
      setError(null)
      try {
        const result =
          mode === "replan" && makeupId
            ? await replanMakeupAction({ makeupId, ...target })
            : await createMakeupAction({ missedId, ...target })
        if (isSuccess(result)) {
          SuccessToast(labels.scheduled)
          setOpen(false)
          router.refresh()
          return
        }
        const code = failureCode(result)
        setError(errorText(labels, dictionary, code))
        if (code === "MAKEUP_CONFLICT") {
          // Someone took that time since the list was read — show what is free now.
          setSlot(null)
          setCustomOpen(false)
          void load()
        }
      } catch {
        setError(errorText(labels, dictionary, undefined))
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant={variant}
          className={cn(TOUCH, className)}
        >
          {triggerLabel ?? (mode === "replan" ? labels.replan : labels.cta)}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl pb-6"
      >
        <SheetHeader className="pe-12">
          <SheetTitle>
            {mode === "replan" ? labels.replan : labels.sheetTitle}
          </SheetTitle>
          <SheetDescription>{description ?? labels.pickDay}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          {loading && !data ? (
            <p className="text-muted-foreground text-sm" role="status">
              {labels.loadingSlots}
            </p>
          ) : null}

          {data && days.length === 0 ? (
            <p className="text-muted-foreground text-sm">{labels.noSlots}</p>
          ) : null}

          {best && !customOpen ? (
            <div
              className="bg-muted/40 space-y-3 rounded-xl border p-4"
              data-slot="makeup-best"
            >
              <p className="text-muted-foreground text-xs">
                {labels.bestTitle}
              </p>
              <p className="text-lg font-semibold">
                <bdi>
                  {fmtDay(best.day)} · {fmtTime(best.slot.startIso)}
                </bdi>
              </p>
              <Button
                type="button"
                className={cn(TOUCH, "w-full")}
                disabled={pending}
                aria-busy={pending}
                onClick={() =>
                  confirm({
                    startIso: best.slot.startIso,
                    endIso: best.slot.endIso,
                  })
                }
              >
                {pending ? labels.creating : labels.bookThis}
              </Button>
            </div>
          ) : null}

          {days.length > 0 ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">{labels.pickDay}</p>
                <div className="flex flex-wrap gap-2">
                  {days.map((d) => (
                    <Button
                      key={d.day}
                      type="button"
                      variant={d.day === day ? "default" : "outline"}
                      aria-pressed={d.day === day}
                      className={cn(TOUCH, "px-4")}
                      onClick={() => {
                        setDay(d.day)
                        setSlot(null)
                        setTouched(true)
                      }}
                    >
                      {fmtDay(d.day)}
                    </Button>
                  ))}
                </div>
              </div>

              {activeDay ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{labels.pickTime}</p>
                  <div className="flex flex-wrap gap-2">
                    {activeDay.slots.map((s) => {
                      const selected =
                        !customOpen && slot?.startIso === s.startIso
                      return (
                        <Button
                          key={s.startIso}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          aria-pressed={selected}
                          className={cn(TOUCH, "px-4")}
                          onClick={() => {
                            setSlot(s)
                            setCustomOpen(false)
                            setTouched(true)
                          }}
                        >
                          {s.periodName ??
                            `${fmtTime(s.startIso)} – ${fmtTime(s.endIso)}`}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {data ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                aria-expanded={customOpen}
                className={cn(TOUCH, "px-2")}
                onClick={() => {
                  setCustomOpen((v) => !v)
                  setSlot(null)
                  setTouched(true)
                }}
              >
                {labels.otherTime}
              </Button>
              {customOpen ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="makeup-date">{labels.customDate}</Label>
                    <Input
                      id="makeup-date"
                      type="date"
                      className={TOUCH}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="makeup-time">{labels.customTime}</Label>
                    <Input
                      id="makeup-time"
                      type="time"
                      className={TOUCH}
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          {pickedOther || !best ? (
            <Button
              type="button"
              className={cn(TOUCH, "w-full")}
              disabled={!chosen || pending}
              aria-busy={pending}
              onClick={() => confirm()}
            >
              {pending ? labels.creating : labels.confirm}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** «إلغاء الحصة التعويضية» — behind a confirm, because moving it later is a new plan. */
export function CancelMakeupButton({
  makeupId,
  labels,
  className,
}: {
  makeupId: string
  labels: MakeupLabels
  className?: string
}) {
  const router = useRouter()
  const dictionary = useDictionaryFallback()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function cancel() {
    startTransition(async () => {
      try {
        const result = await cancelMakeupAction({ makeupId })
        if (isSuccess(result)) {
          setOpen(false)
          router.refresh()
          return
        }
        ErrorToast(errorText(labels, dictionary, failureCode(result)))
      } catch {
        ErrorToast(errorText(labels, dictionary, undefined))
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(TOUCH, className)}
        >
          {labels.cancel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.cancel}</AlertDialogTitle>
          <AlertDialogDescription>
            {labels.cancelConfirm}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={TOUCH}>
            {labels.cancelKeep}
          </AlertDialogCancel>
          <AlertDialogAction
            className={TOUCH}
            disabled={pending}
            aria-busy={pending}
            onClick={(e) => {
              // Keep the dialog open until the server answers.
              e.preventDefault()
              cancel()
            }}
          >
            {pending ? labels.cancelling : labels.cancel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
