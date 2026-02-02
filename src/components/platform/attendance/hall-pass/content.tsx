/**
 * Hall Pass Content
 *
 * Main content component for hall pass management.
 * Shows active passes and allows issuing new ones.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { cancelHallPass, getActiveHallPasses, returnHallPass } from "./actions"
import { IssuePassDialog } from "./issue-dialog"
import type { HallPassDestination } from "./validation"

interface ActivePass {
  id: string
  student: {
    id: string
    name: string
    photoUrl?: string | null
  }
  class: {
    id: string
    name: string
  }
  destination: HallPassDestination
  destinationNote?: string | null
  issuedAt: Date
  expectedReturn: Date
  expectedDuration: number
  minutesRemaining: number
  hasConflict: boolean
}

const destinationLabels: Record<
  HallPassDestination,
  { en: string; ar: string }
> = {
  BATHROOM: { en: "Bathroom", ar: "دورة المياه" },
  NURSE: { en: "Nurse", ar: "العيادة" },
  OFFICE: { en: "Office", ar: "الإدارة" },
  COUNSELOR: { en: "Counselor", ar: "المرشد" },
  LIBRARY: { en: "Library", ar: "المكتبة" },
  LOCKER: { en: "Locker", ar: "الخزانة" },
  WATER_FOUNTAIN: { en: "Water Fountain", ar: "برادة الماء" },
  OTHER: { en: "Other", ar: "أخرى" },
}

const destinationIcons: Record<HallPassDestination, string> = {
  BATHROOM: "🚻",
  NURSE: "🏥",
  OFFICE: "🏢",
  COUNSELOR: "💬",
  LIBRARY: "📚",
  LOCKER: "🔐",
  WATER_FOUNTAIN: "💧",
  OTHER: "📍",
}

interface HallPassContentProps {
  locale: string
  classId?: string
}

export function HallPassContent({ locale, classId }: HallPassContentProps) {
  const isRTL = locale === "ar"
  const [passes, setPasses] = useState<ActivePass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)

  const loadPasses = useCallback(async () => {
    const result = await getActiveHallPasses()
    if (result.success && result.data) {
      setPasses(result.data as ActivePass[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadPasses()
    // Refresh every 30 seconds
    const interval = setInterval(loadPasses, 30000)
    return () => clearInterval(interval)
  }, [loadPasses])

  const handleReturn = async (passId: string) => {
    const result = await returnHallPass({ passId })
    if (result.success) {
      loadPasses()
    }
  }

  const handleCancel = async (passId: string) => {
    const result = await cancelHallPass(passId)
    if (result.success) {
      loadPasses()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTimeStatus = (minutesRemaining: number) => {
    if (minutesRemaining <= 0) return "expired"
    if (minutesRemaining <= 2) return "warning"
    return "normal"
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "تصاريح المرور" : "Hall Passes"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL
              ? `${passes.length} طالب خارج الفصل حالياً`
              : `${passes.length} students currently out`}
          </p>
        </div>
        <Button onClick={() => setIsIssueDialogOpen(true)}>
          {isRTL ? "إصدار تصريح جديد" : "Issue New Pass"}
        </Button>
      </div>

      {/* Active passes grid */}
      {passes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl">
              ✓
            </div>
            <h3 className="mb-2 text-lg font-medium">
              {isRTL ? "لا يوجد طلاب خارج الفصل" : "No students out"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isRTL
                ? "جميع الطلاب في فصولهم"
                : "All students are in their classrooms"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {passes.map((pass) => {
            const timeStatus = getTimeStatus(pass.minutesRemaining)
            return (
              <Card
                key={pass.id}
                className={cn(
                  "relative overflow-hidden",
                  timeStatus === "expired" && "border-destructive",
                  timeStatus === "warning" && "border-yellow-500",
                  pass.hasConflict && "ring-2 ring-orange-500"
                )}
              >
                {/* Time indicator bar */}
                <div
                  className={cn(
                    "absolute top-0 right-0 left-0 h-1",
                    timeStatus === "expired" && "bg-destructive",
                    timeStatus === "warning" && "bg-yellow-500",
                    timeStatus === "normal" && "bg-primary"
                  )}
                />

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Student photo */}
                      <div className="bg-muted h-10 w-10 overflow-hidden rounded-full">
                        {pass.student.photoUrl ? (
                          <Image
                            src={pass.student.photoUrl}
                            alt={pass.student.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            {pass.student.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {pass.student.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {pass.class.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl">
                      {destinationIcons[pass.destination]}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Destination */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {isRTL ? "الوجهة" : "Destination"}
                    </span>
                    <span className="font-medium">
                      {destinationLabels[pass.destination][isRTL ? "ar" : "en"]}
                    </span>
                  </div>

                  {/* Time info */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {isRTL ? "الخروج" : "Left at"}
                    </span>
                    <span>{formatTime(pass.issuedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {isRTL ? "العودة المتوقعة" : "Expected back"}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        timeStatus === "expired" && "text-destructive",
                        timeStatus === "warning" && "text-yellow-600"
                      )}
                    >
                      {formatTime(pass.expectedReturn)}
                    </span>
                  </div>

                  {/* Time remaining */}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-center",
                      timeStatus === "expired" &&
                        "bg-destructive/10 text-destructive",
                      timeStatus === "warning" &&
                        "bg-yellow-100 text-yellow-700",
                      timeStatus === "normal" && "bg-muted"
                    )}
                  >
                    {timeStatus === "expired" ? (
                      <span className="font-medium">
                        {isRTL ? "تجاوز الوقت المحدد" : "Overdue"}
                      </span>
                    ) : (
                      <span>
                        {pass.minutesRemaining}{" "}
                        {isRTL ? "دقيقة متبقية" : "min remaining"}
                      </span>
                    )}
                  </div>

                  {/* Conflict warning */}
                  {pass.hasConflict && (
                    <div className="rounded-lg bg-orange-100 px-3 py-2 text-center text-sm text-orange-700">
                      {isRTL
                        ? "تحذير: طالب آخر في نفس الوجهة"
                        : "Warning: Another student at same destination"}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCancel(pass.id)}
                    >
                      {isRTL ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReturn(pass.id)}
                    >
                      {isRTL ? "تسجيل العودة" : "Mark Returned"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Issue dialog */}
      <IssuePassDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        classId={classId}
        locale={locale}
        onSuccess={loadPasses}
      />
    </div>
  )
}
