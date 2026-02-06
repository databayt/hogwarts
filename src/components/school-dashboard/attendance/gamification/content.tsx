/**
 * Gamification Content
 *
 * Main UI for attendance gamification features.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  getActiveCompetitions,
  getLeaderboard,
  initializeDefaultBadges,
} from "./actions"
import type { LeaderboardEntry } from "./validation"

interface Competition {
  id: string
  name: string
  lang: string
  description: string | null
  startDate: Date
  endDate: Date
  winnerReward: string | null
  entries: {
    rank: number
    classId: string
    className: string
    classLang: string
    attendanceRate: number
    totalStudents: number
    presentDays: number
    absentDays: number
  }[]
}

interface GamificationContentProps {
  locale: string
}

export function GamificationContent({ locale }: GamificationContentProps) {
  const isRTL = locale === "ar"
  const [isLoading, setIsLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [activeTab, setActiveTab] = useState("leaderboard")

  const loadData = useCallback(async () => {
    setIsLoading(true)

    // Initialize badges if needed
    await initializeDefaultBadges()

    const [leaderboardResult, competitionsResult] = await Promise.all([
      getLeaderboard(20),
      getActiveCompetitions(),
    ])

    if (leaderboardResult.success && leaderboardResult.data) {
      setLeaderboard(leaderboardResult.data as LeaderboardEntry[])
    }

    if (competitionsResult.success && competitionsResult.data) {
      setCompetitions(competitionsResult.data as Competition[])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          {isRTL ? "نظام المكافآت" : "Rewards & Gamification"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL
            ? "نقاط الحضور والشارات والمسابقات"
            : "Attendance points, badges, and competitions"}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            {isRTL ? "لوحة المتصدرين" : "Leaderboard"}
          </TabsTrigger>
          <TabsTrigger value="competitions">
            {isRTL ? "المسابقات" : "Competitions"}
          </TabsTrigger>
          <TabsTrigger value="badges">
            {isRTL ? "الشارات" : "Badges"}
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardSection leaderboard={leaderboard} isRTL={isRTL} />
        </TabsContent>

        {/* Competitions Tab */}
        <TabsContent value="competitions" className="mt-4">
          <CompetitionsSection competitions={competitions} isRTL={isRTL} />
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          <BadgesSection isRTL={isRTL} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Leaderboard Section
function LeaderboardSection({
  leaderboard,
  isRTL,
}: {
  leaderboard: LeaderboardEntry[]
  isRTL: boolean
}) {
  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500"
    if (rank === 2) return "text-gray-400"
    if (rank === 3) return "text-amber-600"
    return "text-muted-foreground"
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          {isRTL ? "أفضل الطلاب حضوراً" : "Top Attendance Students"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {isRTL ? "لا توجد بيانات بعد" : "No data yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.studentId}
                className={cn(
                  "flex items-center justify-between rounded-lg p-3 transition-colors",
                  entry.rank <= 3 ? "bg-accent" : "hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className={cn(
                      "w-10 text-center text-xl font-bold",
                      getMedalColor(entry.rank)
                    )}
                  >
                    {getMedalEmoji(entry.rank)}
                  </div>

                  {/* Photo */}
                  <div className="bg-muted h-12 w-12 overflow-hidden rounded-full">
                    {entry.profilePhotoUrl ? (
                      <Image
                        src={entry.profilePhotoUrl}
                        alt={entry.studentName}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-medium">
                        {entry.studentName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name and streak */}
                  <div>
                    <p className="font-medium">{entry.studentName}</p>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <span className="text-orange-500">🔥</span>
                      {entry.currentStreak}{" "}
                      {isRTL ? "يوم متتالي" : "day streak"}
                    </div>
                  </div>
                </div>

                {/* Points and badges */}
                <div className="flex items-center gap-4">
                  {/* Badges */}
                  <div className="hidden gap-1 md:flex">
                    {entry.badges.slice(0, 3).map((badge, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full text-center text-sm"
                        style={{ backgroundColor: badge.color + "20" }}
                        title={badge.name}
                      >
                        {badge.icon === "trophy" && "🏆"}
                        {badge.icon === "flame" && "🔥"}
                        {badge.icon === "medal" && "🏅"}
                        {badge.icon === "sunrise" && "🌅"}
                        {badge.icon === "calendar-check" && "📅"}
                        {badge.icon === "trending-up" && "📈"}
                        {badge.icon === "users" && "👥"}
                      </div>
                    ))}
                  </div>

                  {/* Points */}
                  <div className="text-end">
                    <p className="text-primary text-xl font-bold">
                      {entry.points.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {isRTL ? "نقطة" : "points"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Competitions Section
function CompetitionsSection({
  competitions,
  isRTL,
}: {
  competitions: Competition[]
  isRTL: boolean
}) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {isRTL ? "لا توجد مسابقات نشطة" : "No active competitions"}
            </p>
            <Button variant="outline" className="mt-4">
              {isRTL ? "إنشاء مسابقة" : "Create Competition"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        competitions.map((competition) => (
          <Card key={competition.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{competition.name}</span>
                <Badge variant="secondary">{isRTL ? "نشطة" : "Active"}</Badge>
              </CardTitle>
              {competition.description && (
                <p className="text-muted-foreground text-sm">
                  {competition.description}
                </p>
              )}
              {competition.winnerReward && (
                <p className="text-sm">
                  <span className="font-medium">
                    {isRTL ? "الجائزة: " : "Prize: "}
                  </span>
                  {competition.winnerReward}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competition.entries.map((entry) => (
                  <div
                    key={entry.classId}
                    className={cn(
                      "rounded-lg p-3",
                      entry.rank === 1 &&
                        "border border-yellow-200 bg-yellow-50"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-lg font-bold",
                            entry.rank === 1 && "text-yellow-500",
                            entry.rank === 2 && "text-gray-400",
                            entry.rank === 3 && "text-amber-600"
                          )}
                        >
                          #{entry.rank}
                        </span>
                        <span className="font-medium">{entry.className}</span>
                      </div>
                      <span className="text-primary text-xl font-bold">
                        {entry.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={entry.attendanceRate} className="h-2" />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {entry.totalStudents} {isRTL ? "طالب" : "students"} •{" "}
                      {entry.presentDays} {isRTL ? "حضور" : "present"} /{" "}
                      {entry.presentDays + entry.absentDays}{" "}
                      {isRTL ? "يوم" : "days"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// Badges Section
function BadgesSection({ isRTL }: { isRTL: boolean }) {
  const badges = [
    {
      code: "PERFECT_WEEK",
      name: isRTL ? "أسبوع مثالي" : "Perfect Week",
      description: isRTL
        ? "5 أيام متتالية من الحضور"
        : "5 consecutive days of attendance",
      icon: "📅",
      color: "#10B981",
      points: 50,
    },
    {
      code: "PERFECT_MONTH",
      name: isRTL ? "شهر مثالي" : "Perfect Month",
      description: isRTL
        ? "حضور 100% طوال الشهر"
        : "100% attendance for the month",
      icon: "🏆",
      color: "#F59E0B",
      points: 200,
    },
    {
      code: "EARLY_BIRD",
      name: isRTL ? "الطائر المبكر" : "Early Bird",
      description: isRTL
        ? "20 يوماً متتالياً في الوقت"
        : "20 consecutive on-time days",
      icon: "🌅",
      color: "#8B5CF6",
      points: 100,
    },
    {
      code: "COMEBACK_KID",
      name: isRTL ? "العودة القوية" : "Comeback Kid",
      description: isRTL
        ? "تحسين الحضور بنسبة 15%"
        : "Improved attendance by 15%",
      icon: "📈",
      color: "#EC4899",
      points: 75,
    },
    {
      code: "ATTENDANCE_CHAMPION",
      name: isRTL ? "بطل الحضور" : "Attendance Champion",
      description: isRTL
        ? "ضمن أفضل 3 في الشهر"
        : "Top 3 in monthly leaderboard",
      icon: "🏅",
      color: "#EAB308",
      points: 150,
    },
    {
      code: "STREAK_MASTER",
      name: isRTL ? "خبير السلاسل" : "Streak Master",
      description: isRTL
        ? "30 يوماً متتالياً من الحضور"
        : "30-day attendance streak",
      icon: "🔥",
      color: "#EF4444",
      points: 300,
    },
    {
      code: "TEAM_PLAYER",
      name: isRTL ? "لاعب الفريق" : "Team Player",
      description: isRTL
        ? "جزء من فريق فائز بمسابقة"
        : "Part of competition winning class",
      icon: "👥",
      color: "#3B82F6",
      points: 100,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <Card
          key={badge.code}
          className="hover:border-primary transition-colors"
        >
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                style={{ backgroundColor: badge.color + "20" }}
              >
                {badge.icon}
              </div>
              <div>
                <h3 className="font-semibold">{badge.name}</h3>
                <Badge variant="secondary">+{badge.points} pts</Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{badge.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
