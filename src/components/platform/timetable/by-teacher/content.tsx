'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, User, MapPin, AlertTriangle, RefreshCw, Briefcase, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import {
  getTermsForSelection,
  getTeachersForSelection,
  getTimetableByTeacher
} from '../actions'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  dictionary: Dictionary['school']
}

type SlotData = {
  id: string
  dayOfWeek: number
  periodId: string
  periodName: string
  className: string
  classId: string
  room: string
  roomId: string
  subject: string
}

type TeacherTimetableData = {
  teacherInfo: { id: string; name: string; email?: string | null } | null
  workingDays: number[]
  periods: { id: string; name: string; startTime: Date; endTime: Date }[]
  slots: SlotData[]
  workload: { daysPerWeek: number; periodsPerWeek: number; classesTeaching: number }
  lunchAfterPeriod: number | null
}

export default function TimetableByTeacherContent({ dictionary }: Props) {
  const d = dictionary?.timetable

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [terms, setTerms] = useState<{ id: string; label: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')

  const [timetableData, setTimetableData] = useState<TeacherTimetableData | null>(null)

  // Load terms on mount
  useEffect(() => {
    loadTerms()
  }, [])

  // Load teachers when term changes
  useEffect(() => {
    if (selectedTerm) {
      loadTeachers(selectedTerm)
    }
  }, [selectedTerm])

  // Load timetable when teacher changes
  useEffect(() => {
    if (selectedTerm && selectedTeacher) {
      loadTimetable()
    }
  }, [selectedTerm, selectedTeacher])

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

  const loadTeachers = async (termId: string) => {
    try {
      const { teachers: fetchedTeachers } = await getTeachersForSelection({ termId })
      setTeachers(fetchedTeachers)
      setSelectedTeacher('')
      setTimetableData(null)
    } catch {
      setError('Failed to load teachers')
    }
  }

  const loadTimetable = async () => {
    startTransition(async () => {
      setError(null)
      try {
        const data = await getTimetableByTeacher({
          termId: selectedTerm,
          teacherId: selectedTeacher,
          weekOffset: 0
        })
        setTimetableData(data as TeacherTimetableData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timetable')
      }
    })
  }

  const getSlot = (dayOfWeek: number, periodId: string): SlotData | undefined => {
    return timetableData?.slots.find(s => s.dayOfWeek === dayOfWeek && s.periodId === periodId)
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
  }

  // Filter to teaching periods only
  const teachingPeriods = timetableData?.periods.filter(
    p => !p.name.toLowerCase().includes('break') && !p.name.toLowerCase().includes('lunch')
  ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {d?.byTeacher?.title || 'Timetable by Teacher'}
          </CardTitle>
          <CardDescription>
            {d?.byTeacher?.description || 'View individual teacher schedules and workload'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedTerm}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select teacher" />
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

            {selectedTeacher && (
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={loadTimetable} disabled={isPending}>
                  <RefreshCw className={cn("h-4 w-4 me-2", isPending && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Teacher Info & Workload */}
          {timetableData?.teacherInfo && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">{timetableData.teacherInfo.name}</h3>
                  {timetableData.teacherInfo.email && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {timetableData.teacherInfo.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                <Briefcase className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">Workload Summary</h4>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{timetableData.workload.periodsPerWeek} periods/week</span>
                    <span>{timetableData.workload.daysPerWeek} days</span>
                    <span>{timetableData.workload.classesTeaching} classes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          )}

          {/* Timetable Grid */}
          {!isPending && timetableData && teachingPeriods.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-3 text-start border-e">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Period</span>
                      </div>
                    </th>
                    {timetableData.workingDays.map(day => (
                      <th key={day} className="p-3 text-center min-w-[140px]">
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachingPeriods.map(period => (
                    <tr key={period.id} className="border-t">
                      <td className="p-3 bg-muted/50 border-e">
                        <div className="font-medium">{period.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(period.startTime)} - {formatTime(period.endTime)}
                        </div>
                      </td>
                      {timetableData.workingDays.map(day => {
                        const slot = getSlot(day, period.id)
                        return (
                          <td key={`${day}-${period.id}`} className="p-2 border-e">
                            {slot ? (
                              <div className="p-2 bg-primary/10 rounded-md space-y-1">
                                <div className="font-medium text-sm">{slot.className}</div>
                                <div className="text-xs text-muted-foreground">{slot.subject}</div>
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 me-1" />
                                  {slot.room}
                                </Badge>
                              </div>
                            ) : (
                              <div className="p-2 text-center text-muted-foreground text-sm italic">
                                Free
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isPending && selectedTeacher && (!timetableData || timetableData.slots.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled classes for this teacher</p>
            </div>
          )}

          {/* No Selection */}
          {!selectedTeacher && !isPending && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a teacher to view their schedule</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
