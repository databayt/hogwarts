/**
 * Teacher Profile Schedule Tab
 * Weekly schedule, timetable, and office hours
 */

"use client"

import React, { useState } from "react"
import { addDays, format, isSameDay, startOfWeek } from "date-fns"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  MapPin,
  Plus,
  Printer,
  Users,
  Video,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { TeacherProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface ScheduleTabProps {
  profile: TeacherProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface ScheduleSlot {
  id: string
  title: string
  courseCode: string
  type: "class" | "office" | "meeting" | "exam" | "event"
  startTime: string
  endTime: string
  location: string
  isOnline: boolean
  students?: number
  color: string
  day: number
  description?: string
}

interface Event {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  type: "meeting" | "exam" | "workshop" | "holiday"
  location?: string
  description?: string
}

// ============================================================================
// Mock Data
// ============================================================================

const weeklySchedule: ScheduleSlot[] = [
  // Monday
  {
    id: "1",
    title: "Programming Fundamentals",
    courseCode: "CS101",
    type: "class",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 301",
    isOnline: false,
    students: 45,
    color: "bg-blue-500",
    day: 1,
  },
  {
    id: "2",
    title: "Office Hours",
    courseCode: "",
    type: "office",
    startTime: "14:00",
    endTime: "16:00",
    location: "Office 312",
    isOnline: false,
    color: "bg-green-500",
    day: 1,
  },
  // Tuesday
  {
    id: "3",
    title: "Data Structures",
    courseCode: "CS201",
    type: "class",
    startTime: "10:00",
    endTime: "11:30",
    location: "Lab 205",
    isOnline: false,
    students: 38,
    color: "bg-purple-500",
    day: 2,
  },
  {
    id: "4",
    title: "Department Meeting",
    courseCode: "",
    type: "meeting",
    startTime: "14:00",
    endTime: "15:00",
    location: "Conference Room",
    isOnline: false,
    color: "bg-orange-500",
    day: 2,
  },
  // Wednesday
  {
    id: "5",
    title: "Programming Fundamentals",
    courseCode: "CS101",
    type: "class",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 301",
    isOnline: false,
    students: 45,
    color: "bg-blue-500",
    day: 3,
  },
  {
    id: "6",
    title: "Machine Learning",
    courseCode: "CS301",
    type: "class",
    startTime: "16:00",
    endTime: "17:30",
    location: "Room 410",
    isOnline: false,
    students: 25,
    color: "bg-pink-500",
    day: 3,
  },
  // Thursday
  {
    id: "7",
    title: "Data Structures",
    courseCode: "CS201",
    type: "class",
    startTime: "10:00",
    endTime: "11:30",
    location: "Lab 205",
    isOnline: false,
    students: 38,
    color: "bg-purple-500",
    day: 4,
  },
  {
    id: "8",
    title: "Online Office Hours",
    courseCode: "",
    type: "office",
    startTime: "15:00",
    endTime: "17:00",
    location: "Online",
    isOnline: true,
    color: "bg-green-500",
    day: 4,
  },
  // Friday
  {
    id: "9",
    title: "Programming Fundamentals",
    courseCode: "CS101",
    type: "class",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 301",
    isOnline: false,
    students: 45,
    color: "bg-blue-500",
    day: 5,
  },
  {
    id: "10",
    title: "Machine Learning",
    courseCode: "CS301",
    type: "class",
    startTime: "11:00",
    endTime: "12:30",
    location: "Room 410",
    isOnline: false,
    students: 25,
    color: "bg-pink-500",
    day: 5,
  },
]

const upcomingEvents: Event[] = [
  {
    id: "1",
    title: "Midterm Exam - CS101",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startTime: "09:00",
    endTime: "11:00",
    type: "exam",
    location: "Exam Hall A",
    description: "Midterm examination for Programming Fundamentals",
  },
  {
    id: "2",
    title: "Faculty Workshop",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    startTime: "14:00",
    endTime: "17:00",
    type: "workshop",
    location: "Auditorium",
    description: "Teaching methodology workshop",
  },
  {
    id: "3",
    title: "Parent-Teacher Meeting",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    startTime: "10:00",
    endTime: "16:00",
    type: "meeting",
    location: "Various Classrooms",
    description: "Semester progress discussion with parents",
  },
]

// ============================================================================
// Component
// ============================================================================

export function ScheduleTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: ScheduleTabProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const timeSlots = Array.from({ length: 11 }, (_, i) => `${8 + i}:00`)

  // Get schedule for a specific day
  const getDaySchedule = (dayIndex: number) => {
    return weeklySchedule.filter((slot) => slot.day === dayIndex)
  }

  // Calculate slot position and height
  const getSlotStyle = (slot: ScheduleSlot) => {
    const startHour = parseInt(slot.startTime.split(":")[0])
    const startMinute = parseInt(slot.startTime.split(":")[1])
    const endHour = parseInt(slot.endTime.split(":")[0])
    const endMinute = parseInt(slot.endTime.split(":")[1])

    const top = ((startHour - 8) * 60 + startMinute) * (60 / 60)
    const height =
      ((endHour - startHour) * 60 + (endMinute - startMinute)) * (60 / 60)

    return {
      top: `${top}px`,
      height: `${height}px`,
    }
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "class":
        return <Users className="h-3 w-3" />
      case "office":
        return <Clock className="h-3 w-3" />
      case "meeting":
        return <Users className="h-3 w-3" />
      case "exam":
        return <Calendar className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  // Get type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "text-red-600 bg-red-50"
      case "workshop":
        return "text-blue-600 bg-blue-50"
      case "meeting":
        return "text-purple-600 bg-purple-50"
      case "holiday":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  // Calculate teaching hours
  const weeklyTeachingHours = weeklySchedule
    .filter((slot) => slot.type === "class")
    .reduce((total, slot) => {
      const start = slot.startTime.split(":").map(Number)
      const end = slot.endTime.split(":").map(Number)
      const hours = end[0] - start[0] + (end[1] - start[1]) / 60
      return total + hours
    }, 0)

  const officeHours = weeklySchedule
    .filter((slot) => slot.type === "office")
    .reduce((total, slot) => {
      const start = slot.startTime.split(":").map(Number)
      const end = slot.endTime.split(":").map(Number)
      const hours = end[0] - start[0] + (end[1] - start[1]) / 60
      return total + hours
    }, 0)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Schedule Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Weekly Hours</p>
            </div>
            <p className="text-2xl font-bold">
              {weeklyTeachingHours.toFixed(1)}
            </p>
            <p className="text-muted-foreground text-xs">Teaching hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Classes/Week</p>
            </div>
            <p className="text-2xl font-bold">
              {weeklySchedule.filter((s) => s.type === "class").length}
            </p>
            <p className="text-muted-foreground text-xs">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Office Hours</p>
            </div>
            <p className="text-2xl font-bold">{officeHours.toFixed(1)}</p>
            <p className="text-muted-foreground text-xs">Hours/week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Upcoming</p>
            </div>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            <p className="text-muted-foreground text-xs">Events this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeek(addDays(weekStart, -7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm font-medium">
                  {format(weekStart, "MMM dd")} -{" "}
                  {format(addDays(weekStart, 6), "MMM dd, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeek(addDays(weekStart, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            {/* Time Grid */}
            <div className="flex">
              {/* Time Column */}
              <div className="w-20 flex-shrink-0">
                <div className="h-10 border-b" /> {/* Header spacer */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="text-muted-foreground h-[60px] border-b p-2 text-xs"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Days Columns */}
              <div className="grid min-w-[700px] flex-1 grid-cols-7">
                {days.map((day, dayIndex) => {
                  const daySchedule = getDaySchedule(dayIndex)
                  const isToday = isSameDay(
                    addDays(weekStart, dayIndex),
                    new Date()
                  )

                  return (
                    <div key={day} className="border-s">
                      {/* Day Header */}
                      <div
                        className={cn(
                          "h-10 border-b p-2 text-center",
                          isToday && "bg-primary/5"
                        )}
                      >
                        <p className="text-xs font-medium">
                          {daysShort[dayIndex]}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(addDays(weekStart, dayIndex), "d")}
                        </p>
                      </div>

                      {/* Time Slots */}
                      <div className="relative">
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className={cn(
                              "h-[60px] border-b",
                              isToday && "bg-primary/5"
                            )}
                          />
                        ))}

                        {/* Schedule Items */}
                        {daySchedule.map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              "absolute right-0 left-0 mx-1 overflow-hidden rounded-md p-1 text-white",
                              slot.color
                            )}
                            style={getSlotStyle(slot)}
                          >
                            <div className="text-xs">
                              <div className="flex items-center gap-1">
                                {getTypeIcon(slot.type)}
                                <span className="font-medium">
                                  {slot.courseCode || slot.title}
                                </span>
                              </div>
                              {slot.courseCode && (
                                <p className="truncate text-[10px] opacity-90">
                                  {slot.title}
                                </p>
                              )}
                              <p className="text-[10px] opacity-90">
                                {slot.isOnline ? (
                                  <span className="flex items-center gap-1">
                                    <Video className="h-3 w-3" />
                                    Online
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {slot.location}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] opacity-90">
                                {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Upcoming Events</span>
            <Button variant="outline" size="sm">
              <Plus className="me-2 h-4 w-4" />
              Add Event
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-lg border p-3"
              >
                <div
                  className={cn(
                    "rounded-lg p-2",
                    getEventTypeColor(event.type)
                  )}
                >
                  {getTypeIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  {event.description && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {event.description}
                    </p>
                  )}
                  <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(event.date, "MMMM dd, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.startTime} - {event.endTime}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={event.type === "exam" ? "destructive" : "secondary"}
                >
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
