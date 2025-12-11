"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { TourSlot, TourBookingData, TourBookingConfirmation } from "../types";
import { DEFAULT_GRADES } from "../types";
import { getAvailableSlots, createTourBooking } from "../actions";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

const bookingSchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  studentName: z.string().optional(),
  interestedGrade: z.string().optional(),
  numberOfAttendees: z.number().min(1).max(5),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function TourBookingContent({
  school,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TourSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TourSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<TourBookingConfirmation | null>(null);
  const isRTL = lang === "ar";

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
  });

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const result = await getAvailableSlots(subdomain, "TOUR", date);

      if (result.success && result.data) {
        setAvailableSlots(result.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في جلب المواعيد" : "Failed to fetch available slots");
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) {
      toast.error(isRTL ? "يرجى اختيار موعد" : "Please select a time slot");
      return;
    }

    setIsSubmitting(true);
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
      };

      const result = await createTourBooking(subdomain, bookingData);

      if (result.success && result.data) {
        setConfirmation(result.data);
        toast.success(isRTL ? "تم حجز الجولة بنجاح" : "Tour booked successfully");
      } else {
        toast.error(result.error || (isRTL ? "فشل في الحجز" : "Failed to book tour"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في الحجز" : "Failed to book tour");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show confirmation if booking was successful
  if (confirmation) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "تم تأكيد الحجز!" : "Tour Booked!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL
              ? "سيتم إرسال تفاصيل الحجز إلى بريدك الإلكتروني"
              : "Booking details have been sent to your email"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>
              {isRTL ? "رقم الحجز" : "Booking Number"}
            </CardDescription>
            <CardTitle className="text-xl font-mono">
              {confirmation.bookingNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span>
                {format(new Date(confirmation.slot.date), "EEEE, MMMM d, yyyy", {
                  locale: isRTL ? ar : enUS,
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>
                {confirmation.slot.startTime} - {confirmation.slot.endTime}
              </span>
            </div>
            {confirmation.slot.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{confirmation.slot.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>
                {confirmation.numberOfAttendees} {isRTL ? "شخص" : "attendee(s)"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/${lang}`)}
          >
            {isRTL ? "العودة للرئيسية" : "Back to Home"}
          </Button>
          <Button onClick={() => router.push(`/${lang}/apply`)}>
            {isRTL ? "قدم الآن" : "Apply Now"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {isRTL ? "حجز جولة في الحرم الجامعي" : "Schedule a Campus Tour"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isRTL
            ? `زر ${school.name} واكتشف مرافقنا`
            : `Visit ${school.name} and explore our facilities`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? "اختر التاريخ" : "Select Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={isRTL ? ar : enUS}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || date.getDay() === 5 || date.getDay() === 6;
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? "اختر الوقت" : "Select Time"}
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
              <p className="text-muted-foreground text-center py-8">
                {isRTL ? "اختر تاريخاً لعرض المواعيد المتاحة" : "Select a date to see available times"}
              </p>
            ) : isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {isRTL ? "لا توجد مواعيد متاحة في هذا التاريخ" : "No available slots for this date"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col"
                    onClick={() => setSelectedSlot(slot)}
                    disabled={slot.availableSpots === 0}
                  >
                    <span className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="text-xs opacity-70">
                      {slot.availableSpots} {isRTL ? "متاح" : "spots left"}
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
              {isRTL ? "معلومات الحجز" : "Booking Information"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "أدخل بياناتك لإتمام الحجز" : "Enter your details to complete the booking"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isRTL ? "اسم ولي الأمر" : "Parent/Guardian Name"} *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={isRTL ? "أدخل اسمك" : "Enter your name"} />
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
                          {isRTL ? "البريد الإلكتروني" : "Email"} *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="example@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "رقم الهاتف" : "Phone"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+249 123 456 789" />
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
                        <FormLabel>{isRTL ? "اسم الطالب" : "Student Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={isRTL ? "أدخل اسم الطالب" : "Enter student name"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interestedGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "الصف المهتم به" : "Interested Grade"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isRTL ? "اختر الصف" : "Select grade"} />
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
                        <FormLabel>{isRTL ? "عدد الحضور" : "Number of Attendees"}</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
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
                      <FormLabel>{isRTL ? "طلبات خاصة" : "Special Requests"}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={isRTL ? "أي طلبات أو ملاحظات" : "Any special requests or notes"}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {isRTL ? "جارٍ الحجز..." : "Booking..."}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4 me-2" />
                      {isRTL ? "تأكيد الحجز" : "Confirm Booking"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">{isRTL ? "معلومات الجولة" : "Tour Information"}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              {isRTL
                ? "• مدة الجولة حوالي 60 دقيقة"
                : "• Tours typically last about 60 minutes"}
            </li>
            <li>
              {isRTL
                ? "• يرجى الوصول قبل 10 دقائق من الموعد"
                : "• Please arrive 10 minutes before your scheduled time"}
            </li>
            <li>
              {isRTL
                ? "• يمكنك إلغاء أو إعادة جدولة الجولة قبل 24 ساعة"
                : "• You can cancel or reschedule up to 24 hours in advance"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
