/**
 * Parent Profile Communication Tab
 * Messages with teachers, school announcements, and notifications
 */

"use client"

import React, { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Archive,
  Bell,
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  EllipsisVertical,
  GraduationCap,
  Inbox,
  Info,
  ListFilter,
  Mail,
  Megaphone,
  MessageSquare,
  Paperclip,
  Phone,
  Reply,
  Search,
  Send,
  Star,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ParentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface CommunicationTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  isOwner?: boolean
  className?: string
}

interface Message {
  id: string
  from: {
    name: string
    role: "teacher" | "admin" | "parent" | "system"
    avatar?: string
  }
  to: string
  subject: string
  content: string
  date: Date
  read: boolean
  starred: boolean
  archived: boolean
  attachments?: string[]
  childRelated?: string
  thread?: Message[]
}

interface Announcement {
  id: string
  title: string
  content: string
  date: Date
  type: "general" | "urgent" | "event" | "holiday" | "academic"
  author: string
  targetGrades?: string[]
  attachments?: string[]
  important: boolean
}

interface Notification {
  id: string
  type: "grade" | "attendance" | "payment" | "message" | "event" | "behavior"
  title: string
  description: string
  date: Date
  read: boolean
  childId?: string
  childName?: string
  actionUrl?: string
}

interface Teacher {
  id: string
  name: string
  subject: string
  email: string
  phone?: string
  avatar?: string
  child: string
  officeHours?: string
}

// ============================================================================
// Mock Data
// ============================================================================

const mockMessages: Message[] = [
  {
    id: "msg-1",
    from: {
      name: "Ms. Johnson",
      role: "teacher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Johnson",
    },
    to: "Robert Thompson",
    subject: "Alex's Progress in Mathematics",
    content:
      "Dear Mr. Thompson,\n\nI wanted to reach out to discuss Alex's recent progress in Mathematics. He has shown significant improvement in algebra and is actively participating in class discussions. His recent test scores have been excellent.\n\nI would like to suggest some advanced materials that might help him further develop his skills. Please let me know if you'd like to discuss this further.\n\nBest regards,\nMs. Johnson",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    starred: true,
    archived: false,
    childRelated: "Alex Thompson",
  },
  {
    id: "msg-2",
    from: {
      name: "Mr. Davis",
      role: "teacher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Davis",
    },
    to: "Robert Thompson",
    subject: "Emma's Science Fair Project",
    content:
      "Hi Mr. Thompson,\n\nEmma's science fair project on renewable energy was outstanding! She won first place in her category. I wanted to congratulate you and Emma on this achievement.\n\nThe project will be displayed at the state competition next month.\n\nCongratulations!\nMr. Davis",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    starred: false,
    archived: false,
    childRelated: "Emma Thompson",
  },
  {
    id: "msg-3",
    from: {
      name: "School Admin",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    },
    to: "All Parents",
    subject: "Important: Upcoming Parent-Teacher Conference",
    content:
      "Dear Parents,\n\nWe would like to remind you about the upcoming Parent-Teacher Conference scheduled for next Friday, March 15th, from 3:00 PM to 6:00 PM.\n\nPlease book your appointment slots through the school portal.\n\nThank you,\nSchool Administration",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    starred: false,
    archived: false,
  },
]

