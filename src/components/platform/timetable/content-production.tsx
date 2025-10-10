'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { auth } from '@/auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Plus,
  Settings,
  BarChart3,
  Grid3x3,
  Users,
  AlertTriangle,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Eye,
  Edit,
  FileSpreadsheet,
  HelpCircle,
  CheckCircle
} from 'lucide-react'

// Import all our components
import { TimetableGridEnhanced } from './timetable-grid-enhanced'
import { SlotEditorDialog } from './slot-editor-dialog'
import { ImportExportDialog } from './import-export'
import { AnalyticsReports } from './analytics-reports'
import { ConfigDialog } from './config-dialog'
import { ConflictsDrawer } from './conflicts-drawer'

// Import types and utilities
import {
  TimetableSlot,
  Period,
  TeacherInfo,
  SubjectInfo,
  ClassroomInfo,
  ClassInfo,
  TimetableSettings,
  DragDropEvent,
  FilterOptions,
  TimetableNotification,
  AccessLevel
} from './types'
import {
  detectConflicts,
  validateSlotPlacement,
  calculateTeacherWorkload,
  findAvailableSlots,
  getDayName
} from './utils'
import { DEFAULT_SETTINGS, VIEW_MODES, QUICK_ACTIONS } from "./config"

import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimetableContentProps {
  dictionary?: Dictionary['school']
}

