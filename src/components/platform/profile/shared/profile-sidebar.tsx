/**
 * Profile Sidebar Component
 * GitHub-inspired left sidebar with detailed information
 */

"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Info,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Code,
  Users,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Shield,
  ChevronRight,
  Star,
  BookOpen,
  Target,
  Zap,
  Trophy,
  Heart,
  Music,
  Palette,
  Gamepad2,
  Camera,
  Plane,
  Coffee
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  StaffProfile,
  Skill,
  Language,
  Certification
} from '../types'
import { UserProfileType } from '../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ProfileSidebarProps {
  profile: StudentProfile | TeacherProfile | ParentProfile | StaffProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
}

interface SidebarSection {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================================================
// Utility Functions
// ============================================================================

// Get icon for hobby/interest
const getHobbyIcon = (hobby: string) => {
  const lowercased = hobby.toLowerCase()
  if (lowercased.includes('music')) return <Music className="h-4 w-4" />
  if (lowercased.includes('art') || lowercased.includes('draw')) return <Palette className="h-4 w-4" />
  if (lowercased.includes('game') || lowercased.includes('gaming')) return <Gamepad2 className="h-4 w-4" />
  if (lowercased.includes('photo')) return <Camera className="h-4 w-4" />
  if (lowercased.includes('travel')) return <Plane className="h-4 w-4" />
  if (lowercased.includes('read')) return <BookOpen className="h-4 w-4" />
  return <Heart className="h-4 w-4" />
}

// Get skill level color
const getSkillLevelColor = (level: string) => {
  switch (level) {
    case 'expert':
      return 'bg-chart-5'
    case 'advanced':
      return 'bg-chart-4'
    case 'intermediate':
      return 'bg-chart-3'
    case 'beginner':
      return 'bg-chart-2'
    default:
      return 'bg-chart-1'
  }
}

// Get skill level percentage
const getSkillLevelPercentage = (level: string) => {
  switch (level) {
    case 'expert':
      return 100
    case 'advanced':
      return 75
    case 'intermediate':
      return 50
    case 'beginner':
      return 25
    default:
      return 0
  }
}

// ============================================================================
// Student Sidebar Content
// ============================================================================

function StudentSidebarContent({ profile }: { profile: StudentProfile }) {
  const { student, academicInfo, skillsAndInterests, performance } = profile

  return (
    <>
      {/* Academic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {academicInfo.currentYearLevel && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Grade</span>
              <span className="font-medium">{academicInfo.currentYearLevel}</span>
            </div>
          )}
          {academicInfo.currentSection && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Section</span>
              <span className="font-medium">{academicInfo.currentSection}</span>
            </div>
          )}
          {academicInfo.rollNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Roll No</span>
              <span className="font-medium">{academicInfo.rollNumber}</span>
            </div>
          )}
          {academicInfo.gpa && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GPA</span>
              <span className="font-medium">{academicInfo.gpa.toFixed(2)}</span>
            </div>
          )}
          {academicInfo.rank && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rank</span>
              <span className="font-medium">#{academicInfo.rank}</span>
            </div>
          )}
          {academicInfo.house && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">House</span>
              <Badge variant="secondary">{academicInfo.house}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-medium">{performance.attendanceRate}%</span>
            </div>
            <Progress value={performance.attendanceRate} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Assignments</span>
              <span className="font-medium">{performance.assignmentCompletionRate}%</span>
            </div>
            <Progress value={performance.assignmentCompletionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {skillsAndInterests.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skillsAndInterests.skills.slice(0, 5).map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    {skill.name}
                    {skill.verified && <Shield className="h-3 w-3 text-blue-500" />}
                  </span>
                  <span className="text-xs text-muted-foreground">{skill.endorsements} endorsements</span>
                </div>
                <Progress
                  value={getSkillLevelPercentage(skill.level)}
                  className={cn("h-2", getSkillLevelColor(skill.level))}
                />
              </div>
            ))}
            {skillsAndInterests.skills.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full">
                View all {skillsAndInterests.skills.length} skills
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {skillsAndInterests.languages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {skillsAndInterests.languages.map((lang, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{lang.name}</span>
                <Badge variant="outline" className="text-xs">
                  {lang.proficiency}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interests & Hobbies */}
      {(skillsAndInterests.interests.length > 0 || skillsAndInterests.hobbies.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Interests & Hobbies
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...skillsAndInterests.interests, ...skillsAndInterests.hobbies].map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {getHobbyIcon(item)}
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {skillsAndInterests.certifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillsAndInterests.certifications.slice(0, 3).map((cert, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm font-medium">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                {cert.credentialId && (
                  <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                )}
              </div>
            ))}
            {skillsAndInterests.certifications.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full">
                View all certifications
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ============================================================================
// Teacher Sidebar Content
// ============================================================================

function TeacherSidebarContent({ profile }: { profile: TeacherProfile }) {
  const { teacher, professionalInfo, teachingMetrics, schedule } = profile

  return (
    <>
      {/* Professional Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-medium">{professionalInfo.employeeId}</span>
          </div>
          {professionalInfo.designation && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">{professionalInfo.designation}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Experience</span>
            <span className="font-medium">{professionalInfo.totalExperience} years</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{professionalInfo.employmentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Teaching Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Students Taught</span>
            <span className="font-medium">{teachingMetrics.totalStudentsTaught}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Classes</span>
            <span className="font-medium">{teachingMetrics.totalClassesAssigned}</span>
          </div>
          {teachingMetrics.averageStudentRating && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rating</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="font-medium">{teachingMetrics.averageStudentRating.toFixed(1)}</span>
              </span>
            </div>
          )}
          {teachingMetrics.passRate && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Pass Rate</span>
                <span className="font-medium">{teachingMetrics.passRate}%</span>
              </div>
              <Progress value={teachingMetrics.passRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specializations */}
      {professionalInfo.specializations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Specializations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {professionalInfo.specializations.map((spec, index) => (
              <Badge key={index} variant="secondary">
                {spec}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Research Interests */}
      {professionalInfo.researchInterests && professionalInfo.researchInterests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Research Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {professionalInfo.researchInterests.map((interest, index) => (
              <Badge key={index} variant="outline">
                {interest}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Office Hours */}
      {schedule.officeHours && schedule.officeHours.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Office Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedule.officeHours.map((hour, index) => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              return (
                <div key={index} className="text-sm">
                  <div className="font-medium">{days[hour.dayOfWeek]}</div>
                  <div className="text-muted-foreground">
                    {hour.startTime} - {hour.endTime}
                    {hour.location && <span> ({hour.location})</span>}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ============================================================================
// Parent Sidebar Content
// ============================================================================

function ParentSidebarContent({ profile }: { profile: ParentProfile }) {
  const { guardian, familyInfo, engagement, childrenOverview } = profile

  return (
    <>
      {/* Family Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Relationship</span>
            <span className="font-medium">{familyInfo.relationship}</span>
          </div>
          {familyInfo.occupation && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Occupation</span>
              <span className="font-medium">{familyInfo.occupation}</span>
            </div>
          )}
          {familyInfo.employer && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employer</span>
              <span className="font-medium">{familyInfo.employer}</span>
            </div>
          )}
          <div className="flex gap-2">
            {familyInfo.emergencyContact && (
              <Badge variant="destructive" className="text-xs">Emergency</Badge>
            )}
            {familyInfo.primaryContact && (
              <Badge variant="secondary" className="text-xs">Primary</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Children ({childrenOverview.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {childrenOverview.map((child, index) => (
            <div key={index} className="space-y-1 p-2 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">{child.name}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{child.grade} - {child.section}</span>
                <Badge
                  variant={child.academicPerformance === 'excellent' ? 'default' :
                          child.academicPerformance === 'good' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {child.academicPerformance}
                </Badge>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Attendance:</span> {child.attendanceRate}%
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Engagement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4" />
            School Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meetings</span>
            <span className="font-medium">{engagement.meetingsAttended}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Events</span>
            <span className="font-medium">{engagement.eventsParticipated}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volunteer Hours</span>
            <span className="font-medium">{engagement.volunteerHours}</span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ============================================================================
// Staff Sidebar Content
// ============================================================================

function StaffSidebarContent({ profile }: { profile: StaffProfile }) {
  const { staffInfo, workMetrics, schedule } = profile

  return (
    <>
      {/* Staff Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-medium">{staffInfo.employeeId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Department</span>
            <span className="font-medium">{staffInfo.department}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{staffInfo.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">{staffInfo.employmentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Work Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Work Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tasks Completed</span>
            <span className="font-medium">{workMetrics.tasksCompleted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">In Progress</span>
            <span className="font-medium">{workMetrics.tasksInProgress}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projects</span>
            <span className="font-medium">{workMetrics.projectsHandled}</span>
          </div>
          {workMetrics.efficiency && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="font-medium">{workMetrics.efficiency}%</span>
              </div>
              <Progress value={workMetrics.efficiency} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsibilities */}
      {staffInfo.responsibilities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {staffInfo.responsibilities.slice(0, 5).map((resp, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
            {staffInfo.responsibilities.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View all responsibilities
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Working Hours</span>
            <span className="font-medium">{schedule.workingHours}</span>
          </div>
          {schedule.currentShift && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Shift</span>
              <span className="font-medium">{schedule.currentShift}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Availability</span>
            <Badge
              variant={schedule.availability === 'available' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {schedule.availability}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileSidebar({
  profile,
  dictionary,
  lang = 'en',
  className
}: ProfileSidebarProps) {

  // Render appropriate sidebar content based on profile type
  const renderContent = () => {
    switch (profile.type) {
      case UserProfileType.STUDENT:
        return <StudentSidebarContent profile={profile as StudentProfile} />
      case UserProfileType.TEACHER:
        return <TeacherSidebarContent profile={profile as TeacherProfile} />
      case UserProfileType.PARENT:
        return <ParentSidebarContent profile={profile as ParentProfile} />
      case UserProfileType.STAFF:
        return <StaffSidebarContent profile={profile as StaffProfile} />
      default:
        return null
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Profile Completion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{profile.completionPercentage}%</span>
            </div>
            <Progress value={profile.completionPercentage} className="h-2" />
            {profile.completionPercentage < 100 && (
              <p className="text-xs text-muted-foreground">
                Complete your profile to unlock all features
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Type-specific content */}
      {renderContent()}
    </div>
  )
}