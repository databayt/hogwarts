/**
 * Student Profile Activities Tab
 * Extracurricular activities, clubs, and participation
 */

"use client"

import React from "react"
import { format } from "date-fns"
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Code,
  Heart,
  MapPin,
  Music,
  Palette,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StudentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface ActivitiesTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface Club {
  id: string
  name: string
  role: string
  joinedDate: Date
  icon: React.ReactNode
  color: string
  members: number
  meetingSchedule: string
  description: string
  achievements: string[]
  participationRate: number
}

interface Event {
  id: string
  title: string
  type: "competition" | "workshop" | "seminar" | "social" | "sports"
  date: Date
  location: string
  role: "participant" | "organizer" | "volunteer" | "winner"
  description: string
  attendees: number
}

interface Project {
  id: string
  title: string
  club: string
  status: "ongoing" | "completed" | "planned"
  startDate: Date
  endDate?: Date
  role: string
  teamSize: number
  description: string
  technologies?: string[]
  achievement?: string
}

// ============================================================================
// Mock Data
// ============================================================================

const mockClubs: Club[] = [
  {
    id: "1",
    name: "Coding Club",
    role: "Vice President",
    joinedDate: new Date("2023-01-15"),
    icon: <Code className="h-4 w-4" />,
    color: "bg-blue-500",
    members: 45,
    meetingSchedule: "Every Tuesday, 4:00 PM",
    description:
      "Learn programming, participate in hackathons, and build projects together",
    achievements: [
      "Won Regional Hackathon 2023",
      "Built School App",
      "30+ Projects Completed",
    ],
    participationRate: 95,
  },
  {
    id: "2",
    name: "Debate Team",
    role: "Member",
    joinedDate: new Date("2023-03-20"),
    icon: <Users className="h-4 w-4" />,
    color: "bg-purple-500",
    members: 20,
    meetingSchedule: "Mon & Thu, 3:30 PM",
    description:
      "Develop public speaking skills and participate in debate competitions",
    achievements: ["3rd Place State Championship", "Best Speaker Award"],
    participationRate: 88,
  },
  {
    id: "3",
    name: "Robotics Club",
    role: "Technical Lead",
    joinedDate: new Date("2022-09-10"),
    icon: <Zap className="h-4 w-4" />,
    color: "bg-green-500",
    members: 30,
    meetingSchedule: "Wednesday, 5:00 PM",
    description: "Build and program robots for competitions",
    achievements: ["FIRST Robotics Regional Finalist", "Innovation Award 2023"],
    participationRate: 92,
  },
  {
    id: "4",
    name: "Student Council",
    role: "Secretary",
    joinedDate: new Date("2023-06-01"),
    icon: <Award className="h-4 w-4" />,
    color: "bg-yellow-500",
    members: 15,
    meetingSchedule: "Every Friday, 2:00 PM",
    description: "Represent student body and organize school events",
    achievements: ["Organized 10+ Events", "Raised $5000 for Charity"],
    participationRate: 100,
  },
]

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Annual Science Fair",
    type: "competition",
    date: new Date("2024-02-15"),
    location: "School Auditorium",
    role: "winner",
    description: "Presented AI-powered study assistant project",
    attendees: 200,
  },
  {
    id: "2",
    title: "Web Development Workshop",
    type: "workshop",
    date: new Date("2024-01-20"),
    location: "Computer Lab",
    role: "organizer",
    description: "Taught basics of HTML, CSS, and JavaScript to juniors",
    attendees: 35,
  },
  {
    id: "3",
    title: "Cultural Festival",
    type: "social",
    date: new Date("2023-12-10"),
    location: "School Grounds",
    role: "volunteer",
    description: "Helped organize and manage the annual cultural celebration",
    attendees: 500,
  },
]

