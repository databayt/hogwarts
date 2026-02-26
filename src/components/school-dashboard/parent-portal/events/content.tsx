"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Calendar, CalendarDays, ListFilter, MapPin, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import {
  cancelEventRegistration,
  registerForEvent,
} from "@/components/school-dashboard/listings/events/actions"

import { getParentEvents } from "./actions"

interface ParentEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  location: string | null
  organizer: string | null
  maxAttendees: number | null
  currentAttendees: number
  isPublic: boolean
  registrationRequired: boolean
  status: string
  registrationStatus: string | null
  createdAt: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  ACADEMIC: "Academic",
  SPORTS: "Sports",
  CULTURAL: "Cultural",
  PARENT_MEETING: "Parent Meeting",
  CELEBRATION: "Celebration",
  WORKSHOP: "Workshop",
  OTHER: "Other",
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  ACADEMIC: "bg-blue-100 text-blue-800",
  SPORTS: "bg-green-100 text-green-800",
  CULTURAL: "bg-purple-100 text-purple-800",
  PARENT_MEETING: "bg-orange-100 text-orange-800",
  CELEBRATION: "bg-pink-100 text-pink-800",
  WORKSHOP: "bg-yellow-100 text-yellow-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export function ParentEventsContent({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const [events, setEvents] = useState<ParentEvent[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const result = await getParentEvents(lang)
      if (result.success) {
        setEvents(result.events as ParentEvent[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = useCallback(async (eventId: string) => {
    setRegistering(eventId)
    try {
      const result = await registerForEvent({ eventId })
      if (result.success) {
        // Reload events to reflect updated registration
        await loadEvents()
      }
    } finally {
      setRegistering(null)
    }
  }, [])

  const handleCancelRegistration = useCallback(async (eventId: string) => {
    setRegistering(eventId)
    try {
      const result = await cancelEventRegistration({ eventId })
      if (result.success) {
        await loadEvents()
      }
    } finally {
      setRegistering(null)
    }
  }, [])

  const now = new Date()

  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (e) => new Date(e.eventDate) >= now && e.status !== "COMPLETED"
      ),
    [events]
  )

  const pastEvents = useMemo(
    () =>
      events.filter(
        (e) => new Date(e.eventDate) < now || e.status === "COMPLETED"
      ),
    [events]
  )

  const filteredUpcoming = useMemo(
    () =>
      selectedType === "all"
        ? upcomingEvents
        : upcomingEvents.filter((e) => e.eventType === selectedType),
    [upcomingEvents, selectedType]
  )

  const filteredPast = useMemo(
    () =>
      selectedType === "all"
        ? pastEvents
        : pastEvents.filter((e) => e.eventType === selectedType),
    [pastEvents, selectedType]
  )

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center py-12">
          <p className="muted">Loading events...</p>
        </div>
      </div>
    )
  }

  const renderEventCard = (event: ParentEvent) => {
    const eventDate = new Date(event.eventDate)
    const isFull =
      event.maxAttendees !== null &&
      event.currentAttendees >= event.maxAttendees
    const isRegistered = event.registrationStatus === "REGISTERED"
    const isWaitlisted = event.registrationStatus === "WAITLISTED"
    const canRegister =
      event.registrationRequired &&
      !isRegistered &&
      !isWaitlisted &&
      event.status !== "COMPLETED"

    return (
      <Card key={event.id} className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {event.title}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    EVENT_TYPE_COLORS[event.eventType] ||
                    EVENT_TYPE_COLORS.OTHER
                  }
                >
                  {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                </Badge>
                <span>{format(eventDate, "EEEE, MMMM d, yyyy")}</span>
                <span>
                  {event.startTime} - {event.endTime}
                </span>
              </CardDescription>
            </div>
            {event.registrationRequired && (
              <div className="flex items-center gap-2">
                {isRegistered && (
                  <Badge className="bg-green-100 text-green-800">
                    Registered
                  </Badge>
                )}
                {isWaitlisted && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Waitlisted
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {event.description && (
            <p className="text-muted-foreground mb-4 text-sm whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {event.location && (
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            {event.organizer && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.organizer}
              </span>
            )}
            {event.maxAttendees && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {event.currentAttendees}/{event.maxAttendees} spots
                {isFull && " (Full)"}
              </span>
            )}
          </div>

          {event.registrationRequired && (
            <div className="mt-4 flex gap-2">
              {canRegister && (
                <Button
                  size="sm"
                  onClick={() => handleRegister(event.id)}
                  disabled={registering === event.id}
                >
                  {registering === event.id
                    ? "Registering..."
                    : isFull
                      ? "Join Waitlist"
                      : "Register"}
                </Button>
              )}
              {(isRegistered || isWaitlisted) &&
                event.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelRegistration(event.id)}
                    disabled={registering === event.id}
                  >
                    {registering === event.id
                      ? "Cancelling..."
                      : "Cancel Registration"}
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="py-8">
      <PageHeadingSetter
        title="Events"
        description="View upcoming school events and manage registrations"
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListFilter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Events tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({filteredUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({filteredPast.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {filteredUpcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No upcoming events found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUpcoming.map(renderEventCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {filteredPast.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">No past events found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredPast.map(renderEventCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
