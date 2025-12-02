'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Users, DoorOpen, Settings, TriangleAlert, FileText, RefreshCw } from "lucide-react"
import { cn } from '@/lib/utils'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import {
  getTermsForSelection,
  getTimetableByClass,
  getTimetableByTeacher,
  getTimetableByRoom,
  getClassesForSelection,
  getTeachersForSelection,
  getRoomsForSelection,
  detectTimetableConflicts
} from '../actions'
import SimpleGrid from './simple-grid'
import { ConflictsDrawer } from '../conflicts-drawer'

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
  onTermChange: (termId: string) => void
}

type ViewMode = 'class' | 'teacher' | 'room'

export default function AdminView({
  dictionary,
  lang,
  termId,
  termInfo,
  workingDays,
  periods,
  lunchAfterPeriod,
  isLoading,
  onTermChange
}: Props) {
  const d = dictionary?.timetable
  const isRTL = lang === 'ar'

  const [viewMode, setViewMode] = useState<ViewMode>('class')
  const [selectedId, setSelectedId] = useState<string>('')

  // Data lists for selectors
  const [terms, setTerms] = useState<Array<{ id: string; label: string }>>([])
  const [classes, setClasses] = useState<Array<{ id: string; label: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; label: string }>>([])
  const [rooms, setRooms] = useState<Array<{ id: string; label: string; capacity: number }>>([])

  // Timetable data
  const [slots, setSlots] = useState<any[]>([])
  const [entityInfo, setEntityInfo] = useState<any>(null)

  // Conflicts
  const [conflicts, setConflicts] = useState<any[]>([])
  const [showConflicts, setShowConflicts] = useState(false)

  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load initial selectors
  useEffect(() => {
    loadSelectors()
  }, [])

  // Reload entity list when term changes
  useEffect(() => {
    loadEntityList()
  }, [termId, viewMode])

  // Load timetable when selection changes
  useEffect(() => {
    if (selectedId) {
      loadTimetable()
    }
  }, [selectedId, termId])

  const loadSelectors = async () => {
    const [termsResult, roomsResult] = await Promise.all([
      getTermsForSelection(),
      getRoomsForSelection()
    ])
    setTerms(termsResult.terms)
    setRooms(roomsResult.rooms)
  }

  const loadEntityList = async () => {
    if (viewMode === 'class') {
      const result = await getClassesForSelection({ termId })
      setClasses(result.classes)
      if (result.classes.length > 0 && !selectedId) {
        setSelectedId(result.classes[0].id)
      }
    } else if (viewMode === 'teacher') {
      const result = await getTeachersForSelection({ termId })
      setTeachers(result.teachers)
      if (result.teachers.length > 0 && !selectedId) {
        setSelectedId(result.teachers[0].id)
      }
    }
  }

  const loadTimetable = async () => {
    setIsLoadingData(true)
    try {
      let result: any
      if (viewMode === 'class') {
        result = await getTimetableByClass({ termId, classId: selectedId })
        setEntityInfo(result.classInfo)
      } else if (viewMode === 'teacher') {
        result = await getTimetableByTeacher({ termId, teacherId: selectedId })
        setEntityInfo(result.teacherInfo)
      } else if (viewMode === 'room') {
        result = await getTimetableByRoom({ termId, roomId: selectedId })
        setEntityInfo(result.roomInfo)
      }
      setSlots(result?.slots || [])
    } finally {
      setIsLoadingData(false)
    }
  }

  const checkConflicts = async () => {
    const result = await detectTimetableConflicts({ termId })
    setConflicts(result.conflicts)
    setShowConflicts(true)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setSelectedId('') // Reset selection
    setSlots([])
    setEntityInfo(null)
  }

  const getEntityList = () => {
    switch (viewMode) {
      case 'class':
        return classes
      case 'teacher':
        return teachers
      case 'room':
        return rooms.map(r => ({ id: r.id, label: `${r.label} (${r.capacity})` }))
      default:
        return []
    }
  }

  const getViewIcon = () => {
    switch (viewMode) {
      case 'class':
        return <Calendar className="h-4 w-4" />
      case 'teacher':
        return <Users className="h-4 w-4" />
      case 'room':
        return <DoorOpen className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {d?.title || 'Timetable Administration'}
              </CardTitle>
              <Badge variant="outline">{termInfo.label}</Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Term Selector */}
              <Select value={termId} onValueChange={onTermChange}>
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

              {/* Conflict Check */}
              <Button variant="outline" size="sm" onClick={checkConflicts}>
                <TriangleAlert className="h-4 w-4 me-2" />
                Check Conflicts
              </Button>

              {/* Settings Link */}
              <Button variant="ghost" size="icon" asChild>
                <a href={`/${lang}/s/_/timetable/settings`}>
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="class" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {d?.navigation?.byClass || 'By Class'}
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                  <Users className="h-4 w-4" />
                  {d?.navigation?.byTeacher || 'By Teacher'}
                </TabsTrigger>
                <TabsTrigger value="room" className="gap-2">
                  <DoorOpen className="h-4 w-4" />
                  {d?.navigation?.byRoom || 'By Room'}
                </TabsTrigger>
              </TabsList>

              {/* Entity Selector */}
              <div className="flex items-center gap-2">
                {getViewIcon()}
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={`Select ${viewMode}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getEntityList().map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadTimetable}
                  disabled={!selectedId || isLoadingData}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoadingData && "animate-spin")} />
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Entity Info Card */}
      {entityInfo && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'class' && 'Class'}
                  {viewMode === 'teacher' && 'Teacher'}
                  {viewMode === 'room' && 'Room'}
                </p>
                <p className="font-semibold">
                  {entityInfo.name || entityInfo.label}
                </p>
              </div>

              {viewMode === 'teacher' && entityInfo.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{entityInfo.email}</p>
                </div>
              )}

              {viewMode === 'room' && entityInfo.capacity && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-sm">{entityInfo.capacity} students</p>
                </div>
              )}

              {/* Workload stats for teacher view */}
              {viewMode === 'teacher' && (
                <>
                  <Badge variant="secondary">
                    {slots.length} periods/week
                  </Badge>
                  <Badge variant="outline">
                    {new Set(slots.map(s => s.classId)).size} classes
                  </Badge>
                </>
              )}

              {/* Utilization for room view */}
              {viewMode === 'room' && (
                <Badge variant="secondary">
                  {slots.length} slots used
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Grid */}
      {isLoadingData || isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : selectedId ? (
        <Card>
          <CardContent className="pt-4">
            <SimpleGrid
              slots={slots}
              workingDays={workingDays}
              periods={periods}
              lunchAfterPeriod={lunchAfterPeriod}
              isRTL={isRTL}
              viewMode={viewMode}
              editable={true}
              onSlotClick={(day, periodId, slot) => {
                console.log('Slot clicked:', day, periodId, slot)
                // TODO: Open slot editor dialog
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a {viewMode} to view timetable</p>
          </CardContent>
        </Card>
      )}

      {/* Conflicts Drawer */}
      <ConflictsDrawer
        termId={termId}
        open={showConflicts}
        onOpenChange={setShowConflicts}
        onApplySuggestion={(s) => {
          console.log('Apply suggestion:', s)
          // TODO: Apply the suggestion
        }}
      />
    </div>
  )
}