const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "School Closure - Weather Alert",
    content:
      "Due to severe weather conditions, the school will be closed tomorrow, March 10th. All classes and activities are cancelled. Online learning materials will be available on the portal.",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000),
    type: "urgent",
    author: "Principal Williams",
    important: true,
  },
  {
    id: "ann-2",
    title: "Annual Sports Day - Save the Date!",
    content:
      "We are excited to announce that our Annual Sports Day will be held on April 20th. All students will participate in various sporting events. Parents are welcome to attend and cheer for their children.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: "event",
    author: "Sports Department",
    targetGrades: ["8", "9", "10"],
    important: false,
  },
  {
    id: "ann-3",
    title: "New Lunch Menu Starting Next Week",
    content:
      "We are pleased to introduce a new, healthier lunch menu starting next Monday. The menu includes more vegetarian options and fresh fruits. Please review the menu on the school website.",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    type: "general",
    author: "Cafeteria Manager",
    important: false,
  },
]

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "grade",
    title: "New Grade Posted",
    description: "Alex received an A on the Math test",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    childId: "student-1",
    childName: "Alex Thompson",
  },
  {
    id: "notif-2",
    type: "attendance",
    title: "Attendance Alert",
    description: "Emma was marked late for first period",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    childId: "student-2",
    childName: "Emma Thompson",
  },
  {
    id: "notif-3",
    type: "payment",
    title: "Payment Reminder",
    description: "Tuition fee payment due in 5 days",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "notif-4",
    type: "event",
    title: "Event Reminder",
    description: "Parent-Teacher meeting tomorrow at 3 PM",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: false,
  },
]

const mockTeachers: Teacher[] = [
  {
    id: "teacher-1",
    name: "Ms. Johnson",
    subject: "Mathematics",
    email: "johnson@school.edu",
    phone: "+1 234 567 8901",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Johnson",
    child: "Alex Thompson",
    officeHours: "Mon & Wed, 3-4 PM",
  },
  {
    id: "teacher-2",
    name: "Mr. Davis",
    subject: "Science",
    email: "davis@school.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Davis",
    child: "Emma Thompson",
    officeHours: "Tue & Thu, 2-3 PM",
  },
  {
    id: "teacher-3",
    name: "Mrs. Smith",
    subject: "English",
    email: "smith@school.edu",
    phone: "+1 234 567 8902",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Smith",
    child: "Both",
    officeHours: "Daily, 4-5 PM",
  },
]

// ============================================================================
// Component
// ============================================================================