export function TimetableContent({ dictionary }: TimetableContentProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const dict = (dictionary?.timetable || {}) as any

  // Core state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timetable data
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [teachers, setTeachers] = useState<TeacherInfo[]>([])
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [settings, setSettings] = useState<TimetableSettings>(DEFAULT_SETTINGS as any)

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid')
  const [viewType, setViewType] = useState<'class' | 'teacher' | 'room' | 'student'>('class')
  const [selectedViewId, setSelectedViewId] = useState<string>('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showSlotEditor, setShowSlotEditor] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [notifications, setNotifications] = useState<TimetableNotification[]>([])
  const [filters, setFilters] = useState<FilterOptions>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Access control
  const [accessLevel, setAccessLevel] = useState<AccessLevel>({
    role: 'teacher',
    permissions: {
      view: true,
      edit: false,
      delete: false,
      export: true,
      import: false,
      manageSubstitutes: false,
      viewAnalytics: false,
      receiveNotifications: true
    }
  })

  // Determine user permissions based on session
  useEffect(() => {
    if (session?.user) {
      const role = session.user.role || 'teacher'
      let permissions = {
        view: true,
        edit: false,
        delete: false,
        export: true,
        import: false,
        manageSubstitutes: false,
        viewAnalytics: false,
        receiveNotifications: true
      }

      switch (role) {
        case 'PLATFORM_ADMIN':
        case 'ADMIN':
        case 'PRINCIPAL':
          permissions = {
            view: true,
            edit: true,
            delete: true,
            export: true,
            import: true,
            manageSubstitutes: true,
            viewAnalytics: true,
            receiveNotifications: true
          }
          break
        case 'TEACHER':
          permissions = {
            view: true,
            edit: false,
            delete: false,
            export: true,
            import: false,
            manageSubstitutes: false,
            viewAnalytics: false,
            receiveNotifications: true
          }
          break
        case 'STUDENT':
        case 'PARENT':
          permissions = {
            view: true,
            edit: false,
            delete: false,
            export: true,
            import: false,
            manageSubstitutes: false,
            viewAnalytics: false,
            receiveNotifications: true
          }
          break
      }

      setAccessLevel({ role: role as any, permissions })
    }
  }, [session])

  // Load initial data
  useEffect(() => {
    loadTimetableData()
  }, [weekOffset, viewType, selectedViewId])

  const loadTimetableData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load all necessary data
      const [
        slotsRes,
        periodsRes,
        teachersRes,
        subjectsRes,
        classroomsRes,
        classesRes,
        settingsRes
      ] = await Promise.all([
        fetch(`/api/timetable?weekOffset=${weekOffset}&viewType=${viewType}&viewId=${selectedViewId}`),
        fetch('/api/periods'),
        fetch('/api/teachers'),
        fetch('/api/subjects'),
        fetch('/api/classrooms'),
        fetch('/api/classes'),
        fetch('/api/timetable/settings')
      ])

      if (!slotsRes.ok) throw new Error('Failed to load timetable')

      const [
        slotsData,
        periodsData,
        teachersData,
        subjectsData,
        classroomsData,
        classesData,
        settingsData
      ] = await Promise.all([
        slotsRes.json(),
        periodsRes.json(),
        teachersRes.json(),
        subjectsRes.json(),
        classroomsRes.json(),
        classesRes.json(),
        settingsRes.json()
      ])

      setSlots(slotsData.slots || [])
      setPeriods(periodsData.periods || [])
      setTeachers(teachersData.teachers || [])
      setSubjects(subjectsData.subjects || [])
      setClassrooms(classroomsData.classrooms || [])
      setClasses(classesData.classes || [])
      setSettings(settingsData.settings || DEFAULT_SETTINGS as any)

      // Set default view ID if not set
      if (!selectedViewId) {
        if (viewType === 'class' && classesData.classes?.length > 0) {
          setSelectedViewId(classesData.classes[0].id)
        } else if (viewType === 'teacher' && teachersData.teachers?.length > 0) {
          setSelectedViewId(teachersData.teachers[0].id)
        } else if (viewType === 'room' && classroomsData.classrooms?.length > 0) {
          setSelectedViewId(classroomsData.classrooms[0].id)
        }
      }

      // Check for conflicts
      const conflicts = detectConflicts(slotsData.slots || [])
      if (conflicts.length > 0 && accessLevel.permissions.edit) {
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'conflict',
          recipients: [],
          title: dict.conflictsDetected || 'Conflicts Detected',
          message: `${conflicts.length} ${dict.conflictsFound || 'scheduling conflicts found'}`,
          readBy: []
        }])
      }
    } catch (err) {
      console.error('Failed to load timetable:', err)
      setError(err instanceof Error ? err.message : 'Failed to load timetable')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle slot operations
  const handleSlotSave = async (slotData: Partial<TimetableSlot>) => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/timetable/slot', {
        method: slotData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData)
      })

      if (!response.ok) throw new Error('Failed to save slot')

      await loadTimetableData()

      toast({
        title: dict.slotSaved || 'Slot Saved',
        description: dict.slotSavedDesc || 'Timetable slot has been saved successfully'
      })

      setShowSlotEditor(false)
      setSelectedSlot(null)
    } catch (err) {
      toast({
        title: dict.saveFailed || 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save slot'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSlotDelete = async (slotId: string) => {
    if (!accessLevel.permissions.delete) return

    try {
      const response = await fetch(`/api/timetable/slot/${slotId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete slot')

      await loadTimetableData()

      toast({
        title: dict.slotDeleted || 'Slot Deleted',
        description: dict.slotDeletedDesc || 'Timetable slot has been deleted'
      })
    } catch (err) {
      toast({
        title: dict.deleteFailed || 'Delete Failed',
        description: err instanceof Error ? err.message : 'Failed to delete slot',
      })
    }
  }

  const handleSlotMove = async (event: DragDropEvent) => {
    if (!accessLevel.permissions.edit) return

    const updatedSlot = {
      ...event.source.slot,
      dayOfWeek: event.target.position.day,
      periodId: event.target.position.period.toString()
    }

    // Validate placement
    const validation = validateSlotPlacement(
      updatedSlot,
      slots.filter(s => s.id !== event.source.slot.id)
    )

    if (!validation.valid) {
      toast({
        title: dict.invalidPlacement || 'Invalid Placement',
        description: validation.errors.join(', '),
      })
      return
    }

    await handleSlotSave(updatedSlot)
  }

  const handleImport = async (importData: Partial<TimetableSlot>[]) => {
    if (!accessLevel.permissions.import) return

    try {
      const response = await fetch('/api/timetable/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: importData })
      })

      if (!response.ok) throw new Error('Failed to import timetable')

      await loadTimetableData()

      toast({
        title: dict.importSuccess || 'Import Successful',
        description: `${importData.length} ${dict.slotsImported || 'slots imported'}`
      })
    } catch (err) {
      toast({
        title: dict.importFailed || 'Import Failed',
        description: err instanceof Error ? err.message : 'Failed to import timetable',
      })
    }
  }

  const handleRefresh = () => {
    loadTimetableData()
    toast({
      title: dict.refreshed || 'Refreshed',
      description: dict.timetableUpdated || 'Timetable has been updated'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Filter slots based on search and filters
  const filteredSlots = slots.filter(slot => {
    if (searchQuery) {
      const subject = subjects.find(s => s.id === slot.subjectId)
      const teacher = teachers.find(t => t.id === slot.teacherId)
      const searchLower = searchQuery.toLowerCase()

      if (
        !subject?.name.toLowerCase().includes(searchLower) &&
        !teacher?.firstName.toLowerCase().includes(searchLower) &&
        !teacher?.lastName.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }

    if (filters.subjects?.length && !filters.subjects.includes(slot.subjectId || '')) {
      return false
    }

    if (filters.teachers?.length && !filters.teachers.includes(slot.teacherId || '')) {
      return false
    }

    if (filters.days?.length && !filters.days.includes(slot.dayOfWeek)) {
      return false
    }

    return true
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          {dict.retry || 'Retry'}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-foreground">{dict.title || 'Timetable'}</h2>
          <p className="muted">
            {dict.subtitle || 'Manage class schedules and assignments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {accessLevel.permissions.edit && (
            <Button
              onClick={() => {
                setSelectedSlot(null)
                setShowSlotEditor(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {dict.addSlot || 'Add Slot'}
            </Button>
          )}

          <ImportExportDialog
            slots={filteredSlots}
            periods={periods}
            workingDays={settings.workingDays}
            teachers={teachers}
            subjects={subjects}
            classrooms={classrooms}
            classes={classes}
            onImport={handleImport}
            dictionary={dict}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowConfigDialog(true)}>
                <Settings className="mr-2 h-4 w-4" />
                {dict.settings || 'Settings'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                {dict.print || 'Print'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {dict.refresh || 'Refresh'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                {dict.help || 'Help'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Alert key={notification.id} variant={notification.type === 'conflict' ? 'destructive' : 'default'}>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                <strong>{notification.title}:</strong> {notification.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* View Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={viewType} onValueChange={(value) => setViewType(value as 'class' | 'teacher' | 'room' | 'student')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <span className="mr-2">{mode.icon}</span>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedViewId} onValueChange={setSelectedViewId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={dict.selectView || 'Select view'} />
                </SelectTrigger>
                <SelectContent>
                  {viewType === 'class' && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                  {viewType === 'teacher' && teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                  {viewType === 'room' && classrooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(weekOffset - 1)}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary">
                {weekOffset === 0 ? dict.currentWeek || 'Current Week' : `${dict.week || 'Week'} +${weekOffset}`}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(weekOffset + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {detectConflicts(filteredSlots).length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConflicts(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {detectConflicts(filteredSlots).length} {dict.conflicts || 'Conflicts'}
                </Button>
              )}

              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'analytics')}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    {dict.grid || 'Grid'}
                  </TabsTrigger>
                  {accessLevel.permissions.viewAnalytics && (
                    <TabsTrigger value="analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {dict.analytics || 'Analytics'}
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'grid' ? (
        <div id="timetable-grid">
          <TimetableGridEnhanced
            slots={filteredSlots}
            periods={periods}
            workingDays={settings.workingDays}
            teachers={teachers}
            subjects={subjects}
            classrooms={classrooms}
            viewType={viewType}
            viewId={selectedViewId}
            editable={accessLevel.permissions.edit}
            showConflicts={true}
            colorScheme={settings.colorScheme}
            onSlotClick={setSelectedSlot}
            onSlotEdit={(slot) => {
              setSelectedSlot(slot)
              setShowSlotEditor(true)
            }}
            onSlotDelete={handleSlotDelete}
            onSlotMove={handleSlotMove}
            onEmptyCellClick={(day, periodId) => {
              if (accessLevel.permissions.edit) {
                setSelectedSlot({
                  dayOfWeek: day,
                  periodId
                } as any)
                setShowSlotEditor(true)
              }
            }}
            dictionary={dict}
          />
        </div>
      ) : (
        <AnalyticsReports
          slots={filteredSlots}
          periods={periods}
          workingDays={settings.workingDays}
          teachers={teachers}
          subjects={subjects}
          classrooms={classrooms}
          dictionary={dict}
        />
      )}

      {/* Dialogs */}
      {showSlotEditor && (
        <SlotEditorDialog
          open={showSlotEditor}
          onOpenChange={setShowSlotEditor}
          slot={selectedSlot}
          initialDay={selectedSlot?.dayOfWeek}
          initialPeriod={selectedSlot?.periodId}
          periods={periods}
          teachers={teachers}
          subjects={subjects}
          classrooms={classrooms}
          classes={classes}
          existingSlots={slots}
          workingDays={settings.workingDays}
          onSave={handleSlotSave}
          dictionary={dict}
        />
      )}

      {showConfigDialog && (
        <ConfigDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          classConfig={settings as any}
          onConfigChange={(newSettings) => setSettings(newSettings as any)}
          onSave={async () => {
            try {
              const response = await fetch('/api/timetable/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              })

              if (!response.ok) throw new Error('Failed to save settings')

              toast({
                title: dict.settingsSaved || 'Settings Saved',
                description: dict.settingsSavedDesc || 'Timetable settings have been updated'
              })
              setShowConfigDialog(false)
            } catch (err) {
              toast({
                title: dict.saveFailed || 'Save Failed',
                description: err instanceof Error ? err.message : 'Failed to save settings',
                      })
            }
          }}
        />
      )}

      {showConflicts && (
        <ConflictsDrawer
          termId={null}
          open={showConflicts}
          onOpenChange={(open) => setShowConflicts(open)}
          onApplySuggestion={(suggestion) => {
            // Handle suggestion application
            console.log('Applying suggestion:', suggestion)
          }}
        />
      )}
    </div>
  )
}