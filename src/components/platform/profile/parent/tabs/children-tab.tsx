/**
 * Parent Profile Children Tab
 * Detailed view of each child's academic progress and activities
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, GraduationCap, Calendar, Award, BookOpen, Activity, Clock, TrendingUp, TrendingDown, CircleAlert, CircleCheck, ChevronRight, FileText, Heart, Target, Star, Briefcase } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import type { ParentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ChildrenTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

interface ChildPerformance {
  subject: string
  currentGrade: string
  previousGrade: string
  trend: 'up' | 'down' | 'stable'
  assignments: number
  completed: number
  average: number
}

interface ChildActivity {
  id: string
  type: 'academic' | 'extracurricular' | 'achievement' | 'attendance'
  title: string
  description: string
  date: Date
  importance: 'high' | 'medium' | 'low'
}

// ============================================================================
// Mock Data
// ============================================================================

const mockPerformance: Record<string, ChildPerformance[]> = {
  'student-1': [
    { subject: 'Mathematics', currentGrade: 'A', previousGrade: 'B+', trend: 'up', assignments: 12, completed: 11, average: 92 },
    { subject: 'Science', currentGrade: 'A-', previousGrade: 'A-', trend: 'stable', assignments: 10, completed: 10, average: 88 },
    { subject: 'English', currentGrade: 'B+', previousGrade: 'B', trend: 'up', assignments: 15, completed: 14, average: 85 },
    { subject: 'History', currentGrade: 'A', previousGrade: 'A', trend: 'stable', assignments: 8, completed: 8, average: 90 },
    { subject: 'Art', currentGrade: 'A+', previousGrade: 'A', trend: 'up', assignments: 6, completed: 6, average: 95 }
  ],
  'student-2': [
    { subject: 'Mathematics', currentGrade: 'A', previousGrade: 'A', trend: 'stable', assignments: 12, completed: 12, average: 95 },
    { subject: 'Science', currentGrade: 'A', previousGrade: 'A-', trend: 'up', assignments: 10, completed: 10, average: 94 },
    { subject: 'English', currentGrade: 'A', previousGrade: 'A', trend: 'stable', assignments: 15, completed: 15, average: 91 },
    { subject: 'History', currentGrade: 'B+', previousGrade: 'B+', trend: 'stable', assignments: 8, completed: 7, average: 86 },
    { subject: 'Music', currentGrade: 'A+', previousGrade: 'A+', trend: 'stable', assignments: 5, completed: 5, average: 98 }
  ]
}

const mockActivities: Record<string, ChildActivity[]> = {
  'student-1': [
    { id: '1', type: 'academic', title: 'Math Test Tomorrow', description: 'Chapter 5 - Algebra', date: new Date(Date.now() + 24 * 60 * 60 * 1000), importance: 'high' },
    { id: '2', type: 'achievement', title: 'Science Fair Winner', description: 'First place in school science fair', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), importance: 'high' },
    { id: '3', type: 'extracurricular', title: 'Basketball Practice', description: 'Team practice for upcoming tournament', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), importance: 'medium' },
    { id: '4', type: 'attendance', title: 'Perfect Attendance', description: 'No absences this month', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), importance: 'medium' }
  ],
  'student-2': [
    { id: '5', type: 'academic', title: 'English Essay Due', description: 'Shakespeare analysis paper', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), importance: 'high' },
    { id: '6', type: 'achievement', title: 'Math Olympiad Qualifier', description: 'Qualified for state level competition', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), importance: 'high' },
    { id: '7', type: 'extracurricular', title: 'Music Recital', description: 'Annual school concert performance', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), importance: 'high' },
    { id: '8', type: 'academic', title: 'Science Project Submission', description: 'Group project on renewable energy', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), importance: 'medium' }
  ]
}

// ============================================================================
// Component
// ============================================================================

export function ChildrenTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: ChildrenTabProps) {
  const [selectedChild, setSelectedChild] = useState((profile.children || [])[0]?.id)
  const { children, parentingInfo } = profile

  const getActivityIcon = (type: ChildActivity['type']) => {
    switch (type) {
      case 'academic': return <BookOpen className="h-4 w-4" />
      case 'extracurricular': return <Activity className="h-4 w-4" />
      case 'achievement': return <Award className="h-4 w-4" />
      case 'attendance': return <Calendar className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getImportanceColor = (importance: ChildActivity['importance']) => {
    switch (importance) {
      case 'high': return 'text-destructive'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-muted-foreground'
      default: return ''
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Child Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(children || []).map((child) => (
          <Button
            key={child.id}
            variant={selectedChild === child.id ? 'default' : 'outline'}
            onClick={() => setSelectedChild(child.id)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={child.profilePhotoUrl || undefined} />
              <AvatarFallback>{child.givenName?.[0] || "?"}</AvatarFallback>
            </Avatar>
            {child.givenName || "N/A"}
          </Button>
        ))}
      </div>

      {/* Selected Child Details */}
      {(children || []).map((child) => {
        if (child.id !== selectedChild) return null

        const performance = mockPerformance[child.id] || []
        const activities = mockActivities[child.id] || []
        const medicalInfo = parentingInfo?.medicalInfo?.[`${child.givenName || "N/A"} ${child.surname || ""}`]

        return (
          <div key={child.id} className="space-y-6">
            {/* Child Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={child.profilePhotoUrl || undefined} />
                    <AvatarFallback>{child.givenName?.[0] || "?"}{child.surname || ""[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{child.givenName || "N/A"} {child.surname || ""}</h3>
                        <p className="text-muted-foreground">
                          Student ID: {child.studentId} • Grade {child.grade}, Section {child.section}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="secondary">{child.enrollmentStatus}</Badge>
                          <Badge variant="outline">{child.academicStatus}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Age: {child.birthDate ? new Date().getFullYear() - new Date(child.birthDate).getFullYear() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">
                        View Full Profile
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Current GPA</p>
                        <p className="text-xl font-bold">{child.currentGPA}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className="text-xl font-bold">{child.attendanceRate}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Assignments Due</p>
                        <p className="text-xl font-bold">{child.upcomingAssignments}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Rank in Class</p>
                        <p className="text-xl font-bold">#5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                {/* Academic Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Academic Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performance.map((subject) => (
                      <div key={subject.subject} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{subject.subject}</h4>
                              <Badge variant="secondary">{subject.currentGrade}</Badge>
                              {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {subject.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Previous Grade</p>
                                <p className="font-medium">{subject.previousGrade}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Average Score</p>
                                <p className="font-medium">{subject.average}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Assignments</p>
                                <p className="font-medium">{subject.completed}/{subject.assignments}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Completion</p>
                                <Progress value={(subject.completed / subject.assignments) * 100} className="h-2 mt-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                      Performance chart visualization would go here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                {/* Upcoming Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Upcoming Activities & Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activities
                      .filter(a => a.date.getTime() > Date.now())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={cn("p-2 rounded-lg bg-background", getImportanceColor(activity.importance))}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(activity.date, { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant={activity.importance === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {activity.importance}
                          </Badge>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activities
                      .filter(a => a.type === 'achievement')
                      .map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(achievement.date, 'MMM dd')}
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                {/* Weekly Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                        <div key={day} className="space-y-2">
                          <p className="font-medium text-center p-2 bg-muted rounded">{day}</p>
                          <div className="space-y-1">
                            <div className="p-2 bg-blue-500/10 rounded text-xs">Math</div>
                            <div className="p-2 bg-green-500/10 rounded text-xs">Science</div>
                            <div className="p-2 bg-purple-500/10 rounded text-xs">English</div>
                            <div className="p-2 bg-orange-500/10 rounded text-xs">History</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                {/* Medical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {medicalInfo && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Allergies</p>
                          {medicalInfo.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {medicalInfo.allergies.map((allergy: any, idx: number) => (
                                <Badge key={idx} variant="destructive">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None reported</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Medical Conditions</p>
                          {medicalInfo.conditions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {medicalInfo.conditions.map((condition: any, idx: number) => (
                                <Badge key={idx} variant="outline">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None reported</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Medications</p>
                          {medicalInfo.medications.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {medicalInfo.medications.map((medication: any, idx: number) => (
                                <Badge key={idx} variant="secondary">
                                  {medication}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">None reported</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-sm font-medium">Primary Doctor</p>
                            <p className="text-sm text-muted-foreground">{medicalInfo.doctorName}</p>
                            <p className="text-sm text-muted-foreground">{medicalInfo.doctorPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Emergency Contact</p>
                            <p className="text-sm text-muted-foreground">School Nurse</p>
                            <p className="text-sm text-muted-foreground">+1 234 567 8999</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )
      })}
    </div>
  )
}