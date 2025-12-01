'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Users,
  DoorOpen,
  BookOpen,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import {
  getTermsForSelection,
  getTimetableAnalytics
} from '../actions'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  dictionary: Dictionary['school']
}

type AnalyticsData = {
  summary: {
    totalSlots: number
    totalTeachers: number
    totalRooms: number
    totalClasses: number
    conflictCount: number
  }
  teacherWorkload: {
    id: string
    name: string
    periodsPerWeek: number
    classesCount: number
    subjects: string[]
  }[]
  roomUtilization: {
    id: string
    name: string
    capacity: number
    usedSlots: number
    totalSlots: number
    utilizationRate: number
  }[]
  subjectDistribution: {
    name: string
    periodsPerWeek: number
    classesCount: number
  }[]
  conflicts: unknown[]
}

export default function TimetableAnalyticsContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  // Load terms on mount
  useEffect(() => {
    loadTerms()
  }, [])

  // Load analytics when term changes
  useEffect(() => {
    if (selectedTerm) {
      loadAnalytics()
    }
  }, [selectedTerm])

  const loadTerms = async () => {
    try {
      const { terms: fetchedTerms } = await getTermsForSelection()
      setTerms(fetchedTerms)
      if (fetchedTerms.length > 0) {
        setSelectedTerm(fetchedTerms[0].id)
      }
    } catch {
      setError('Failed to load terms')
    }
  }

  const loadAnalytics = async () => {
    startTransition(async () => {
      setError(null)
      try {
        const data = await getTimetableAnalytics({ termId: selectedTerm })
        setAnalytics(data as AnalyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      }
    })
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-red-500'
    if (rate >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {d?.analytics?.title || 'Timetable Analytics'}
          </CardTitle>
          <CardDescription>
            {d?.analytics?.description || 'Teacher workload and room utilization analytics'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={isPending || !selectedTerm}>
                <RefreshCw className={cn("h-4 w-4 me-2", isPending && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isPending && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      )}

      {/* Analytics Dashboard */}
      {!isPending && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.totalSlots}</p>
                    <p className="text-sm text-muted-foreground">Total Slots</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.totalTeachers}</p>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.totalClasses}</p>
                    <p className="text-sm text-muted-foreground">Classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <DoorOpen className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.totalRooms}</p>
                    <p className="text-sm text-muted-foreground">Rooms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(analytics.summary.conflictCount > 0 && "border-red-500")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={cn(
                    "h-8 w-8",
                    analytics.summary.conflictCount > 0 ? "text-red-500" : "text-green-500"
                  )} />
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.conflictCount}</p>
                    <p className="text-sm text-muted-foreground">Conflicts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Teacher Workload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Teacher Workload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.teacherWorkload.slice(0, 10).map(teacher => (
                  <div key={teacher.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{teacher.name}</span>
                      <span className="text-muted-foreground">
                        {teacher.periodsPerWeek} periods | {teacher.classesCount} classes
                      </span>
                    </div>
                    <Progress
                      value={Math.min((teacher.periodsPerWeek / 30) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
                {analytics.teacherWorkload.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No teacher data available</p>
                )}
              </CardContent>
            </Card>

            {/* Room Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DoorOpen className="h-5 w-5" />
                  Room Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.roomUtilization.slice(0, 10).map(room => (
                  <div key={room.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{room.name}</span>
                      <span className={cn(
                        "font-semibold",
                        room.utilizationRate >= 80 ? "text-red-500" :
                        room.utilizationRate >= 60 ? "text-yellow-500" : "text-green-500"
                      )}>
                        {room.utilizationRate}%
                      </span>
                    </div>
                    <Progress
                      value={room.utilizationRate}
                      className={cn("h-2", getUtilizationColor(room.utilizationRate))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {room.usedSlots}/{room.totalSlots} slots ({room.capacity} seats)
                    </p>
                  </div>
                ))}
                {analytics.roomUtilization.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No room data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Subject Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {analytics.subjectDistribution.map(subject => (
                  <div
                    key={subject.name}
                    className="p-4 bg-muted rounded-lg space-y-2"
                  >
                    <h4 className="font-semibold">{subject.name}</h4>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{subject.periodsPerWeek} periods/week</span>
                      <span>{subject.classesCount} classes</span>
                    </div>
                  </div>
                ))}
                {analytics.subjectDistribution.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-4">
                    No subject data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Term Selected */}
      {!selectedTerm && !isPending && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a term to view analytics</p>
        </div>
      )}
    </div>
  )
}
