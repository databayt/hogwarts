'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  GraduationCap,
  Calendar,
  TriangleAlert,
  RefreshCw,
  Eye
} from 'lucide-react'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import {
  getActiveTerm,
  getClassesForSelection,
  getTeachersForSelection,
  getTimetableByClass,
  getTimetableByTeacher
} from '../actions'
import SimpleGrid from './simple-grid'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

type PreviewMode = 'teacher' | 'student'

interface SelectionOption {
  id: string
  label: string
}

interface TimetableData {
  slots: any[]
  info: any
  workload?: any
}

export default function TimetablePreview({ dictionary, lang }: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === 'ar'

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Term data
  const [termId, setTermId] = useState<string | null>(null)
  const [termInfo, setTermInfo] = useState<{
    id: string
    termNumber: number
    yearName: string
    label: string
  } | null>(null)
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [periods, setPeriods] = useState<any[]>([])
  const [lunchAfterPeriod, setLunchAfterPeriod] = useState<number | null>(null)

  // Preview mode
  const [previewMode, setPreviewMode] = useState<PreviewMode>('student')

  // Selection options
  const [teachers, setTeachers] = useState<SelectionOption[]>([])
  const [classes, setClasses] = useState<SelectionOption[]>([])

  // Selected items
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Timetable data
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null)

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load timetable when selection changes
  useEffect(() => {
    if (termId) {
      if (previewMode === 'teacher' && selectedTeacherId) {
        loadTeacherTimetable()
      } else if (previewMode === 'student' && selectedClassId) {
        loadClassTimetable()
      }
    }
  }, [termId, previewMode, selectedTeacherId, selectedClassId])

  const loadInitialData = async () => {
    startTransition(async () => {
      setError(null)
      try {
        // Get active term
        const { term } = await getActiveTerm()

        if (!term) {
          setError('No term found. Please create a term in Settings first.')
          return
        }

        setTermId(term.id)
        setTermInfo({
          id: term.id,
          termNumber: term.termNumber,
          yearName: term.label || '',
          label: term.label || `Term ${term.termNumber}`
        })

        // Get working days and periods from term/config
        // These would come from the school config
        setWorkingDays([0, 1, 2, 3, 4]) // Sun-Thu default
        setLunchAfterPeriod(4)

        // Load teachers and classes
        const [teachersResult, classesResult] = await Promise.all([
          getTeachersForSelection({ termId: term.id }),
          getClassesForSelection({ termId: term.id })
        ])

        setTeachers(teachersResult.teachers)
        setClasses(classesResult.classes)

        // Auto-select first item
        if (classesResult.classes.length > 0) {
          setSelectedClassId(classesResult.classes[0].id)
        }
        if (teachersResult.teachers.length > 0) {
          setSelectedTeacherId(teachersResult.teachers[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    })
  }

  const loadTeacherTimetable = async () => {
    if (!termId || !selectedTeacherId) return

    startTransition(async () => {
      try {
        const result = await getTimetableByTeacher({ termId, teacherId: selectedTeacherId })
        setTimetableData({
          slots: result.slots,
          info: result.teacherInfo,
          workload: result.workload
        })
        setPeriods(result.periods)
      } catch (err) {
        console.error('Failed to load teacher timetable:', err)
      }
    })
  }

  const loadClassTimetable = async () => {
    if (!termId || !selectedClassId) return

    startTransition(async () => {
      try {
        const result = await getTimetableByClass({ termId, classId: selectedClassId })
        setTimetableData({
          slots: result.slots,
          info: result.classInfo
        })
        setPeriods(result.periods)
      } catch (err) {
        console.error('Failed to load class timetable:', err)
      }
    })
  }

  const handleModeChange = (mode: PreviewMode) => {
    setPreviewMode(mode)
    setTimetableData(null)
  }

  // Loading state
  if (isPending && !termId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Timetable Preview
              </CardTitle>
              <CardDescription>
                Preview timetables as different users would see them
              </CardDescription>
            </div>
            {termInfo && (
              <Badge variant="outline">{termInfo.label}</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* View Mode Tabs */}
          <Tabs value={previewMode} onValueChange={(v) => handleModeChange(v as PreviewMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Student View
              </TabsTrigger>
              <TabsTrigger value="teacher" className="gap-2">
                <Users className="h-4 w-4" />
                Teacher View
              </TabsTrigger>
            </TabsList>

            {/* Student View Selector */}
            <TabsContent value="student" className="mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Select Class to Preview
                  </label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadClassTimetable}
                  disabled={!selectedClassId || isPending}
                >
                  <RefreshCw className={isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                </Button>
              </div>

              {classes.length === 0 && !isPending && (
                <Alert className="mt-4">
                  <AlertDescription>
                    No classes found. Create classes and assign them to a term first.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Teacher View Selector */}
            <TabsContent value="teacher" className="mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Select Teacher to Preview
                  </label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a teacher..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadTeacherTimetable}
                  disabled={!selectedTeacherId || isPending}
                >
                  <RefreshCw className={isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                </Button>
              </div>

              {teachers.length === 0 && !isPending && (
                <Alert className="mt-4">
                  <AlertDescription>
                    No teachers found. Add teachers to your school first.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Entity Info Card */}
      {timetableData?.info && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {previewMode === 'student' ? (
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Users className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {previewMode === 'student' ? 'Class' : 'Teacher'}
                  </p>
                  <p className="font-semibold">
                    {timetableData.info.name || timetableData.info.label}
                  </p>
                </div>
              </div>

              {/* Workload stats for teacher */}
              {previewMode === 'teacher' && timetableData.workload && (
                <>
                  <Badge variant="secondary">
                    {timetableData.workload.periodsPerWeek} periods/week
                  </Badge>
                  <Badge variant="outline">
                    {timetableData.workload.classesTeaching} classes
                  </Badge>
                </>
              )}

              {/* Class count for student view */}
              {previewMode === 'student' && (
                <Badge variant="secondary">
                  {timetableData.slots.length} scheduled slots
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Grid */}
      {isPending ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : timetableData && periods.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            <SimpleGrid
              slots={timetableData.slots}
              workingDays={workingDays}
              periods={periods}
              lunchAfterPeriod={lunchAfterPeriod}
              isRTL={isRTL}
              viewMode={previewMode === 'student' ? 'class' : 'teacher'}
              editable={false}
              highlightToday={true}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {previewMode === 'student'
                ? 'Select a class to preview their timetable'
                : 'Select a teacher to preview their timetable'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
