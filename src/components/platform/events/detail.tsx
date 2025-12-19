"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CircleAlert,
  Clock,
  FileText,
  Globe,
  Lock,
  MapPin,
  User,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// Type for event detail - matches the select result from actions.ts
interface EventDetailResult {
  id: string
  schoolId: string
  title: string
  description: string | null
  eventType: string
  eventDate: Date
  startTime: string
  endTime: string
  location: string | null
  organizer: string | null
  targetAudience: string | null
  maxAttendees: number | null
  currentAttendees: number
  isPublic: boolean
  registrationRequired: boolean
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

interface EventDetailContentProps {
  data: EventDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function EventDetailContent({
  data,
  error,
  dictionary,
  lang,
}: EventDetailContentProps) {
  const router = useRouter()
  const isRTL = lang === "ar"

  const t = {
    back: isRTL ? "رجوع" : "Back",
    details: isRTL ? "تفاصيل الفعالية" : "Event Details",
    description: isRTL ? "الوصف" : "Description",
    eventType: isRTL ? "نوع الفعالية" : "Event Type",
    date: isRTL ? "التاريخ" : "Date",
    time: isRTL ? "الوقت" : "Time",
    location: isRTL ? "الموقع" : "Location",
    organizer: isRTL ? "المنظم" : "Organizer",
    audience: isRTL ? "الفئة المستهدفة" : "Target Audience",
    attendees: isRTL ? "الحضور" : "Attendees",
    status: isRTL ? "الحالة" : "Status",
    visibility: isRTL ? "الرؤية" : "Visibility",
    registration: isRTL ? "التسجيل" : "Registration",
    notes: isRTL ? "ملاحظات" : "Notes",
    createdAt: isRTL ? "تاريخ الإنشاء" : "Created",
    errorTitle: isRTL ? "خطأ" : "Error",
    notFound: isRTL ? "الفعالية غير موجودة" : "Event not found",
    public: isRTL ? "عام" : "Public",
    private: isRTL ? "خاص" : "Private",
    required: isRTL ? "مطلوب" : "Required",
    optional: isRTL ? "اختياري" : "Optional",
    noDescription: isRTL ? "لا يوجد وصف" : "No description",
    noNotes: isRTL ? "لا توجد ملاحظات" : "No notes",
    tbd: isRTL ? "سيتم تحديده" : "TBD",
    all: isRTL ? "الكل" : "All",
    unlimited: isRTL ? "غير محدود" : "Unlimited",
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      case "PLANNED":
      default:
        return "outline"
    }
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>{error || t.notFound}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{data.title}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(data.eventDate).toLocaleDateString(
                isRTL ? "ar-SA" : "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(data.status)}>{data.status}</Badge>
          <Badge variant={data.isPublic ? "secondary" : "outline"}>
            {data.isPublic ? (
              <>
                <Globe className="mr-1 h-3 w-3" />
                {t.public}
              </>
            ) : (
              <>
                <Lock className="mr-1 h-3 w-3" />
                {t.private}
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Description Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.description}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {data.description ? (
              <p className="whitespace-pre-wrap">{data.description}</p>
            ) : (
              <p className="text-muted-foreground italic">{t.noDescription}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Event Type Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.eventType}</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{data.eventType}</Badge>
          </CardContent>
        </Card>

        {/* Time Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.time}</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.startTime} - {data.endTime}
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.location}</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.location || t.tbd}
            </div>
          </CardContent>
        </Card>

        {/* Organizer Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.organizer}</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.organizer || t.tbd}
            </div>
          </CardContent>
        </Card>

        {/* Target Audience Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.audience}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.targetAudience || t.all}
            </div>
          </CardContent>
        </Card>

        {/* Attendees Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.attendees}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.currentAttendees} / {data.maxAttendees || t.unlimited}
            </div>
          </CardContent>
        </Card>

        {/* Registration Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.registration}
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={data.registrationRequired ? "default" : "secondary"}
            >
              {data.registrationRequired ? t.required : t.optional}
            </Badge>
          </CardContent>
        </Card>

        {/* Created At Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.createdAt}</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {new Date(data.createdAt).toLocaleDateString(
                isRTL ? "ar-SA" : "en-US"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Card */}
      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.notes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{data.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function EventDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-32" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
