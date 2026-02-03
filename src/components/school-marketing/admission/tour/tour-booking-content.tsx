"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { School } from "../../types"
import { createTourBooking, getAvailableSlots } from "../actions"
import type {
  TourBookingConfirmation,
  TourBookingData,
  TourSlot,
} from "../types"
import { DEFAULT_GRADES } from "../types"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
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

export default function TourBookingContent({
  school,
  dictionary: initialDictionary,
  lang,
  subdomain,
}: Props) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const dict = dictionary || initialDictionary
  const tour = dict?.marketing?.site?.admission?.tour
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<TourSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TourSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] =
    useState<TourBookingConfirmation | null>(null)
  const isRTL = lang === "ar"

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

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchSlots = async (date: Date) => {
    setIsLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const result = await getAvailableSlots(subdomain, "TOUR", date)

      if (result.success && result.data) {
        setAvailableSlots(result.data)
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      toast.error(
        tour?.errors?.failedToFetchSlots || "Failed to fetch available slots"
      )
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) {
      toast.error(tour?.errors?.pleaseSelectSlot || "Please select a time slot")
      return
    }

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
        toast.success(
          tour?.errors?.tourBookedSuccess || "Tour booked successfully"
        )
      } else {
        toast.error(
          result.error ||
            tour?.errors?.failedToBookTour ||
            "Failed to book tour"
        )
      }
    } catch (error) {
      toast.error(tour?.errors?.failedToBookTour || "Failed to book tour")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show confirmation if booking was successful
  if (confirmation) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="bg-primary/10 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full">
            <AnthropicIcons.Sparkle className="text-primary h-10 w-10" />
          </div>
          <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
            {tour?.tourBooked || "Tour Booked!"}
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
            {tour?.bookingDetailsSent ||
              "Booking details have been sent to your email"}
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardDescription>
              {tour?.bookingNumber || "Booking Number"}
            </CardDescription>
            <CardTitle className="font-mono text-xl tracking-wider">
              {confirmation.bookingNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <AnthropicIcons.CalendarChart className="text-muted-foreground h-5 w-5" />
              <span>
                {format(
                  new Date(confirmation.slot.date),
                  "EEEE, MMMM d, yyyy",
                  {
                    locale: isRTL ? ar : enUS,
                  }
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AnthropicIcons.Lightning className="text-muted-foreground h-5 w-5" />
              <span>
                {confirmation.slot.startTime} - {confirmation.slot.endTime}
              </span>
            </div>
            {confirmation.slot.location && (
              <div className="flex items-center gap-3">
                <AnthropicIcons.Checklist className="text-muted-foreground h-5 w-5" />
                <span>{confirmation.slot.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <AnthropicIcons.Chat className="text-muted-foreground h-5 w-5" />
              <span>
                {confirmation.numberOfAttendees}{" "}
                {tour?.attendees || "attendee(s)"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/${lang}`)}>
            {tour?.backToHome || "Back to Home"}
          </Button>
          <Button
            onClick={() => router.push(`/${lang}/apply`)}
            className="group"
          >
            {tour?.applyNow || "Apply Now"}
            <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-primary/10 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
          <AnthropicIcons.CalendarChart className="text-primary h-8 w-8" />
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
          {tour?.scheduleTour || "Schedule a Campus Tour"}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
          {tour?.visitAndExplore
            ? tour.visitAndExplore.replace("{schoolName}", school.name)
            : `Visit ${school.name} and explore our facilities`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tour?.selectDate || "Select Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={isRTL ? ar : enUS}
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return (
                  date < today || date.getDay() === 5 || date.getDay() === 6
                )
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tour?.selectTime || "Select Time"}
            </CardTitle>
            {selectedDate && (
              <CardDescription>
                {format(selectedDate, "EEEE, MMMM d, yyyy", {
                  locale: isRTL ? ar : enUS,
                })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground py-8 text-center">
                {tour?.selectDatePrompt ||
                  "Select a date to see available times"}
              </p>
            ) : isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {tour?.noAvailableSlots || "No available slots for this date"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={
                      selectedSlot?.id === slot.id ? "default" : "outline"
                    }
                    className="flex h-auto flex-col py-3"
                    onClick={() => setSelectedSlot(slot)}
                    disabled={slot.availableSpots === 0}
                  >
                    <span className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="text-xs opacity-70">
                      {slot.availableSpots} {tour?.spotsLeft || "spots left"}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tour?.bookingInformation || "Booking Information"}
            </CardTitle>
            <CardDescription>
              {tour?.enterDetailsPrompt ||
                "Enter your details to complete the booking"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tour?.parentGuardianName || "Parent/Guardian Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              tour?.enterYourName || "Enter your name"
                            }
                          />
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
                        <FormLabel>{tour?.email || "Email"} *</FormLabel>
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tour?.phone || "Phone"}</FormLabel>
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
                        <FormLabel>
                          {tour?.studentName || "Student Name"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              tour?.enterStudentName || "Enter student name"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="interestedGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tour?.interestedGrade || "Interested Grade"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  tour?.selectGrade || "Select grade"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEFAULT_GRADES.map((grade) => (
                              <SelectItem key={grade.grade} value={grade.grade}>
                                {isRTL ? grade.gradeAr : grade.grade}
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
                        <FormLabel>
                          {tour?.numberOfAttendees || "Number of Attendees"}
                        </FormLabel>
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
                      <FormLabel>
                        {tour?.specialRequests || "Special Requests"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={
                            tour?.specialRequestsPlaceholder ||
                            "Any special requests or notes"
                          }
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="group w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {tour?.booking || "Booking..."}
                    </>
                  ) : (
                    <>
                      <AnthropicIcons.Sparkle className="me-2 h-4 w-4" />
                      {tour?.confirmBooking || "Confirm Booking"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AnthropicIcons.Checklist className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="mb-2 font-medium">
                {tour?.tourInformation || "Tour Information"}
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tour?.tourDuration ||
                    "Tours typically last about 60 minutes"}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tour?.arriveEarly ||
                    "Please arrive 10 minutes before your scheduled time"}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tour?.cancellationPolicy ||
                    "You can cancel or reschedule up to 24 hours in advance"}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
