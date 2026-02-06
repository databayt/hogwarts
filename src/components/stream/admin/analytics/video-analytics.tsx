"use client"

import { useEffect, useState } from "react"
import { Activity, BarChart3, Eye, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { getVideoAnalytics, VideoAnalyticsData } from "./video-actions"

interface VideoAnalyticsProps {
  courseId: string
}

export function VideoAnalytics({ courseId }: VideoAnalyticsProps) {
  const [data, setData] = useState<VideoAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const result = await getVideoAnalytics(courseId)
      setData(result)
      setIsLoading(false)
    }
    fetch()
  }, [courseId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No video analytics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Lessons
              </p>
              <h3 className="mt-1.5 text-2xl font-bold">
                {data.overall.totalLessons}
              </h3>
            </div>
            <div className="rounded-full bg-blue-100 p-2.5">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Watch Sessions
              </p>
              <h3 className="mt-1.5 text-2xl font-bold">
                {data.overall.totalWatchSessions}
              </h3>
            </div>
            <div className="rounded-full bg-green-100 p-2.5">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Avg Completion
              </p>
              <h3 className="mt-1.5 text-2xl font-bold">
                {data.overall.avgCompletionPercent}%
              </h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-2.5">
              <Activity className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Active (7d)
              </p>
              <h3 className="mt-1.5 text-2xl font-bold">
                {data.overall.activeStudentsLast7Days}
              </h3>
            </div>
            <div className="rounded-full bg-purple-100 p-2.5">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Per-Lesson Completion Chart */}
      {data.lessons.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Lesson Completion Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.lessons.map((l) => ({
                name:
                  l.title.length > 20 ? l.title.slice(0, 20) + "…" : l.title,
                completion: l.avgCompletionPercent,
                watchers: l.totalWatchers,
              }))}
              margin={{ bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "completion"
                    ? [`${value}%`, "Avg Completion"]
                    : [value, "Watchers"]
                }
              />
              <Bar dataKey="completion" name="completion" radius={[4, 4, 0, 0]}>
                {data.lessons.map((lesson) => (
                  <Cell
                    key={lesson.id}
                    fill={
                      lesson.avgCompletionPercent >= 75
                        ? "#22c55e"
                        : lesson.avgCompletionPercent >= 50
                          ? "#eab308"
                          : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Watched + Drop-off */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Watched */}
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Most Watched Lessons</h3>
          <div className="space-y-3">
            {data.topWatched.length > 0 ? (
              data.topWatched.slice(0, 5).map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{lesson.title}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {lesson.watchCount} views
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No watch data yet</p>
            )}
          </div>
        </Card>

        {/* Lessons needing attention */}
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Low Completion Lessons</h3>
          <div className="space-y-3">
            {data.lessons
              .filter((l) => l.totalWatchers > 0 && l.avgCompletionPercent < 50)
              .sort((a, b) => a.avgCompletionPercent - b.avgCompletionPercent)
              .slice(0, 5)
              .map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{lesson.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {lesson.chapterTitle}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-red-500">
                    {lesson.avgCompletionPercent}%
                  </span>
                </div>
              ))}
            {data.lessons.filter(
              (l) => l.totalWatchers > 0 && l.avgCompletionPercent < 50
            ).length === 0 && (
              <p className="text-muted-foreground text-sm">
                All lessons have good completion rates
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
