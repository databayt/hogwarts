/**
 * Student Profile Connections Tab
 * Social connections, followers, and network
 */

"use client"

import React, { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Briefcase,
  Calendar,
  ChevronRight,
  EllipsisVertical,
  Globe,
  Link,
  ListFilter,
  Mail,
  MapPin,
  MessageSquare,
  School,
  Search,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StudentProfile } from "../../types"
import { UserProfileType } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface ConnectionsTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface Connection {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserProfileType
  department?: string
  grade?: string
  bio?: string
  mutualConnections: number
  connectedDate: Date
  lastActive?: Date
  isOnline: boolean
  isPinned?: boolean
  commonInterests?: string[]
}

interface ConnectionRequest {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserProfileType
  message?: string
  requestDate: Date
  type: "sent" | "received"
  mutualConnections: number
}

interface Suggestion {
  id: string
  name: string
  avatar?: string
  role: UserProfileType
  department?: string
  reason: string
  mutualConnections: number
  commonInterests: string[]
}

// ============================================================================
// Mock Data
// ============================================================================

const mockConnections: Connection[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    role: UserProfileType.STUDENT,
    grade: "BCA-Semester-1",
    bio: "Computer Science enthusiast, love coding and gaming",
    mutualConnections: 12,
    connectedDate: new Date("2023-09-15"),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isOnline: true,
    isPinned: true,
    commonInterests: ["Programming", "Gaming", "AI"],
  },
  {
    id: "2",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: UserProfileType.TEACHER,
    department: "Computer Science",
    bio: "Teaching programming and data structures",
    mutualConnections: 5,
    connectedDate: new Date("2023-08-20"),
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isOnline: false,
    isPinned: true,
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    role: UserProfileType.STUDENT,
    grade: "BCA-Semester-3",
    mutualConnections: 8,
    connectedDate: new Date("2023-10-10"),
    lastActive: new Date(),
    isOnline: true,
    commonInterests: ["Web Development", "Design"],
  },
  {
    id: "4",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    role: UserProfileType.PARENT,
    bio: "Parent of Alex Anderson",
    mutualConnections: 3,
    connectedDate: new Date("2023-11-05"),
    isOnline: false,
  },
]

const mockRequests: ConnectionRequest[] = [
  {
    id: "1",
    name: "David Wilson",
    email: "david.wilson@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    role: UserProfileType.STUDENT,
    message: "Hi! We met at the hackathon last week. Would love to connect!",
    requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: "received",
    mutualConnections: 4,
  },
  {
    id: "2",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    role: UserProfileType.STUDENT,
    requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: "sent",
    mutualConnections: 6,
  },
]

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    name: "Robert Taylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    role: UserProfileType.STUDENT,
    department: "Computer Science",
    reason: "Same department",
    mutualConnections: 15,
    commonInterests: ["Programming", "AI", "Robotics"],
  },
  {
    id: "2",
    name: "Prof. Jennifer Lee",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
    role: UserProfileType.TEACHER,
    department: "Mathematics",
    reason: "Teaches your courses",
    mutualConnections: 8,
    commonInterests: ["Mathematics", "Problem Solving"],
  },
  {
    id: "3",
    name: "Thomas Martinez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    role: UserProfileType.STUDENT,
    reason: "Member of Coding Club",
    mutualConnections: 10,
    commonInterests: ["Coding Club", "Web Development"],
  },
]

// ============================================================================
// Component
// ============================================================================