const mockProjects: Project[] = [
  {
    id: "1",
    title: "School Management App",
    club: "Coding Club",
    status: "completed",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2023-12-15"),
    role: "Lead Developer",
    teamSize: 5,
    description:
      "Developed a mobile app for students to check schedules and grades",
    technologies: ["React Native", "Firebase", "Node.js"],
    achievement: "Deployed to 500+ users",
  },
  {
    id: "2",
    title: "Line Following Robot",
    club: "Robotics Club",
    status: "ongoing",
    startDate: new Date("2024-01-10"),
    role: "Programmer",
    teamSize: 4,
    description: "Building an autonomous robot for navigation competition",
    technologies: ["Arduino", "C++", "Sensors"],
  },
  {
    id: "3",
    title: "Climate Change Awareness Campaign",
    club: "Student Council",
    status: "completed",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2023-11-30"),
    role: "Coordinator",
    teamSize: 8,
    description: "Organized awareness programs and eco-friendly initiatives",
    achievement: "Reduced school plastic use by 40%",
  },
]

// ============================================================================
// Component
// ============================================================================

export function ActivitiesTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: ActivitiesTabProps) {
  const { skillsAndInterests } = profile

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "competition":
        return "bg-red-500"
      case "workshop":
        return "bg-blue-500"
      case "seminar":
        return "bg-purple-500"
      case "social":
        return "bg-green-500"
      case "sports":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "winner":
      case "President":
      case "Vice President":
      case "Technical Lead":
        return "default"
      case "organizer":
      case "Secretary":
      case "Lead Developer":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Activity Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Active Clubs</p>
            </div>
            <p className="text-2xl font-bold">{mockClubs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Events</p>
            </div>
            <p className="text-2xl font-bold">{mockEvents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Target className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Projects</p>
            </div>
            <p className="text-2xl font-bold">{mockProjects.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Star className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Achievements</p>
            </div>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
      </div>

      {/* Clubs & Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Clubs & Organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockClubs.map((club) => (
            <div key={club.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-lg p-2 text-white", club.color)}>
                    {club.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{club.name}</h4>
                      <Badge variant={getRoleBadgeVariant(club.role)}>
                        {club.role}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {club.description}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">
                    Meeting Schedule
                  </p>
                  <p className="text-sm">{club.meetingSchedule}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Members</p>
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-3 w-3" />
                    <span className="text-sm">{club.members} members</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">
                    Participation
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{club.participationRate}%</span>
                    </div>
                    <Progress value={club.participationRate} className="h-2" />
                  </div>
                </div>
              </div>

              {club.achievements.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    Key Achievements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {club.achievements.map((achievement, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        <Trophy className="me-1 h-3 w-3" />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-muted-foreground mt-3 text-xs">
                Joined {format(club.joinedDate, "MMMM yyyy")}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-2 h-2 w-2 rounded-full",
                    getEventTypeColor(event.type)
                  )}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {event.description}
                      </p>
                    </div>
                    <Badge
                      variant={getRoleBadgeVariant(event.role)}
                      className="text-xs"
                    >
                      {event.role}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(event.date, "MMM dd, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendees}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              View All Events
              <ChevronRight className="ms-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockProjects.map((project) => (
              <div key={project.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{project.title}</p>
                      <Badge
                        variant={
                          project.status === "completed"
                            ? "secondary"
                            : project.status === "ongoing"
                              ? "default"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {project.club} • {project.role}
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-2 text-xs">
                  {project.description}
                </p>

                {project.technologies && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {project.technologies.map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Team of {project.teamSize}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(project.startDate, "MMM yyyy")}
                    {project.endDate &&
                      ` - ${format(project.endDate, "MMM yyyy")}`}
                  </span>
                </div>

                {project.achievement && (
                  <div className="mt-2 border-t pt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="me-1 h-3 w-3" />
                      {project.achievement}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Interests & Hobbies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" />
            Interests & Hobbies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium">Areas of Interest</p>
              <div className="flex flex-wrap gap-2">
                {skillsAndInterests.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Hobbies</p>
              <div className="flex flex-wrap gap-2">
                {skillsAndInterests.hobbies.map((hobby, index) => {
                  const getHobbyIcon = () => {
                    const lower = hobby.toLowerCase()
                    if (lower.includes("music"))
                      return <Music className="h-3 w-3" />
                    if (lower.includes("read"))
                      return <BookOpen className="h-3 w-3" />
                    if (lower.includes("photo"))
                      return <Palette className="h-3 w-3" />
                    return <Heart className="h-3 w-3" />
                  }
                  return (
                    <Badge key={index} variant="outline" className="gap-1">
                      {getHobbyIcon()}
                      {hobby}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
