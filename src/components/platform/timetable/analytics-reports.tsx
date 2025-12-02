'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TimetableSlot,
  Period,
  TeacherInfo,
  SubjectInfo,
  ClassroomInfo,
  TimetableAnalytics,
  TimetableConflict
} from './types'
import {
  calculateTeacherWorkload,
  calculateUtilizationRate,
  detectConflicts,
  getDayName
} from './utils'
import { SUBJECT_COLORS, WORKLOAD_LIMITS } from "./config"
import { Users, BookOpen, MapPin, TriangleAlert, TrendingUp, Clock, Activity, Target } from "lucide-react"
import { BarChart3, PieChart as PieChartIcon } from "lucide-react"

interface AnalyticsReportsProps {
  slots: TimetableSlot[]
  periods: Period[]
  workingDays: number[]
  teachers: TeacherInfo[]
  subjects: SubjectInfo[]
  classrooms: ClassroomInfo[]
  dictionary?: any
}

export function AnalyticsReports({
  slots,
  periods,
  workingDays,
  teachers,
  subjects,
  classrooms,
  dictionary = {}
}: AnalyticsReportsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'utilization' | 'workload' | 'distribution'>('utilization')
  const [analytics, setAnalytics] = useState<TimetableAnalytics | null>(null)
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([])

  useEffect(() => {
    calculateAnalytics()
  }, [slots, periods, workingDays])

  const calculateAnalytics = () => {
    // Calculate conflicts
    const detectedConflicts = detectConflicts(slots)
    setConflicts(detectedConflicts)

    // Calculate teacher workload
    const teacherWorkload = teachers.map(teacher => {
      const workload = calculateTeacherWorkload(teacher.id, slots, periods)
      return {
        teacherId: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        hoursPerWeek: workload.hoursPerWeek,
        subjects: teacher.subjects,
        classes: Array.from(new Set(
          slots
            .filter(s => s.teacherId === teacher.id)
            .map(s => s.classId)
        ))
      }
    })

    // Calculate room utilization
    const totalPossibleSlots = workingDays.length * periods.filter(p => !p.isBreak).length
    const roomUtilization = classrooms.map(room => {
      const roomSlots = slots.filter(s => s.classroomId === room.id)
      const utilizationPercent = calculateUtilizationRate(roomSlots, totalPossibleSlots)

      // Find peak hours
      const hourCounts: Record<string, number> = {}
      roomSlots.forEach(slot => {
        const period = periods.find(p => p.id === slot.periodId)
        if (period) {
          hourCounts[period.startTime] = (hourCounts[period.startTime] || 0) + 1
        }
      })
      const peakHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour)

      return {
        roomId: room.id,
        name: room.name,
        utilizationPercent,
        peakHours
      }
    })

    // Calculate subject distribution
    const subjectDistribution = subjects.map(subject => {
      const subjectSlots = slots.filter(s => s.subjectId === subject.id)
      const totalHours = subjectSlots.length * 0.75 // Assuming 45-minute periods
      const classes = Array.from(new Set(subjectSlots.map(s => s.classId)))

      return {
        subjectId: subject.id,
        name: subject.name,
        totalHours,
        classes
      }
    })

    // Generate suggestions
    const suggestions: string[] = []
    if (detectedConflicts.length > 0) {
      suggestions.push(`Resolve ${detectedConflicts.length} scheduling conflicts`)
    }

    const underutilizedRooms = roomUtilization.filter(r => r.utilizationPercent < 50)
    if (underutilizedRooms.length > 0) {
      suggestions.push(`Optimize usage of ${underutilizedRooms.length} underutilized rooms`)
    }

    const overworkedTeachers = teacherWorkload.filter(t => t.hoursPerWeek > WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_WEEK)
    if (overworkedTeachers.length > 0) {
      suggestions.push(`Rebalance workload for ${overworkedTeachers.length} teachers`)
    }

    setAnalytics({
      totalSlots: slots.length,
      utilizationRate: calculateUtilizationRate(slots, totalPossibleSlots * classrooms.length),
      teacherWorkload,
      roomUtilization,
      subjectDistribution,
      conflicts: detectedConflicts,
      suggestions
    })
  }

  if (!analytics) return null

  // Prepare chart data
  const workloadChartData = analytics.teacherWorkload.map(t => ({
    name: t.name.split(' ')[0], // First name only for chart
    hours: t.hoursPerWeek,
    limit: WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_WEEK
  }))

  const utilizationChartData = analytics.roomUtilization.map(r => ({
    room: r.name,
    utilization: r.utilizationPercent
  }))

  const subjectPieData = analytics.subjectDistribution.map(s => ({
    name: s.name,
    value: s.totalHours
  }))

  const dayDistributionData = workingDays.map(day => ({
    day: getDayName(day, true),
    slots: slots.filter(s => s.dayOfWeek === day).length
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle><h6>Total Slots</h6></CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h3 className="text-foreground">{analytics.totalSlots}</h3>
            <p className="muted">
              <small>Across {workingDays.length} working days</small>
            </p>
            <Progress value={analytics.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle><h6>Utilization Rate</h6></CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h3 className="text-foreground">{analytics.utilizationRate}%</h3>
            <p className="muted">
              <small>Room and teacher efficiency</small>
            </p>
            <Badge
              variant={analytics.utilizationRate > 80 ? 'default' : analytics.utilizationRate > 60 ? 'secondary' : 'destructive'}
              className="mt-2"
            >
              {analytics.utilizationRate > 80 ? 'Optimal' : analytics.utilizationRate > 60 ? 'Good' : 'Low'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle><h6>Active Conflicts</h6></CardTitle>
            <TriangleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h3 className="text-foreground">{conflicts.length}</h3>
            <p className="muted">
              <small>Scheduling conflicts detected</small>
            </p>
            {conflicts.length > 0 && (
              <Button size="sm" variant="destructive" className="mt-2 h-7">
                Resolve
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle><h6>Avg Workload</h6></CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h3 className="text-foreground">
              {Math.round(
                analytics.teacherWorkload.reduce((sum, t) => sum + t.hoursPerWeek, 0) /
                analytics.teacherWorkload.length
              )}h/week
            </h3>
            <p className="muted">
              <small>Per teacher average</small>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="utilization">Room Utilization</TabsTrigger>
          <TabsTrigger value="workload">Teacher Workload</TabsTrigger>
          <TabsTrigger value="distribution">Subject Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle><h4>Room Utilization Analysis</h4></CardTitle>
              <CardDescription>
                <p className="muted">Percentage of time each room is occupied</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="room" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle><h5>Top Utilized Rooms</h5></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.roomUtilization
                    .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
                    .slice(0, 5)
                    .map(room => (
                      <div key={room.roomId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <h6>{room.name}</h6>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={room.utilizationPercent} className="w-20" />
                          <p className="muted">
                            <small>{room.utilizationPercent}%</small>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><h5>Day Distribution</h5></CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dayDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="slots" stroke="#10B981" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle><h4>Teacher Workload Distribution</h4></CardTitle>
              <CardDescription>
                <p className="muted">Weekly hours per teacher vs recommended limits</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#8B5CF6" name="Actual Hours" />
                  <Bar dataKey="limit" fill="#EF4444" name="Max Limit" opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {analytics.teacherWorkload
              .sort((a, b) => b.hoursPerWeek - a.hoursPerWeek)
              .slice(0, 6)
              .map(teacher => (
                <Card key={teacher.teacherId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        <h6>{teacher.name}</h6>
                      </CardTitle>
                      <Badge
                        variant={
                          teacher.hoursPerWeek > WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_WEEK
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {teacher.hoursPerWeek}h
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      value={(teacher.hoursPerWeek / WORKLOAD_LIMITS.TEACHER_MAX_HOURS_PER_WEEK) * 100}
                      className="mb-2"
                    />
                    <p className="muted">
                      <small>{teacher.classes.length} classes, {teacher.subjects.length} subjects</small>
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle><h4>Subject Hours Distribution</h4></CardTitle>
                <CardDescription>
                  <p className="muted">Total hours allocated per subject</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subjectPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SUBJECT_COLORS[entry.name as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.default}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><h4>Subject Coverage</h4></CardTitle>
                <CardDescription>
                  <p className="muted">Classes covered by each subject</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.subjectDistribution
                    .sort((a, b) => b.totalHours - a.totalHours)
                    .slice(0, 8)
                    .map(subject => (
                      <div key={subject.subjectId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded"
                            style={{
                              backgroundColor: SUBJECT_COLORS[subject.name as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.default
                            }}
                          />
                          <p>{subject.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{subject.totalHours}h</Badge>
                          <p className="muted">
                            <small>{subject.classes.length} classes</small>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Suggestions */}
      {analytics.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h5 className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Suggestions
              </h5>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <p>{suggestion}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}