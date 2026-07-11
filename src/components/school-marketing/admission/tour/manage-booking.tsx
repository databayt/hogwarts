// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  cancelTourBooking,
  getAvailableSlots,
  rescheduleTourBooking,
} from "../actions/tour"

interface SlotOption {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  availableSpots: number
}

interface Props {
  subdomain: string
  bookingNumber: string
  isRTL: boolean
  locale: string
}

// Public-facing tour self-management. The booking number is the capability;
// the server actions re-validate, so no auth is added here. Replaces the old
// mailto:admissions@{subdomain}.edu links (a domain that never existed).
export default function ManageBooking({
  subdomain,
  bookingNumber,
  isRTL,
  locale,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"idle" | "reschedule">("idle")
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const mapError = (code?: string): string => {
    switch (code) {
      case "SLOT_FULL":
        return t("هذا الموعد ممتلئ", "That slot is full")
      case "BOOKING_NOT_FOUND":
        return t("لم يتم العثور على الحجز", "Booking not found")
      case "TOUR_BOOKING_DISABLED":
        return t("حجز الجولات متوقف حالياً", "Tour booking is currently closed")
      case "RATE_LIMITED":
        return t("محاولات كثيرة، حاول لاحقاً", "Too many attempts, try later")
      default:
        return t("حدث خطأ، حاول مرة أخرى", "Something went wrong, try again")
    }
  }

  const onCancel = () => {
    if (
      !window.confirm(
        t("هل أنت متأكد من إلغاء الجولة؟", "Cancel this tour booking?")
      )
    )
      return
    setError("")
    startTransition(async () => {
      const res = await cancelTourBooking(subdomain, bookingNumber)
      if (res.success) {
        setMessage(t("تم إلغاء الحجز", "Your booking has been cancelled"))
        router.refresh()
      } else {
        setError(mapError(res.error))
      }
    })
  }

  const openReschedule = () => {
    setError("")
    setMode("reschedule")
    startTransition(async () => {
      const res = await getAvailableSlots(subdomain, "TOUR")
      if (res.success && res.data) {
        setSlots(res.data as SlotOption[])
      } else {
        setError(mapError(res.success ? undefined : res.error))
      }
    })
  }

  const onReschedule = () => {
    if (!selectedSlot) return
    setError("")
    startTransition(async () => {
      const res = await rescheduleTourBooking(
        subdomain,
        bookingNumber,
        selectedSlot
      )
      if (res.success) {
        setMessage(t("تم تغيير موعد الجولة", "Your tour has been rescheduled"))
        setMode("idle")
        router.refresh()
      } else {
        setError(mapError(res.error))
      }
    })
  }

  const fmtSlot = (s: SlotOption) => {
    const d = new Date(s.date)
    const day = d.toLocaleDateString(locale === "en" ? "en-US" : "ar", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    return `${day} · ${s.startTime}–${s.endTime}`
  }

  if (message) {
    return (
      <div className="border-t pt-4">
        <p className="text-sm font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className="border-t pt-4">
      <p className="text-muted-foreground mb-4 text-sm">
        {t(
          "هل تريد تغيير موعدك؟ يمكنك إعادة الجدولة أو الإلغاء أدناه.",
          "Need to change your appointment? Reschedule or cancel below."
        )}
      </p>

      {mode === "idle" ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={openReschedule}
            disabled={isPending}
          >
            {t("إعادة جدولة", "Reschedule")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            {t("إلغاء", "Cancel")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Select value={selectedSlot} onValueChange={setSelectedSlot}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue
                placeholder={t("اختر موعداً جديداً", "Pick a new time")}
              />
            </SelectTrigger>
            <SelectContent>
              {slots.length === 0 && !isPending ? (
                <div className="text-muted-foreground p-2 text-sm">
                  {t("لا توجد مواعيد متاحة", "No available slots")}
                </div>
              ) : (
                slots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {fmtSlot(s)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={onReschedule}
              disabled={isPending || !selectedSlot}
            >
              {t("تأكيد الموعد الجديد", "Confirm new time")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("idle")}
              disabled={isPending}
            >
              {t("رجوع", "Back")}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
    </div>
  )
}
