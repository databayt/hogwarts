// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
  const { dictionary } = useDictionary()
  const t = dictionary?.attendance?.gamification
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
      getLeaderboard(20, locale as "ar" | "en"),
      getActiveCompetitions(locale as "ar" | "en"),
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
          {t?.title || "Rewards & Gamification"}
        </h1>
        <p className="text-muted-foreground">
          {t?.subtitle || "Attendance points, badges, and competitions"}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            {t?.leaderboard || "Leaderboard"}
          </TabsTrigger>
          <TabsTrigger value="competitions">
            {t?.competitions || "Competitions"}
          </TabsTrigger>
          <TabsTrigger value="badges">{t?.badges || "Badges"}</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardSection leaderboard={leaderboard} t={t} />
        </TabsContent>

        {/* Competitions Tab */}
        <TabsContent value="competitions" className="mt-4">
          <CompetitionsSection competitions={competitions} t={t} />
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          <BadgesSection t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Leaderboard Section
function LeaderboardSection({
  leaderboard,
  t,
}: {
  leaderboard: LeaderboardEntry[]
  t: Record<string, string> | undefined
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
          {t?.top_students || "Top Attendance Students"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {t?.no_data_yet || "No data yet"}
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
                      {entry.currentStreak} {t?.day_streak || "day streak"}
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
                      {t?.points || "points"}
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
  t,
}: {
  competitions: Competition[]
  t: Record<string, string> | undefined
}) {
  return (
    <div className="space-y-4">
      {competitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {t?.no_active_competitions || "No active competitions"}
            </p>
            <Button variant="outline" className="mt-4">
              {t?.create_competition || "Create Competition"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        competitions.map((competition) => (
          <Card key={competition.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{competition.name}</span>
                <Badge variant="secondary">{t?.active || "Active"}</Badge>
              </CardTitle>
              {competition.description && (
                <p className="text-muted-foreground text-sm">
                  {competition.description}
                </p>
              )}
              {competition.winnerReward && (
                <p className="text-sm">
                  <span className="font-medium">{t?.prize || "Prize: "}</span>
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
                      {entry.totalStudents} {t?.students || "students"} •{" "}
                      {entry.presentDays} {t?.present || "present"} /{" "}
                      {entry.presentDays + entry.absentDays} {t?.days || "days"}
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
function BadgesSection({ t }: { t: Record<string, string> | undefined }) {
  const badges = [
    {
      code: "PERFECT_WEEK",
      name: t?.perfect_week || "Perfect Week",
      description: t?.perfect_week_desc || "5 consecutive days of attendance",
      icon: "📅",
      color: "#10B981",
      points: 50,
    },
    {
      code: "PERFECT_MONTH",
      name: t?.perfect_month || "Perfect Month",
      description: t?.perfect_month_desc || "100% attendance for the month",
      icon: "🏆",
      color: "#F59E0B",
      points: 200,
    },
    {
      code: "EARLY_BIRD",
      name: t?.early_bird || "Early Bird",
      description: t?.early_bird_desc || "20 consecutive on-time days",
      icon: "🌅",
      color: "#8B5CF6",
      points: 100,
    },
    {
      code: "COMEBACK_KID",
      name: t?.comeback_kid || "Comeback Kid",
      description: t?.comeback_kid_desc || "Improved attendance by 15%",
      icon: "📈",
      color: "#EC4899",
      points: 75,
    },
    {
      code: "ATTENDANCE_CHAMPION",
      name: t?.attendance_champion || "Attendance Champion",
      description:
        t?.attendance_champion_desc || "Top 3 in monthly leaderboard",
      icon: "🏅",
      color: "#EAB308",
      points: 150,
    },
    {
      code: "STREAK_MASTER",
      name: t?.streak_master || "Streak Master",
      description: t?.streak_master_desc || "30-day attendance streak",
      icon: "🔥",
      color: "#EF4444",
      points: 300,
    },
    {
      code: "TEAM_PLAYER",
      name: t?.team_player || "Team Player",
      description: t?.team_player_desc || "Part of competition winning class",
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