export function CommunicationTab({
  profile,
  dictionary,
  lang = "en",
  isOwner = false,
  className,
}: CommunicationTabProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all")

  const { engagementMetrics } = profile

  // Filter messages
  const filteredMessages = mockMessages.filter((message) => {
    if (filter === "unread" && message.read) return false
    if (filter === "starred" && !message.starred) return false
    if (
      searchTerm &&
      !message.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !message.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false
    return !message.archived
  })

  // Count unread
  const unreadCount = mockMessages.filter((m) => !m.read).length
  const unreadNotifications = mockNotifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "grade":
        return <GraduationCap className="h-4 w-4" />
      case "attendance":
        return <Calendar className="h-4 w-4" />
      case "payment":
        return <CreditCard className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "behavior":
        return <CircleAlert className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAnnouncementIcon = (type: Announcement["type"]) => {
    switch (type) {
      case "urgent":
        return <CircleAlert className="h-4 w-4 text-red-500" />
      case "event":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "holiday":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "academic":
        return <GraduationCap className="h-4 w-4 text-purple-500" />
      default:
        return <Megaphone className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Communication Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Inbox className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-muted-foreground text-xs">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <Bell className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadNotifications}</p>
                <p className="text-muted-foreground text-xs">
                  New Notifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Send className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {engagementMetrics?.messagesSent}
                </p>
                <p className="text-muted-foreground text-xs">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTeachers.length}</p>
                <p className="text-muted-foreground text-xs">
                  Teacher Contacts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="starred">Starred</option>
                </select>
                <Button variant="outline" size="icon">
                  <ListFilter className="h-4 w-4" />
                </Button>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inbox</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors",
                      !message.read &&
                        "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10",
                      selectedMessage?.id === message.id && "bg-muted"
                    )}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.from.avatar} />
                        <AvatarFallback>{message.from.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">
                            {message.from.name}
                          </p>
                          <div className="flex items-center gap-1">
                            {message.starred && (
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            )}
                            {!message.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>
                        <p className="truncate text-sm font-medium">
                          {message.subject}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {message.content.split("\n")[0]}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(message.date, {
                              addSuffix: true,
                            })}
                          </span>
                          {message.childRelated && (
                            <Badge variant="secondary" className="text-xs">
                              {message.childRelated}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Message Detail */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedMessage ? "Message Detail" : "Select a message"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedMessage.from.avatar} />
                          <AvatarFallback>
                            {selectedMessage.from.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedMessage.from.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {format(
                              selectedMessage.date,
                              "MMM dd, yyyy h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Star
                            className={cn(
                              "h-4 w-4",
                              selectedMessage.starred &&
                                "fill-yellow-500 text-yellow-500"
                            )}
                          />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 font-semibold">
                        {selectedMessage.subject}
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        {selectedMessage.content.split("\n").map((line, i) => (
                          <p key={i} className="text-sm">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>

                    {selectedMessage.attachments &&
                      selectedMessage.attachments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-muted-foreground text-sm">
                            {selectedMessage.attachments.length} attachment(s)
                          </span>
                        </div>
                      )}

                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-between">
                          <Button variant="ghost" size="sm">
                            <Paperclip className="mr-1 h-4 w-4" />
                            Attach
                          </Button>
                          <Button size="sm">
                            <Reply className="mr-1 h-4 w-4" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    Select a message to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4" />
                School Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAnnouncements.map((announcement) => (
                <div key={announcement.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        announcement.type === "urgent"
                          ? "bg-red-500/10"
                          : announcement.type === "event"
                            ? "bg-blue-500/10"
                            : "bg-gray-500/10"
                      )}
                    >
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">
                            {announcement.title}
                          </h4>
                          {announcement.important && (
                            <Badge
                              variant="destructive"
                              className="mt-1 text-xs"
                            >
                              Important
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">
                        {announcement.content}
                      </p>
                      <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                        <span>{announcement.author}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(announcement.date, {
                            addSuffix: true,
                          })}
                        </span>
                        {announcement.targetGrades && (
                          <>
                            <span>•</span>
                            <span>
                              Grades: {announcement.targetGrades.join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </span>
                <Button variant="outline" size="sm">
                  Mark All Read
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-3",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      notification.type === "grade" && "bg-green-500/10",
                      notification.type === "attendance" && "bg-yellow-500/10",
                      notification.type === "payment" && "bg-red-500/10",
                      notification.type === "event" && "bg-blue-500/10",
                      notification.type === "message" && "bg-purple-500/10",
                      notification.type === "behavior" && "bg-orange-500/10"
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {notification.description}
                    </p>
                    <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                      <span>
                        {formatDistanceToNow(notification.date, {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.childName && (
                        <Badge variant="secondary" className="text-xs">
                          {notification.childName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Teacher Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTeachers.map((teacher) => (
                <div key={teacher.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.avatar} />
                        <AvatarFallback>{teacher.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {teacher.subject}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {teacher.child}
                        </Badge>
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </div>
                          {teacher.phone && (
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </div>
                          )}
                          {teacher.officeHours && (
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3" />
                              Office Hours: {teacher.officeHours}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {teacher.phone && (
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* School Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Main Office</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground text-xs">
                      📞 +1 234 567 8900
                    </p>
                    <p className="text-muted-foreground text-xs">
                      📧 office@school.edu
                    </p>
                    <p className="text-muted-foreground text-xs">
                      🕐 Mon-Fri: 8 AM - 5 PM
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Attendance Office</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground text-xs">
                      📞 +1 234 567 8901
                    </p>
                    <p className="text-muted-foreground text-xs">
                      📧 attendance@school.edu
                    </p>
                    <p className="text-muted-foreground text-xs">
                      🕐 Mon-Fri: 7:30 AM - 4 PM
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">School Nurse</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground text-xs">
                      📞 +1 234 567 8999
                    </p>
                    <p className="text-muted-foreground text-xs">
                      📧 nurse@school.edu
                    </p>
                    <p className="text-muted-foreground text-xs">
                      🕐 Mon-Fri: 7:30 AM - 4:30 PM
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Counselor</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground text-xs">
                      📞 +1 234 567 8910
                    </p>
                    <p className="text-muted-foreground text-xs">
                      📧 counselor@school.edu
                    </p>
                    <p className="text-muted-foreground text-xs">
                      🕐 By Appointment
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
