import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { getBookingDetails } from "@/components/site/admission/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowLeft, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface BookingPageProps {
  params: Promise<{ lang: Locale; subdomain: string; bookingId: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { bookingId } = await params;

  return {
    title: `Booking ${bookingId}`,
    description: "View and manage your tour booking.",
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { lang, subdomain, bookingId } = await params;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  const school = schoolResult.data;
  const isRTL = lang === "ar";

  // Fetch booking details
  const bookingResult = await getBookingDetails(bookingId);

  if (!bookingResult.success || !bookingResult.data) {
    return (
      <div className="min-h-screen py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-xl font-bold mb-2">
                {isRTL ? "لم يتم العثور على الحجز" : "Booking Not Found"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isRTL
                  ? "لم نتمكن من العثور على حجز بهذا الرقم"
                  : "We couldn't find a booking with this number"}
              </p>
              <Link href={`/${lang}/s/${subdomain}/tour`}>
                <Button>
                  {isRTL ? "حجز جولة جديدة" : "Book a New Tour"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const booking = bookingResult.data;
  const slotDate = new Date(booking.slot.date);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    RESCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
    NO_SHOW: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    PENDING: { en: "Pending", ar: "قيد الانتظار" },
    CONFIRMED: { en: "Confirmed", ar: "مؤكد" },
    CANCELLED: { en: "Cancelled", ar: "ملغى" },
    RESCHEDULED: { en: "Rescheduled", ar: "أعيد جدولته" },
    COMPLETED: { en: "Completed", ar: "مكتمل" },
    NO_SHOW: { en: "No Show", ar: "لم يحضر" },
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Link
          href={`/${lang}/s/${subdomain}/tour`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          {isRTL ? "العودة إلى حجز الجولات" : "Back to Tour Booking"}
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>
                  {isRTL ? "رقم الحجز" : "Booking Number"}
                </CardDescription>
                <CardTitle className="text-xl font-mono">
                  {booking.bookingNumber}
                </CardTitle>
              </div>
              <Badge className={statusColors[booking.status] || statusColors.PENDING}>
                {statusLabels[booking.status]?.[isRTL ? "ar" : "en"] || booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tour Details */}
            <div className="space-y-4">
              <h3 className="font-medium">
                {isRTL ? "تفاصيل الجولة" : "Tour Details"}
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {format(slotDate, "EEEE, MMMM d, yyyy", {
                      locale: isRTL ? ar : enUS,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {booking.slot.startTime} - {booking.slot.endTime}
                  </span>
                </div>
                {booking.slot.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{booking.slot.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {booking.numberOfAttendees} {isRTL ? "شخص" : "attendee(s)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">
                {isRTL ? "معلومات الاتصال" : "Contact Information"}
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? "الاسم" : "Name"}</span>
                  <span>{booking.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? "البريد" : "Email"}</span>
                  <span>{booking.email}</span>
                </div>
                {booking.studentName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? "اسم الطالب" : "Student"}</span>
                    <span>{booking.studentName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  {isRTL
                    ? "هل تريد تغيير موعدك؟ تواصل معنا لإعادة الجدولة أو الإلغاء."
                    : "Need to change your appointment? Contact us to reschedule or cancel."}
                </p>
                <div className="flex gap-3">
                  <a href={`mailto:admissions@${subdomain}.edu?subject=Reschedule Tour ${booking.bookingNumber}`}>
                    <Button variant="outline" size="sm">
                      {isRTL ? "إعادة جدولة" : "Reschedule"}
                    </Button>
                  </a>
                  <a href={`mailto:admissions@${subdomain}.edu?subject=Cancel Tour ${booking.bookingNumber}`}>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      {isRTL ? "إلغاء" : "Cancel"}
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="mt-6 flex gap-4 justify-center">
          <Link href={`/${lang}/s/${subdomain}`}>
            <Button variant="outline">
              {isRTL ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
          <Link href={`/${lang}/s/${subdomain}/apply`}>
            <Button>
              {isRTL ? "قدم الآن" : "Apply Now"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
