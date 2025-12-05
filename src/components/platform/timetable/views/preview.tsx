'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap } from 'lucide-react'
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

export default function TimetablePreview({ dictionary, lang }: Props) {
  const isRTL = lang === 'ar'

  const [isTeacherView, setIsTeacherView] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Data
  const [termId, setTermId] = useState<string | null>(null)
  const [periods, setPeriods] = useState<any[]>([])
  const [workingDays] = useState<number[]>([0, 1, 2, 3, 4])

  // Random selections
  const [randomTeacher, setRandomTeacher] = useState<{ id: string; label: string } | null>(null)
  const [randomClass, setRandomClass] = useState<{ id: string; label: string } | null>(null)

  // Timetable data
  const [teacherSlots, setTeacherSlots] = useState<any[]>([])
  const [classSlots, setClassSlots] = useState<any[]>([])
  const [teacherWorkload, setTeacherWorkload] = useState<any>(null)

  // Load everything on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Get active term
      const { term } = await getActiveTerm()
      if (!term) {
        setIsLoading(false)
        return
      }
      setTermId(term.id)

      // Get random teacher and class
      const [teachersResult, classesResult] = await Promise.all([
        getTeachersForSelection({ termId: term.id }),
        getClassesForSelection({ termId: term.id })
      ])

      // Pick random ones
      const teachers = teachersResult.teachers
      const classes = classesResult.classes

      let loadedPeriods: any[] = []

      if (teachers.length > 0) {
        const randomT = teachers[Math.floor(Math.random() * teachers.length)]
        setRandomTeacher(randomT)

        // Load teacher timetable
        const teacherData = await getTimetableByTeacher({ termId: term.id, teacherId: randomT.id })
        setTeacherSlots(teacherData.slots)
        setTeacherWorkload(teacherData.workload)
        loadedPeriods = teacherData.periods
        setPeriods(teacherData.periods)
      }

      if (classes.length > 0) {
        const randomC = classes[Math.floor(Math.random() * classes.length)]
        setRandomClass(randomC)

        // Load class timetable
        const classData = await getTimetableByClass({ termId: term.id, classId: randomC.id })
        setClassSlots(classData.slots)
        if (!loadedPeriods.length) setPeriods(classData.periods)
      }
    } catch (err) {
      console.error('Failed to load preview data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!termId) {
    return (
      <Card className="rounded-xl shadow-lg">
        <CardContent className="py-12 text-center text-muted-foreground">
          No term configured. Create a term first.
        </CardContent>
      </Card>
    )
  }

  const currentSlots = isTeacherView ? teacherSlots : classSlots
  const currentEntity = isTeacherView ? randomTeacher : randomClass

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="rounded-xl shadow-lg border-border">
        <CardContent className="py-5 px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                {isTeacherView ? (
                  <Users className="h-5 w-5 text-primary" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {isTeacherView ? 'Teacher View' : 'Student View'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentEntity?.label || 'No data available'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="view-toggle" className="text-sm text-muted-foreground">
                Student
              </Label>
              <Switch
                id="view-toggle"
                checked={isTeacherView}
                onCheckedChange={setIsTeacherView}
              />
              <Label htmlFor="view-toggle" className="text-sm text-muted-foreground">
                Teacher
              </Label>
            </div>
          </div>

          {/* Workload badges for teacher view */}
          {isTeacherView && teacherWorkload && (
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="px-3 py-1">
                {teacherWorkload.periodsPerWeek} periods/week
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {teacherWorkload.classesTeaching} classes
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {currentSlots.length > 0 && periods.length > 0 ? (
        <SimpleGrid
          slots={currentSlots}
          workingDays={workingDays}
          periods={periods}
          lunchAfterPeriod={4}
          isRTL={isRTL}
          viewMode={isTeacherView ? 'teacher' : 'class'}
          editable={false}
          highlightToday={true}
        />
      ) : (
        <Card className="rounded-xl shadow-lg border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No timetable data available
          </CardContent>
        </Card>
      )}

      {/* Footer info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Timetable Preview</p>
      </div>
    </div>
  )
}
