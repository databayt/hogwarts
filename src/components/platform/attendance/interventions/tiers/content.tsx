/**
 * MTSS Tiered Interventions Content
 *
 * Dashboard for viewing students by MTSS tier and managing interventions.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  createTieredIntervention,
  getMTSSStats,
  getStudentsByTier,
} from "./actions"
import {
  getRecommendedActions,
  TIER_THRESHOLDS,
  type TierLevel,
} from "./validation"

interface Student {
  id: string
  givenName: string
  surname: string
  grNumber: string | null
  profilePhotoUrl: string | null
  absenceRate: number
  totalDays: number
  absentDays: number
  tier: TierLevel
  hasActiveIntervention: boolean
  studentYearLevels: Array<{
    yearLevel: { levelName: string } | null
  }>
}

interface TierData {
  students: Student[]
  count: number
  threshold: { min: number; max: number }
}

interface Stats {
  pending: number
  scheduled: number
  inProgress: number
  completedThisMonth: number
  escalatedThisMonth: number
  overdue: number
}

const tierConfig: Record<
  TierLevel,
  { label: { en: string; ar: string }; color: string; bgColor: string }
> = {
  TIER_1: {
    label: { en: "Tier 1 - Universal", ar: "المستوى 1 - شامل" },
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  TIER_2: {
    label: { en: "Tier 2 - Targeted", ar: "المستوى 2 - موجه" },
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  TIER_3: {
    label: { en: "Tier 3 - Intensive", ar: "المستوى 3 - مكثف" },
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
}

const actionLabels: Record<string, { en: string; ar: string }> = {
  WELCOME_MESSAGE: { en: "Welcome Message", ar: "رسالة ترحيب" },
  POSITIVE_RECOGNITION: { en: "Positive Recognition", ar: "تقدير إيجابي" },
  ATTENDANCE_INCENTIVE: { en: "Attendance Incentive", ar: "حافز الحضور" },
  CLASS_COMPETITION: { en: "Class Competition", ar: "مسابقة الفصل" },
  PERFECT_ATTENDANCE_CERTIFICATE: {
    en: "Perfect Attendance Certificate",
    ar: "شهادة حضور مثالي",
  },
  PARENT_PHONE_CALL: { en: "Parent Phone Call", ar: "اتصال ولي الأمر" },
  PARENT_EMAIL: { en: "Parent Email", ar: "بريد ولي الأمر" },
  COUNSELOR_CHECK_IN: { en: "Counselor Check-in", ar: "متابعة المرشد" },
  ACADEMIC_SUPPORT_REFERRAL: { en: "Academic Support", ar: "دعم أكاديمي" },
  ATTENDANCE_LETTER_1: { en: "Attendance Letter 1", ar: "رسالة الحضور 1" },
  MENTOR_ASSIGNMENT: { en: "Mentor Assignment", ar: "تعيين موجه" },
  PARENT_CONFERENCE_REQUEST: {
    en: "Parent Conference",
    ar: "اجتماع ولي الأمر",
  },
  HOME_VISIT_SCHEDULED: { en: "Home Visit", ar: "زيارة منزلية" },
  SOCIAL_WORKER_REFERRAL: {
    en: "Social Worker Referral",
    ar: "إحالة للأخصائي",
  },
  ATTENDANCE_CONTRACT: { en: "Attendance Contract", ar: "عقد الحضور" },
  ATTENDANCE_LETTER_2: { en: "Attendance Letter 2", ar: "رسالة الحضور 2" },
  ATTENDANCE_LETTER_3: { en: "Attendance Letter 3", ar: "رسالة الحضور 3" },
  TRUANCY_REFERRAL: { en: "Truancy Referral", ar: "إحالة للتغيب" },
  ADMINISTRATOR_MEETING: { en: "Administrator Meeting", ar: "اجتماع الإدارة" },
  COMMUNITY_RESOURCE_CONNECTION: {
    en: "Community Resources",
    ar: "موارد مجتمعية",
  },
  LEGAL_NOTICE: { en: "Legal Notice", ar: "إشعار قانوني" },
}

interface MTSSContentProps {
  locale: string
}

export function MTSSContent({ locale }: MTSSContentProps) {
  const isRTL = locale === "ar"
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<TierLevel>("TIER_2")
  const [tierData, setTierData] = useState<Record<TierLevel, TierData>>({
    TIER_1: { students: [], count: 0, threshold: TIER_THRESHOLDS.TIER_1 },
    TIER_2: { students: [], count: 0, threshold: TIER_THRESHOLDS.TIER_2 },
    TIER_3: { students: [], count: 0, threshold: TIER_THRESHOLDS.TIER_3 },
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [tierResult, statsResult] = await Promise.all([
      getStudentsByTier(),
      getMTSSStats(),
    ])

    if (tierResult.success && tierResult.data) {
      const data = tierResult.data as {
        tier1: TierData
        tier2: TierData
        tier3: TierData
      }
      setTierData({
        TIER_1: data.tier1,
        TIER_2: data.tier2,
        TIER_3: data.tier3,
      })
    }

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data as Stats)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateIntervention = async (student: Student, action: string) => {
    setIsActionLoading(true)
    const result = await createTieredIntervention({
      studentId: student.id,
      tier: student.tier,
      action,
      title: `${actionLabels[action]?.[isRTL ? "ar" : "en"] || action} - ${student.givenName} ${student.surname}`,
      priority:
        student.tier === "TIER_3" ? 4 : student.tier === "TIER_2" ? 3 : 2,
      parentNotify: student.tier !== "TIER_1",
    })

    if (result.success) {
      loadData()
      setSelectedStudent(null)
    }
    setIsActionLoading(false)
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
      <div>
        <h1 className="text-2xl font-bold">
          {isRTL ? "نظام MTSS للتدخلات" : "MTSS Intervention System"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL
            ? "إدارة التدخلات متعددة المستويات للحضور"
            : "Multi-tiered system of supports for attendance"}
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "تدخلات معلقة" : "Pending"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "مكتملة هذا الشهر" : "Completed This Month"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedThisMonth}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "تصعيدات" : "Escalations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.escalatedThisMonth}
              </div>
            </CardContent>
          </Card>
          <Card className={stats.overdue > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "متأخرة" : "Overdue"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  stats.overdue > 0 && "text-destructive"
                )}
              >
                {stats.overdue}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Tabs */}
      <Tabs
        value={selectedTier}
        onValueChange={(v) => setSelectedTier(v as TierLevel)}
      >
        <TabsList className="grid w-full grid-cols-3">
          {(["TIER_1", "TIER_2", "TIER_3"] as TierLevel[]).map((tier) => (
            <TabsTrigger
              key={tier}
              value={tier}
              className={cn(
                "data-[state=active]:bg-opacity-20",
                tierConfig[tier].color
              )}
            >
              <span className="flex items-center gap-2">
                {tierConfig[tier].label[isRTL ? "ar" : "en"]}
                <Badge variant="secondary">{tierData[tier].count}</Badge>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(["TIER_1", "TIER_2", "TIER_3"] as TierLevel[]).map((tier) => (
          <TabsContent key={tier} value={tier} className="mt-4">
            {/* Tier description */}
            <div
              className={cn(
                "mb-4 rounded-lg p-4",
                tierConfig[tier].bgColor,
                tierConfig[tier].color
              )}
            >
              <p className="font-medium">
                {tier === "TIER_1" &&
                  (isRTL
                    ? "الطلاب بنسبة غياب أقل من 10% - التركيز على الوقاية والتعزيز الإيجابي"
                    : "Students with <10% absence rate - Focus on prevention and positive reinforcement")}
                {tier === "TIER_2" &&
                  (isRTL
                    ? "الطلاب بنسبة غياب 10-19% - يحتاجون تدخل مبكر ودعم موجه"
                    : "Students with 10-19% absence rate - Need early intervention and targeted support")}
                {tier === "TIER_3" &&
                  (isRTL
                    ? "الطلاب بنسبة غياب 20% أو أكثر - يحتاجون دعم مكثف وتدخل عاجل"
                    : "Students with 20%+ absence rate - Need intensive support and urgent intervention")}
              </p>
            </div>

            {/* Student list */}
            {tierData[tier].students.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {isRTL
                      ? "لا يوجد طلاب في هذا المستوى"
                      : "No students in this tier"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tierData[tier].students.map((student) => (
                  <Card
                    key={student.id}
                    className={cn(
                      "hover:bg-accent cursor-pointer transition-colors",
                      selectedStudent?.id === student.id &&
                        "ring-primary ring-2"
                    )}
                    onClick={() =>
                      setSelectedStudent(
                        selectedStudent?.id === student.id ? null : student
                      )
                    }
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        {/* Photo */}
                        <div className="bg-muted h-12 w-12 overflow-hidden rounded-full">
                          {student.profilePhotoUrl ? (
                            <Image
                              src={student.profilePhotoUrl}
                              alt={`${student.givenName} ${student.surname}`}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg">
                              {student.givenName.charAt(0)}
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div>
                          <p className="font-medium">
                            {student.givenName} {student.surname}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {student.grNumber} •{" "}
                            {student.studentYearLevels[0]?.yearLevel?.levelName}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4">
                        <div className="text-end">
                          <p
                            className={cn(
                              "text-lg font-bold",
                              tierConfig[tier].color
                            )}
                          >
                            {student.absenceRate}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {student.absentDays}/{student.totalDays}{" "}
                            {isRTL ? "أيام" : "days"}
                          </p>
                        </div>
                        {student.hasActiveIntervention && (
                          <Badge variant="outline">
                            {isRTL ? "تدخل نشط" : "Active"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    {/* Expanded actions */}
                    {selectedStudent?.id === student.id && (
                      <div className="border-t px-4 py-3">
                        <p className="text-muted-foreground mb-2 text-sm">
                          {isRTL
                            ? "اختر إجراء التدخل:"
                            : "Select intervention action:"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getRecommendedActions(tier).map((action) => (
                            <Button
                              key={action}
                              variant="outline"
                              size="sm"
                              disabled={isActionLoading}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateIntervention(student, action)
                              }}
                            >
                              {actionLabels[action]?.[isRTL ? "ar" : "en"] ||
                                action}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