export function ConnectionsTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: ConnectionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("connections")

  // Filter connections
  const filteredConnections = mockConnections.filter(
    (conn) =>
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get role badge color
  const getRoleBadgeColor = (role: UserProfileType) => {
    switch (role) {
      case UserProfileType.STUDENT:
        return "bg-blue-500"
      case UserProfileType.TEACHER:
        return "bg-green-500"
      case UserProfileType.PARENT:
        return "bg-purple-500"
      case UserProfileType.STAFF:
        return "bg-orange-500"
      case UserProfileType.ADMIN:
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Connections</p>
            </div>
            <p className="text-2xl font-bold">{mockConnections.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <UserPlus className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Pending</p>
            </div>
            <p className="text-2xl font-bold">{mockRequests.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Star className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Followers</p>
            </div>
            <p className="text-2xl font-bold">127</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Following</p>
            </div>
            <p className="text-2xl font-bold">89</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="connections">
            Connections ({mockConnections.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({mockRequests.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {/* Pinned Connections */}
          {mockConnections.some((c) => c.isPinned) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pinned Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {mockConnections
                    .filter((c) => c.isPinned)
                    .map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-start gap-3"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={connection.avatar}
                              alt={connection.name}
                            />
                            <AvatarFallback>
                              {getInitials(connection.name)}
                            </AvatarFallback>
                          </Avatar>
                          {connection.isOnline && (
                            <div className="border-background absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 bg-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{connection.name}</p>
                              <p className="text-muted-foreground text-sm">
                                {connection.department || connection.grade}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <EllipsisVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Message
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Star className="mr-2 h-4 w-4" />
                                  Unpin
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove Connection
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {connection.bio && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {connection.bio}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-xs text-white",
                                getRoleBadgeColor(connection.role)
                              )}
                            >
                              {connection.role}
                            </Badge>
                            {connection.mutualConnections > 0 && (
                              <span className="text-muted-foreground text-xs">
                                {connection.mutualConnections} mutual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>All Connections</span>
                <Button variant="outline" size="sm">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredConnections
                  .filter((c) => !c.isPinned)
                  .map((connection) => (
                    <div
                      key={connection.id}
                      className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={connection.avatar}
                            alt={connection.name}
                          />
                          <AvatarFallback>
                            {getInitials(connection.name)}
                          </AvatarFallback>
                        </Avatar>
                        {connection.isOnline && (
                          <div className="border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {connection.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {connection.email}
                            </p>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            Connected{" "}
                            {formatDistanceToNow(connection.connectedDate, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {connection.commonInterests &&
                          connection.commonInterests.length > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-muted-foreground text-xs">
                                Common:
                              </span>
                              {connection.commonInterests
                                .slice(0, 3)
                                .map((interest, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                            </div>
                          )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Received Requests */}
          {mockRequests.some((r) => r.type === "received") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Received Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRequests
                  .filter((r) => r.type === "received")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.avatar} alt={request.name} />
                        <AvatarFallback>
                          {getInitials(request.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{request.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {request.email}
                        </p>
                        {request.message && (
                          <p className="mt-2 text-sm">{request.message}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-xs text-white",
                              getRoleBadgeColor(request.role)
                            )}
                          >
                            {request.role}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {request.mutualConnections} mutual connections
                          </span>
                          <span className="text-muted-foreground text-xs">
                            •{" "}
                            {formatDistanceToNow(request.requestDate, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">
                          <UserCheck className="mr-1 h-4 w-4" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Sent Requests */}
          {mockRequests.some((r) => r.type === "sent") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRequests
                  .filter((r) => r.type === "sent")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.avatar} alt={request.name} />
                        <AvatarFallback>
                          {getInitials(request.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{request.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {request.email}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-xs text-white",
                              getRoleBadgeColor(request.role)
                            )}
                          >
                            {request.role}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            Sent{" "}
                            {formatDistanceToNow(request.requestDate, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Cancel Request
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {mockSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={suggestion.avatar}
                          alt={suggestion.name}
                        />
                        <AvatarFallback>
                          {getInitials(suggestion.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{suggestion.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {suggestion.department}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            className={cn(
                              "text-xs text-white",
                              getRoleBadgeColor(suggestion.role)
                            )}
                          >
                            {suggestion.role}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {suggestion.reason}
                          </span>
                        </div>
                        {suggestion.mutualConnections > 0 && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {suggestion.mutualConnections} mutual connections
                          </p>
                        )}
                        {suggestion.commonInterests.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {suggestion.commonInterests.map(
                              (interest, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {interest}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="default" className="mt-3 w-full">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
