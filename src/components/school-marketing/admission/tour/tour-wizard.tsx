"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"
import { createTourBooking, getAvailableSlots } from "../actions"
import type {
  TourBookingConfirmation,
  TourBookingData,
  TourSlot,
} from "../types"
import { DEFAULT_GRADES } from "../types"

type Step = "date" | "time" | "info" | "confirm"

interface SchoolPeriod {
  name: string
  startTime: string
  endTime: string
}

interface TourWizardProps {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
  tourDaysOfWeek?: number[]
  schoolPeriods?: SchoolPeriod[]
}

const bookingSchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  studentName: z.string().optional(),
  interestedGrade: z.string().optional(),
  numberOfAttendees: z.number().min(1).max(5),
  specialRequests: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

const STEP_ORDER: Step[] = ["date", "time", "info", "confirm"]

function getStepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step)
}

export function TourWizard({
  school,
  dictionary,
  lang,
  subdomain,
  tourDaysOfWeek = [0, 1, 2, 3, 4],
  schoolPeriods = [],
}: TourWizardProps) {
  const router = useRouter()
  const isRTL = lang === "ar"
  const tour = dictionary?.marketing?.site?.admission?.tour

  const [step, setStep] = useState<Step>("date")
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<TourSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TourSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] =
    useState<TourBookingConfirmation | null>(null)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      parentName: "",
      email: "",
      phone: "",
      studentName: "",
      interestedGrade: "",
      numberOfAttendees: 1,
      specialRequests: "",
    },
  })

  const goTo = useCallback(
    (next: Step) => {
      setDirection(getStepIndex(next) > getStepIndex(step) ? "forward" : "back")
      setStep(next)
    },
    [step]
  )

  const fetchSlots = useCallback(
    async (date: Date) => {
      setIsLoadingSlots(true)
      setSelectedSlot(null)
      try {
        const result = await getAvailableSlots(subdomain, "TOUR", date)
        if (result.success && result.data) {
          setAvailableSlots(result.data)
        } else {
          setAvailableSlots([])
        }
      } catch {
        toast.error(
          tour?.errors?.failedToFetchSlots || "Failed to fetch available slots"
        )
        setAvailableSlots([])
      } finally {
        setIsLoadingSlots(false)
      }
    },
    [subdomain, tour?.errors?.failedToFetchSlots]
  )

  // Fetch slots when navigating to time step
  useEffect(() => {
    if (step === "time" && selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [step, selectedDate, fetchSlots])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    goTo("time")
  }

  const handleSlotSelect = (slot: TourSlot) => {
    setSelectedSlot(slot)
    goTo("info")
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) return

    setIsSubmitting(true)
    try {
      const bookingData: TourBookingData = {
        slotId: selectedSlot.id,
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        studentName: data.studentName,
        interestedGrade: data.interestedGrade,
        numberOfAttendees: data.numberOfAttendees,
        specialRequests: data.specialRequests,
      }

      const result = await createTourBooking(subdomain, bookingData)

      if (result.success && result.data) {
        setConfirmation(result.data)
        goTo("confirm")
      } else {
        toast.error(
          result.error ||
            tour?.errors?.failedToBookTour ||
            "Failed to book tour"
        )
      }
    } catch {
      toast.error(tour?.errors?.failedToBookTour || "Failed to book tour")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepIndex = getStepIndex(step)

  // i18n helpers
  const t = {
    pickDate: tour?.selectDate || (isRTL ? "اختر التاريخ" : "Pick a date"),
    pickTime: tour?.selectTime || (isRTL ? "اختر الوقت" : "Pick a time"),
    yourInfo:
      tour?.bookingInformation || (isRTL ? "معلوماتك" : "Your information"),
    spotsLeft: tour?.spotsLeft || (isRTL ? "متاح" : "spots left"),
    noSlots:
      tour?.noAvailableSlots ||
      (isRTL ? "لا توجد مواعيد متاحة" : "No slots available for this date"),
    loading: isRTL ? "جاري التحميل..." : "Loading...",
    back: isRTL ? "رجوع" : "Back",
    book: tour?.confirmBooking || (isRTL ? "حجز" : "Book"),
    booking: tour?.booking || (isRTL ? "جاري الحجز..." : "Booking..."),
    booked: tour?.tourBooked || (isRTL ? "تم الحجز!" : "Tour Booked!"),
    bookingNumber:
      tour?.bookingNumber || (isRTL ? "رقم الحجز" : "Booking Number"),
    detailsSent:
      tour?.bookingDetailsSent ||
      (isRTL
        ? "تم إرسال التفاصيل إلى بريدك الإلكتروني"
        : "Details sent to your email"),
    backToHome: tour?.backToHome || (isRTL ? "العودة" : "Back to Home"),
    applyNow: tour?.applyNow || (isRTL ? "قدّم الآن" : "Apply Now"),
    parentName:
      tour?.parentGuardianName ||
      (isRTL ? "اسم ولي الأمر" : "Parent/Guardian Name"),
    email: tour?.email || (isRTL ? "البريد الإلكتروني" : "Email"),
    phone: tour?.phone || (isRTL ? "الهاتف" : "Phone"),
    studentName: tour?.studentName || (isRTL ? "اسم الطالب" : "Student Name"),
    grade:
      tour?.interestedGrade || (isRTL ? "الصف المهتم به" : "Interested Grade"),
    selectGrade: tour?.selectGrade || (isRTL ? "اختر الصف" : "Select grade"),
    attendees:
      tour?.numberOfAttendees || (isRTL ? "عدد الحضور" : "Number of Attendees"),
    specialRequests:
      tour?.specialRequests || (isRTL ? "طلبات خاصة" : "Special Requests"),
    specialRequestsPlaceholder:
      tour?.specialRequestsPlaceholder ||
      (isRTL ? "أي ملاحظات أو طلبات" : "Any special requests or notes"),
    enterName: tour?.enterYourName || (isRTL ? "أدخل اسمك" : "Enter your name"),
    enterStudentName:
      tour?.enterStudentName ||
      (isRTL ? "أدخل اسم الطالب" : "Enter student name"),
    step: isRTL ? "خطوة" : "Step",
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {step !== "date" && step !== "confirm" ? (
            <button
              onClick={() =>
                goTo(step === "time" ? "date" : step === "info" ? "time" : step)
              }
              className="text-muted-foreground hover:text-foreground -ms-2 rounded-md p-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">{school.name}</p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6">
        <div
          className={`w-full transition-all duration-300 ease-out ${
            direction === "forward"
              ? "animate-in fade-in slide-in-from-right-4"
              : "animate-in fade-in slide-in-from-left-4"
          }`}
          key={step}
        >
          {step === "date" && (
            <DateStep
              t={t}
              isRTL={isRTL}
              tourDaysOfWeek={tourDaysOfWeek}
              onSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          )}

          {step === "time" && (
            <TimeStep
              t={t}
              isRTL={isRTL}
              selectedDate={selectedDate!}
              availableSlots={availableSlots}
              isLoading={isLoadingSlots}
              onSelect={handleSlotSelect}
              schoolPeriods={schoolPeriods}
            />
          )}

          {step === "info" && (
            <InfoStep
              t={t}
              form={form}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              selectedDate={selectedDate!}
              selectedSlot={selectedSlot!}
              isRTL={isRTL}
            />
          )}

          {step === "confirm" && confirmation && (
            <ConfirmStep
              t={t}
              isRTL={isRTL}
              confirmation={confirmation}
              onHome={() => router.push(`/${lang}/s/${subdomain}`)}
              onApply={() => router.push(`/${lang}/s/${subdomain}/apply`)}
            />
          )}
        </div>
      </div>

      {/* Step indicator at bottom */}
      {step !== "confirm" && (
        <div className="flex justify-center gap-1.5 px-4 pt-2 pb-6">
          {STEP_ORDER.slice(0, 3).map((s, i) => (
            <div
              key={s}
              className={`h-1 w-8 rounded-full transition-colors ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Date
// ---------------------------------------------------------------------------

function DateStep({
  t,
  isRTL,
  tourDaysOfWeek,
  onSelect,
  selectedDate,
}: {
  t: Record<string, string>
  isRTL: boolean
  tourDaysOfWeek: number[]
  onSelect: (date: Date | undefined) => void
  selectedDate?: Date
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t.pickDate}</h2>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        locale={isRTL ? ar : enUS}
        disabled={(date) => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return date < today || !tourDaysOfWeek.includes(date.getDay())
        }}
        className="rounded-xl border shadow-sm"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Time
// ---------------------------------------------------------------------------

function TimeStep({
  t,
  isRTL,
  selectedDate,
  availableSlots,
  isLoading,
  onSelect,
  schoolPeriods,
}: {
  t: Record<string, string>
  isRTL: boolean
  selectedDate: Date
  availableSlots: TourSlot[]
  isLoading: boolean
  onSelect: (slot: TourSlot) => void
  schoolPeriods: SchoolPeriod[]
}) {
  const dateLabel = format(selectedDate, "EEEE, d MMMM", {
    locale: isRTL ? ar : enUS,
  })

  // Match school periods to available admission slots by time overlap
  const periodSlots =
    schoolPeriods.length > 0
      ? schoolPeriods.map((period) => {
          const matchingSlot = availableSlots.find(
            (slot) => slot.startTime === period.startTime
          )
          return { period, slot: matchingSlot ?? null }
        })
      : null

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t.pickTime}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{dateLabel}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : periodSlots ? (
        // Period-aligned grid
        <div className="grid w-full grid-cols-3 gap-2.5">
          {periodSlots.map(({ period, slot }) => (
            <button
              key={period.name}
              onClick={() => slot && onSelect(slot)}
              disabled={!slot || slot.availableSpots === 0}
              className="hover:border-primary hover:bg-primary/5 flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-xs font-medium">{period.name}</span>
              <span className="text-muted-foreground text-[11px]">
                {period.startTime}
              </span>
              {slot && (
                <span className="text-muted-foreground mt-0.5 text-[10px]">
                  {slot.availableSpots} {t.spotsLeft}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : availableSlots.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t.noSlots}
        </p>
      ) : (
        // Fallback: raw slots in 3-col grid
        <div className="grid w-full grid-cols-3 gap-2.5">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onSelect(slot)}
              disabled={slot.availableSpots === 0}
              className="hover:border-primary hover:bg-primary/5 flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-xs font-medium">
                {slot.startTime} - {slot.endTime}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {slot.availableSpots} {t.spotsLeft}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Information Form
// ---------------------------------------------------------------------------

function InfoStep({
  t,
  form,
  isSubmitting,
  onSubmit,
  selectedDate,
  selectedSlot,
  isRTL,
}: {
  t: Record<string, string>
  form: ReturnType<typeof useForm<BookingFormData>>
  isSubmitting: boolean
  onSubmit: (data: BookingFormData) => void
  selectedDate: Date
  selectedSlot: TourSlot
  isRTL: boolean
}) {
  const dateLabel = format(selectedDate, "EEE, d MMM", {
    locale: isRTL ? ar : enUS,
  })

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold">{t.yourInfo}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {dateLabel} &middot; {selectedSlot.startTime} - {selectedSlot.endTime}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t.parentName} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t.enterName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t.email} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="example@email.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.phone}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+249 123 456 789"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.studentName}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t.enterStudentName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="interestedGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.grade}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectGrade} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEFAULT_GRADES.map((grade) => (
                        <SelectItem key={grade.grade} value={grade.grade}>
                          {grade.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfAttendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.attendees}</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.specialRequests}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t.specialRequestsPlaceholder}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t.booking}
              </>
            ) : (
              t.book
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Confirmation
// ---------------------------------------------------------------------------

function ConfirmStep({
  t,
  isRTL,
  confirmation,
  onHome,
  onApply,
}: {
  t: Record<string, string>
  isRTL: boolean
  confirmation: TourBookingConfirmation
  onHome: () => void
  onApply: () => void
}) {
  const dateLabel = format(
    new Date(confirmation.slot.date),
    "EEEE, d MMMM yyyy",
    { locale: isRTL ? ar : enUS }
  )

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
      {/* Success icon */}
      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
        <Check className="text-primary h-8 w-8" />
      </div>

      <div>
        <h2 className="text-xl font-semibold">{t.booked}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t.detailsSent}</p>
      </div>

      {/* Booking details */}
      <div className="w-full rounded-xl border p-5 text-start">
        <p className="text-muted-foreground mb-3 text-xs tracking-wider uppercase">
          {t.bookingNumber}
        </p>
        <p className="mb-4 font-mono text-lg font-semibold tracking-wider">
          {confirmation.bookingNumber}
        </p>

        <div className="text-muted-foreground space-y-2 text-sm">
          <p>{dateLabel}</p>
          <p>
            {confirmation.slot.startTime} - {confirmation.slot.endTime}
          </p>
          {confirmation.slot.location && <p>{confirmation.slot.location}</p>}
          <p>
            {confirmation.numberOfAttendees} {isRTL ? "حضور" : "attendee(s)"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full gap-3">
        <Button variant="outline" className="flex-1" onClick={onHome}>
          {t.backToHome}
        </Button>
        <Button className="flex-1" onClick={onApply}>
          {t.applyNow}
        </Button>
      </div>
    </div>
  )
}
