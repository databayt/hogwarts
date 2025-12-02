/**
 * Student Profile Activities Tab
 * Extracurricular activities, clubs, and participation
 */

"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Users, Calendar, Clock, MapPin, Award, Star, ChevronRight, Activity, Target, Zap, Music, Palette, Code, BookOpen, Trophy, Heart } from "lucide-react"
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { StudentProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ActivitiesTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
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
  type: 'competition' | 'workshop' | 'seminar' | 'social' | 'sports'
  date: Date
  location: string
  role: 'participant' | 'organizer' | 'volunteer' | 'winner'
  description: string
  attendees: number
}

interface Project {
  id: string
  title: string
  club: string
  status: 'ongoing' | 'completed' | 'planned'
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
    id: '1',
    name: 'Coding Club',
    role: 'Vice President',
    joinedDate: new Date('2023-01-15'),
    icon: <Code className="h-4 w-4" />,
    color: 'bg-blue-500',
    members: 45,
    meetingSchedule: 'Every Tuesday, 4:00 PM',
    description: 'Learn programming, participate in hackathons, and build projects together',
    achievements: ['Won Regional Hackathon 2023', 'Built School App', '30+ Projects Completed'],
    participationRate: 95
  },
  {
    id: '2',
    name: 'Debate Team',
    role: 'Member',
    joinedDate: new Date('2023-03-20'),
    icon: <Users className="h-4 w-4" />,
    color: 'bg-purple-500',
    members: 20,
    meetingSchedule: 'Mon & Thu, 3:30 PM',
    description: 'Develop public speaking skills and participate in debate competitions',
    achievements: ['3rd Place State Championship', 'Best Speaker Award'],
    participationRate: 88
  },
  {
    id: '3',
    name: 'Robotics Club',
    role: 'Technical Lead',
    joinedDate: new Date('2022-09-10'),
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-green-500',
    members: 30,
    meetingSchedule: 'Wednesday, 5:00 PM',
    description: 'Build and program robots for competitions',
    achievements: ['FIRST Robotics Regional Finalist', 'Innovation Award 2023'],
    participationRate: 92
  },
  {
    id: '4',
    name: 'Student Council',
    role: 'Secretary',
    joinedDate: new Date('2023-06-01'),
    icon: <Award className="h-4 w-4" />,
    color: 'bg-yellow-500',
    members: 15,
    meetingSchedule: 'Every Friday, 2:00 PM',
    description: 'Represent student body and organize school events',
    achievements: ['Organized 10+ Events', 'Raised $5000 for Charity'],
    participationRate: 100
  }
]

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Science Fair',
    type: 'competition',
    date: new Date('2024-02-15'),
    location: 'School Auditorium',
    role: 'winner',
    description: 'Presented AI-powered study assistant project',
    attendees: 200
  },
  {
    id: '2',
    title: 'Web Development Workshop',
    type: 'workshop',
    date: new Date('2024-01-20'),
    location: 'Computer Lab',
    role: 'organizer',
    description: 'Taught basics of HTML, CSS, and JavaScript to juniors',
    attendees: 35
  },
  {
    id: '3',
    title: 'Cultural Festival',
    type: 'social',
    date: new Date('2023-12-10'),
    location: 'School Grounds',
    role: 'volunteer',
    description: 'Helped organize and manage the annual cultural celebration',
    attendees: 500
  }
]

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'School Management App',
    club: 'Coding Club',
    status: 'completed',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-12-15'),
    role: 'Lead Developer',
    teamSize: 5,
    description: 'Developed a mobile app for students to check schedules and grades',
    technologies: ['React Native', 'Firebase', 'Node.js'],
    achievement: 'Deployed to 500+ users'
  },
  {
    id: '2',
    title: 'Line Following Robot',
    club: 'Robotics Club',
    status: 'ongoing',
    startDate: new Date('2024-01-10'),
    role: 'Programmer',
    teamSize: 4,
    description: 'Building an autonomous robot for navigation competition',
    technologies: ['Arduino', 'C++', 'Sensors']
  },
  {
    id: '3',
    title: 'Climate Change Awareness Campaign',
    club: 'Student Council',
    status: 'completed',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-11-30'),
    role: 'Coordinator',
    teamSize: 8,
    description: 'Organized awareness programs and eco-friendly initiatives',
    achievement: 'Reduced school plastic use by 40%'
  }
]

// ============================================================================
// Component
// ============================================================================

export function ActivitiesTab({
  profile,
  dictionary,
  lang = 'en',
  className
}: ActivitiesTabProps) {
  const { skillsAndInterests } = profile

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'competition': return 'bg-red-500'
      case 'workshop': return 'bg-blue-500'
      case 'seminar': return 'bg-purple-500'
      case 'social': return 'bg-green-500'
      case 'sports': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'winner':
      case 'President':
      case 'Vice President':
      case 'Technical Lead':
        return 'default'
      case 'organizer':
      case 'Secretary':
      case 'Lead Developer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Active Clubs</p>
            </div>
            <p className="text-2xl font-bold">{mockClubs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <p className="text-2xl font-bold">{mockEvents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
            <p className="text-2xl font-bold">{mockProjects.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
      </div>

      {/* Clubs & Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clubs & Organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockClubs.map((club) => (
            <div key={club.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg text-white', club.color)}>
                    {club.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{club.name}</h4>
                      <Badge variant={getRoleBadgeVariant(club.role)}>
                        {club.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {club.description}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Meeting Schedule</p>
                  <p className="text-sm">{club.meetingSchedule}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Members</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{club.members} members</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Participation</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{club.participationRate}%</span>
                    </div>
                    <Progress value={club.participationRate} className="h-2" />
                  </div>
                </div>
              </div>

              {club.achievements.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Key Achievements</p>
                  <div className="flex flex-wrap gap-2">
                    {club.achievements.map((achievement, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-muted-foreground">
                Joined {format(club.joinedDate, 'MMMM yyyy')}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className={cn('w-2 h-2 rounded-full mt-2', getEventTypeColor(event.type))} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(event.role)} className="text-xs">
                      {event.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(event.date, 'MMM dd, yyyy')}
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
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{project.title}</p>
                      <Badge
                        variant={
                          project.status === 'completed' ? 'secondary' :
                          project.status === 'ongoing' ? 'default' : 'outline'
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.club} • {project.role}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {project.description}
                </p>

                {project.technologies && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.technologies.map((tech, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Team of {project.teamSize}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(project.startDate, 'MMM yyyy')}
                    {project.endDate && ` - ${format(project.endDate, 'MMM yyyy')}`}
                  </span>
                </div>

                {project.achievement && (
                  <div className="mt-2 pt-2 border-t">
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
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
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Interests & Hobbies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-3">Areas of Interest</p>
              <div className="flex flex-wrap gap-2">
                {skillsAndInterests.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Hobbies</p>
              <div className="flex flex-wrap gap-2">
                {skillsAndInterests.hobbies.map((hobby, index) => {
                  const getHobbyIcon = () => {
                    const lower = hobby.toLowerCase()
                    if (lower.includes('music')) return <Music className="h-3 w-3" />
                    if (lower.includes('read')) return <BookOpen className="h-3 w-3" />
                    if (lower.includes('photo')) return <Palette className="h-3 w-3" />
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