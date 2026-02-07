"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Bell,
  BookOpen,
  ChevronDown,
  ListFilter,
  School,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

import { getParentAnnouncements } from "./actions"

interface Announcement {
  id: string
  title: string
  body: string
  scope: string
  createdAt: Date
  updatedAt: Date
  class: {
    id: string
    name: string
    subject: string
    teacher: string
  } | null
  relevantStudents: string[]
}

interface Student {
  id: string
  name: string
}

export function ParentAnnouncementsContent({
  lang = "ar",
}: {
  lang?: "ar" | "en"
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [selectedScope, setSelectedScope] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    setIsLoading(true)
    try {
      const result = await getParentAnnouncements(lang)
      if (result.success) {
        setAnnouncements(result.announcements as Announcement[])
        setStudents(result.students || [])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "school":
        return <School className="h-4 w-4" />
      case "class":
        return <BookOpen className="h-4 w-4" />
      case "role":
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "school":
        return <Badge className="bg-blue-100 text-blue-800">School-wide</Badge>
      case "class":
        return <Badge className="bg-green-100 text-green-800">Class</Badge>
      case "role":
        return <Badge className="bg-purple-100 text-purple-800">Parents</Badge>
      default:
        return <Badge variant="outline">{scope}</Badge>
    }
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    // Filter by student
    if (selectedStudent !== "all") {
      if (!announcement.relevantStudents.includes(selectedStudent)) {
        return false
      }
    }

    // Filter by scope
    if (selectedScope !== "all") {
      if (announcement.scope !== selectedScope) {
        return false
      }
    }

    return true
  })

  // Group announcements by date
  const groupedAnnouncements = filteredAnnouncements.reduce(
    (acc, announcement) => {
      const date = format(new Date(announcement.createdAt), "yyyy-MM-dd")
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(announcement)
      return acc
    },
    {} as Record<string, Announcement[]>
  )

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center py-12">
          <p className="muted">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <PageHeadingSetter
        title="Announcements"
        description="Stay updated with school and class announcements"
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
          <CardContent className="flex gap-4">
            {students.length > 1 && (
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedScope} onValueChange={setSelectedScope}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="school">School-wide</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="role">Parents</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Announcements grouped by date */}
        {Object.keys(groupedAnnouncements).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No announcements found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAnnouncements)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dateAnnouncements]) => (
                <div key={date} className="space-y-4">
                  <h5 className="text-muted-foreground">
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </h5>
                  <div className="space-y-3">
                    {dateAnnouncements.map((announcement) => (
                      <Card key={announcement.id} className="overflow-hidden">
                        <Collapsible
                          open={expandedCards.has(announcement.id)}
                          onOpenChange={() => toggleCard(announcement.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="flex items-center gap-2">
                                    {getScopeIcon(announcement.scope)}
                                    {announcement.title}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2">
                                    {getScopeBadge(announcement.scope)}
                                    {announcement.class && (
                                      <p>
                                        {announcement.class.subject} -{" "}
                                        {announcement.class.name}
                                        <span className="text-muted-foreground ms-2">
                                          by {announcement.class.teacher}
                                        </span>
                                      </p>
                                    )}
                                    <small className="muted ms-auto">
                                      {format(
                                        new Date(announcement.createdAt),
                                        "h:mm a"
                                      )}
                                    </small>
                                  </CardDescription>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    "h-5 w-5 transition-transform",
                                    expandedCards.has(announcement.id) &&
                                      "rotate-180"
                                  )}
                                />
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-wrap">
                                  {announcement.body}
                                </p>
                              </div>
                              {students.length > 1 && (
                                <div className="mt-4 border-t pt-4">
                                  <p className="muted">
                                    Relevant for:{" "}
                                    {students
                                      .filter((s) =>
                                        announcement.relevantStudents.includes(
                                          s.id
                                        )
                                      )
                                      .map((s) => s.name)
                                      .join(", ")}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
