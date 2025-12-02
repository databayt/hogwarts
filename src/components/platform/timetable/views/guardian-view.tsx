'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Calendar, Users, TriangleAlert, ChevronRight, User } from "lucide-react"
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { getGuardianChildren, getChildTimetable } from '../actions'
import SimpleGrid from './simple-grid'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
  termId: string
  termInfo: {
    id: string
    termNumber: number
    yearName: string
    label: string
  }
  workingDays: number[]
  periods: Array<{
    id: string
    name: string
    order: number
    startTime: Date
    endTime: Date
    isBreak: boolean
  }>
  lunchAfterPeriod: number | null
  isLoading?: boolean
  childrenIds?: string[]
}

interface Child {
  id: string
  name: string
  photoUrl: string | null
  classId: string | undefined
  className: string | undefined
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function GuardianView({
  dictionary,
  lang,
  termId,
  termInfo,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === 'ar'

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Children data
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  // Selected child's timetable
  const [slots, setSlots] = useState<any[]>([])
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [classInfo, setClassInfo] = useState<any>(null)

  // View state
  const [viewTab, setViewTab] = useState<'today' | 'week'>('today')
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const currentDay = new Date().getDay()

  // Load children on mount
  useEffect(() => {
    loadChildren()
  }, [])

  // Load timetable when child selection changes
  useEffect(() => {
    if (selectedChild) {
      loadChildTimetable()
    }
  }, [selectedChild, termId])

  const loadChildren = async () => {
    setIsLoadingChildren(true)
    try {
      const result = await getGuardianChildren()
      setChildren(result.children)

      // Auto-select first child
      if (result.children.length > 0) {
        setSelectedChild(result.children[0].id)
      } else {
        setError('No children linked to your guardian account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load children')
    } finally {
      setIsLoadingChildren(false)
    }
  }

  const loadChildTimetable = async () => {
    if (!selectedChild) return

    setIsLoadingData(true)
    setError(null)

    try {
      const result = await getChildTimetable({ termId, childId: selectedChild })
      setSlots(result.slots)
      setStudentInfo(result.studentInfo)
      setClassInfo((result as { classInfo?: any }).classInfo || null)

      // Build today's schedule from slots
      const todaySlots = result.slots
        .filter((s: any) => s.dayOfWeek === currentDay)
        .map((s: any) => ({
          ...s,
          startTime: result.periods.find((p: any) => p.id === s.periodId)?.startTime,
          endTime: result.periods.find((p: any) => p.id === s.periodId)?.endTime
        }))
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

      // Fill in with breaks
      const fullSchedule = result.periods.map((period: any) => {
        const slot = todaySlots.find((s: any) => s.periodId === period.id)
        if (slot) {
          return {
            ...slot,
            periodName: period.name,
            startTime: period.startTime,
            endTime: period.endTime,
            isBreak: period.isBreak
          }
        }
        return {
          periodId: period.id,
          periodName: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
          subject: period.isBreak ? period.name : '',
          teacher: '',
          room: ''
        }
      })

      setTodaySchedule(fullSchedule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable')
    } finally {
      setIsLoadingData(false)
    }
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get current/next class
  const getCurrentClass = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (const item of todaySchedule) {
      if (item.isBreak) continue
      if (!item.subject && !item.teacher) continue

      const startTime = new Date(item.startTime)
      const endTime = new Date(item.endTime)
      const startHour = startTime.getUTCHours()
      const startMinute = startTime.getUTCMinutes()
      const endHour = endTime.getUTCHours()
      const endMinute = endTime.getUTCMinutes()

      const currentTotalMinutes = currentHour * 60 + currentMinute
      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute

      if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
        return { type: 'current', item }
      }
      if (currentTotalMinutes < startTotalMinutes) {
        return { type: 'next', item }
      }
    }
    return null
  }

  const currentClassInfo = getCurrentClass()
  const selectedChildData = children.find(c => c.id === selectedChild)

  if (isLoadingChildren) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (error && children.length === 0) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Child Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {d?.title || "Child's Schedule"}
              </CardTitle>
              <CardDescription>
                View your child's class timetable
              </CardDescription>
            </div>

            <Badge variant="outline">{termInfo.label}</Badge>
          </div>
        </CardHeader>

        {/* Child Selector */}
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {children.map(child => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-2 px-4 flex items-center gap-3",
                  selectedChild === child.id && "ring-2 ring-offset-2"
                )}
                onClick={() => setSelectedChild(child.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={child.photoUrl || undefined} alt={child.name} />
                  <AvatarFallback>{getInitials(child.name)}</AvatarFallback>
                </Avatar>
                <div className="text-start">
                  <p className="font-medium">{child.name}</p>
                  {child.className && (
                    <p className="text-xs opacity-80">{child.className}</p>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Child Info */}
      {selectedChildData && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedChildData.photoUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(selectedChildData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedChildData.name}</h3>
                {selectedChildData.className && (
                  <p className="text-muted-foreground">Class: {selectedChildData.className}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current/Next Class Card */}
      {currentClassInfo && !isLoadingData && (
        <Card className={cn(
          "border-2",
          currentClassInfo.type === 'current' ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full",
                currentClassInfo.type === 'current' ? "bg-green-500" : "bg-blue-500"
              )}>
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {currentClassInfo.type === 'current'
                    ? `${selectedChildData?.name} is in`
                    : `${selectedChildData?.name}'s next class`}
                </p>
                <p className="text-lg font-semibold">
                  {currentClassInfo.item.subject || currentClassInfo.item.periodName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentClassInfo.item.teacher && `${currentClassInfo.item.teacher} • `}
                  {currentClassInfo.item.room}
                </p>
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold">
                  {formatTime(currentClassInfo.item.startTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  - {formatTime(currentClassInfo.item.endTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Tabs */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as 'today' | 'week')}>
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="h-4 w-4" />
            Today ({DAY_NAMES[currentDay]})
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <Calendar className="h-4 w-4" />
            Week View
          </TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="today" className="mt-4">
          {isLoadingData ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : todaySchedule.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    "transition-colors",
                    item.isBreak && "bg-muted/50 border-dashed",
                    currentClassInfo?.item === item && currentClassInfo?.type === 'current' && "border-green-500 bg-green-50 dark:bg-green-950/20"
                  )}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-center">
                        <p className="font-mono font-semibold">
                          {formatTime(item.startTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(item.endTime)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.isBreak ? item.periodName : (item.subject || 'Free Period')}
                        </p>
                        {!item.isBreak && item.teacher && (
                          <p className="text-sm text-muted-foreground">
                            {item.teacher} {item.room && `• ${item.room}`}
                          </p>
                        )}
                      </div>
                      {item.isBreak && (
                        <Badge variant="secondary">Break</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="mt-4">
          {isLoadingData || isLoading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <SimpleGrid
                  slots={slots}
                  workingDays={workingDays}
                  periods={periods}
                  lunchAfterPeriod={lunchAfterPeriod}
                  isRTL={isRTL}
                  viewMode="class"
                  editable={false}
                  highlightToday={true}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
