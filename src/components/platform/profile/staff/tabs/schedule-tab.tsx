/**
 * Staff Profile Schedule Tab
 * Work schedule, meetings, and availability management
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Coffee,
  Briefcase,
  Home,
  CalendarCheck,
  CalendarX,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, startOfWeek, addWeeks, isSameDay, isToday } from 'date-fns'
import type { StaffProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ScheduleTabProps {
  profile: StaffProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface Meeting {
  id: string
  title: string
  type: 'team' | 'committee' | 'one-on-one' | 'department' | 'all-staff'
  date: Date
  startTime: string
  endTime: string
  location?: string
  isVirtual?: boolean
  attendees: string[]
  agenda?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  recurring?: 'daily' | 'weekly' | 'monthly'
}

interface Leave {
  id: string
  type: 'vacation' | 'sick' | 'personal' | 'conference' | 'training'
  startDate: Date
  endDate: Date
  status: 'approved' | 'pending' | 'rejected'
  reason?: string
  approvedBy?: string
}

interface TimeSlot {
  time: string
  isBreak?: boolean
  isLunch?: boolean
  activity?: string
  type?: 'work' | 'meeting' | 'break' | 'available'
}

// ============================================================================
// Mock Data
// ============================================================================

const mockMeetings: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Finance Team Weekly Sync',
    type: 'team',
    date: new Date(),
    startTime: '10:00',
    endTime: '11:00',
    location: 'Conference Room A',
    isVirtual: false,
    attendees: ['Michael Anderson', 'Sarah Wilson', 'John Davis'],
    agenda: 'Budget review, expense reports, upcoming deadlines',
    status: 'scheduled',
    recurring: 'weekly'
  },
  {
    id: 'meet-2',
    title: 'Budget Planning Committee',
    type: 'committee',
    date: addDays(new Date(), 1),
    startTime: '14:00',
    endTime: '15:30',
    isVirtual: true,
    attendees: ['Michael Anderson', 'Principal Williams', 'Department Heads'],
    agenda: 'Q2 budget allocation review',
    status: 'scheduled',
    recurring: 'monthly'
  },
  {
    id: 'meet-3',
    title: '1:1 with Manager',
    type: 'one-on-one',
    date: addDays(new Date(), 2),
    startTime: '09:00',
    endTime: '09:30',
    location: 'Manager Office',
    attendees: ['Michael Anderson', 'Principal Williams'],
    status: 'scheduled'
  },
  {
    id: 'meet-4',
    title: 'All Staff Meeting',
    type: 'all-staff',
    date: addDays(new Date(), 3),
    startTime: '15:00',
    endTime: '16:00',
    location: 'Auditorium',
    attendees: ['All Staff'],
    status: 'scheduled',
    recurring: 'monthly'
  }
]

const mockLeave: Leave[] = [
  {
    id: 'leave-1',
    type: 'vacation',
    startDate: addDays(new Date(), 30),
    endDate: addDays(new Date(), 35),
    status: 'approved',
    reason: 'Family vacation',
    approvedBy: 'Principal Williams'
  },
  {
    id: 'leave-2',
    type: 'training',
    startDate: addDays(new Date(), 60),
    endDate: addDays(new Date(), 62),
    status: 'pending',
    reason: 'Advanced Excel Training'
  }
]

// Generate weekly schedule
const generateWeekSchedule = (): { [key: string]: TimeSlot[] } => {
  const schedule: { [key: string]: TimeSlot[] } = {}
  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  workDays.forEach(day => {
    schedule[day] = [
      { time: '08:30 - 09:00', activity: 'Email & Planning', type: 'work' },
      { time: '09:00 - 10:00', activity: 'Financial Reports', type: 'work' },
      { time: '10:00 - 10:15', activity: 'Break', type: 'break', isBreak: true },
      { time: '10:15 - 12:00', activity: 'Core Work Hours', type: 'work' },
      { time: '12:00 - 13:00', activity: 'Lunch Break', type: 'break', isLunch: true },
      { time: '13:00 - 15:00', activity: 'Meetings / Admin Work', type: 'work' },
      { time: '15:00 - 15:15', activity: 'Break', type: 'break', isBreak: true },
      { time: '15:15 - 17:00', activity: 'Project Work', type: 'work' }
    ]
  })

  return schedule
}

// ============================================================================
// Component
// ============================================================================

export function ScheduleTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: ScheduleTabProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week')

  const { schedule } = profile
  const weekSchedule = generateWeekSchedule()

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  // Get meetings for selected date
  const todayMeetings = mockMeetings.filter(meeting =>
    isSameDay(meeting.date, selectedDate)
  )

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(addWeeks(currentWeek, direction === 'next' ? 1 : -1))
  }

  const getMeetingTypeColor = (type: Meeting['type']) => {
    switch (type) {
      case 'team': return 'bg-blue-500/10 text-blue-500'
      case 'committee': return 'bg-purple-500/10 text-purple-500'
      case 'one-on-one': return 'bg-green-500/10 text-green-500'
      case 'department': return 'bg-orange-500/10 text-orange-500'
      case 'all-staff': return 'bg-red-500/10 text-red-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getLeaveTypeIcon = (type: Leave['type']) => {
    switch (type) {
      case 'vacation': return <Home className="h-4 w-4" />
      case 'sick': return <AlertCircle className="h-4 w-4" />
      case 'personal': return <Users className="h-4 w-4" />
      case 'conference': return <Briefcase className="h-4 w-4" />
      case 'training': return <GraduationCap className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Work Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Work Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Working Hours</p>
              <p className="font-semibold">{schedule.workingHours}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Break Time</p>
              <p className="font-semibold">{schedule.breakTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Office Location</p>
              <p className="font-semibold">{schedule.officeLocation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold capitalize">{schedule.currentAvailability}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>

        {/* Week View */}
        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Week View
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(currentWeek, 'MMM dd')} - {format(addDays(currentWeek, 6), 'MMM dd, yyyy')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayName = format(day, 'EEE')
                  const dayDate = format(day, 'dd')
                  const dayMeetings = mockMeetings.filter(m => isSameDay(m.date, day))
                  const isWeekend = index >= 5
                  const today = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border rounded-lg p-3 min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors",
                        isWeekend && "bg-muted/30",
                        today && "border-primary",
                        isSameDay(day, selectedDate) && "bg-muted"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-xs font-medium", today && "text-primary")}>
                          {dayName}
                        </span>
                        <span className={cn(
                          "text-sm font-bold",
                          today && "bg-primary text-primary-foreground px-1.5 py-0.5 rounded"
                        )}>
                          {dayDate}
                        </span>
                      </div>

                      {isWeekend ? (
                        <p className="text-xs text-muted-foreground text-center mt-4">Weekend</p>
                      ) : (
                        <div className="space-y-1">
                          {dayMeetings.slice(0, 2).map((meeting) => (
                            <div
                              key={meeting.id}
                              className={cn(
                                "text-xs p-1 rounded truncate",
                                getMeetingTypeColor(meeting.type)
                              )}
                            >
                              {meeting.startTime} {meeting.title}
                            </div>
                          ))}
                          {dayMeetings.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayMeetings.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Day View */}
        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                </CardTitle>
                <Badge variant={isToday(selectedDate) ? 'default' : 'secondary'}>
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Daily Schedule */}
              <div className="space-y-2">
                {weekSchedule[format(selectedDate, 'EEEE')]?.map((slot, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      slot.isBreak || slot.isLunch ? "bg-muted/50" : "bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{slot.time}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      {slot.isBreak && <Coffee className="h-4 w-4 text-orange-500" />}
                      {slot.isLunch && <Coffee className="h-4 w-4 text-green-500" />}
                      {slot.type === 'work' && <Briefcase className="h-4 w-4 text-blue-500" />}
                      <span className={cn(
                        "text-sm",
                        (slot.isBreak || slot.isLunch) && "text-muted-foreground"
                      )}>
                        {slot.activity}
                      </span>
                    </div>
                    {slot.type === 'work' && (
                      <Badge variant="outline" className="text-xs">
                        {slot.type}
                      </Badge>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    No schedule for this day
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Month Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Month view calendar would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Upcoming Meetings
              </span>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                Schedule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMeetings.slice(0, 4).map((meeting) => (
              <div key={meeting.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={cn("text-xs", getMeetingTypeColor(meeting.type))}>
                        {meeting.type}
                      </Badge>
                      {meeting.recurring && (
                        <Badge variant="outline" className="text-xs">
                          {meeting.recurring}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {meeting.isVirtual ? (
                    <Video className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{format(meeting.date, 'MMM dd, yyyy')}</span>
                    <span>•</span>
                    <span>{meeting.startTime} - {meeting.endTime}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{meeting.attendees.length} attendees</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave & Time Off */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarX className="h-4 w-4" />
                Leave & Time Off
              </span>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                Request
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Leave Balance */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Annual Leave</p>
                <p className="text-lg font-bold">12 days</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Sick Leave</p>
                <p className="text-lg font-bold">5 days</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>

            {/* Upcoming Leave */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Scheduled Leave</p>
              {mockLeave.map((leave) => (
                <div key={leave.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "p-1.5 rounded",
                        leave.type === 'vacation' && "bg-blue-500/10 text-blue-500",
                        leave.type === 'training' && "bg-purple-500/10 text-purple-500"
                      )}>
                        {getLeaveTypeIcon(leave.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm capitalize">{leave.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(leave.startDate, 'MMM dd')} - {format(leave.endDate, 'MMM dd, yyyy')}
                        </p>
                        {leave.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        leave.status === 'approved' ? 'default' :
                        leave.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {leave.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Missing import
import { GraduationCap } from 'lucide-react'