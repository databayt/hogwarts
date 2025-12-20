/**
 * Teacher Profile Content Component - GitHub-Inspired Layout
 *
 * Displays comprehensive teacher profile with activity streams and contribution graphs:
 * - Profile header: avatar, name, bio, location, online status
 * - Sidebar: stats (views, connections, posts), settings, social links
 * - Contribution graph: calendar heatmap of activity over time
 * - Activity timeline: chronological feed of teaching activities
 * - Six tabbed sections: Overview, Classes, Schedule, Qualifications, Publications, Reviews
 * - Responsive layout: sidebar collapses on mobile, tabs stack vertically
 *
 * Data flow:
 * - Server renders teacher data and passes as props
 * - Client manages tab state and sidebar collapse state
 * - Uses mock data generator (temporary) until API endpoints ready
 * - Lazy-loads expensive components (ActivityTimeline, ContributionGraph) via dynamic import
 *
 * Client hooks used:
 * - useProfile() - manages user context (owner vs visitor)
 * - useProfileActivity() - fetches activity timeline data
 * - useProfileContributions() - calculates contribution graph data
 * - useSidebar() - responds to sidebar state changes
 *
 * Design rationale:
 * - GitHub-style layout is familiar to tech-savvy educators and developers
 * - Activity graph shows engagement patterns (teaching consistency)
 * - Two-column layout scales responsively without complex logic
 */

"use client"

import React, { useMemo, useState } from "react"
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Star,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  useProfile,
  useProfileActivity,
  useProfileContributions,
  useServerActivity,
  useServerContributions,
  useServerPinnedItems,
} from "../hooks"
import { ActivityTimeline } from "../shared/activity-timeline"
import { ContributionGraph } from "../shared/contribution-graph"
import { PinnedItems } from "../shared/pinned-items"
import { ProfileGitHubLayout } from "../shared/profile-github-layout"
import { ProfileHeader } from "../shared/profile-header"
import { ProfileHeaderCompact } from "../shared/profile-header-compact"
import { ProfileSidebar } from "../shared/profile-sidebar"
import type { ConnectionStatus, TeacherProfile } from "../types"
import { UserProfileType } from "../types"
import { ClassesTab } from "./tabs/classes-tab"
import { OverviewTab } from "./tabs/overview-tab"
import { PublicationsTab } from "./tabs/publications-tab"
import { QualificationsTab } from "./tabs/qualifications-tab"
import { ReviewsTab } from "./tabs/reviews-tab"
import { ScheduleTab } from "./tabs/schedule-tab"

// ============================================================================
// Types
// ============================================================================

interface TeacherProfileContentProps {
  teacherId?: string
  dictionary?: Dictionary
  lang?: "ar" | "en"
  isOwner?: boolean
  className?: string
}

interface TabConfig {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

// ============================================================================
// Mock Data (temporary until API is ready)
// ============================================================================

const generateMockTeacherProfile = (): TeacherProfile => ({
  id: "teacher-1",
  type: UserProfileType.TEACHER,
  userId: "user-2",
  schoolId: "school-1",
  displayName: "Dr. Sarah Johnson",
  email: "sarah.johnson@hogwarts.edu",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  coverImage:
    "https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=1200&h=400&fit=crop",
  bio: "Passionate educator with 10+ years of experience in Computer Science. Specializing in Programming, Data Structures, and Machine Learning. Committed to fostering innovation and critical thinking in students.",

  phone: "+1 234 567 8902",
  address: "100 Academic Hall",
  city: "New York",
  state: "New York",
  country: "United States",
  postalCode: "10001",

  socialLinks: {
    website: "https://drsarahjohnson.edu",
    linkedin: "https://linkedin.com/in/drsarahjohnson",
    github: "https://github.com/drsarahjohnson",
    twitter: "https://twitter.com/drsarahjohnson",
  },

  joinedAt: new Date("2018-08-15"),
  lastActive: new Date(),
  isOnline: true,
  visibility: "SCHOOL" as any,
  completionPercentage: 95,

  settings: {
    theme: "system",
    language: "en",
    emailNotifications: true,
    pushNotifications: true,
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowConnectionRequests: true,
  },

  activityStats: {
    totalViews: 1245,
    totalConnections: 156,
    totalPosts: 48,
    totalAchievements: 23,
    contributionStreak: 34,
    lastContribution: new Date(),
  },

  recentActivity: [
    {
      id: "1",
      type: "ASSIGNMENT_SUBMITTED" as any,
      title: "Graded 25 Programming Assignments",
      description: "CS101 - Fundamentals of Programming",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      metadata: { count: 25 },
    },
    {
      id: "2",
      type: "POST_CREATED" as any,
      title: "Published new lecture notes",
      description: "Advanced Data Structures - Trees and Graphs",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      type: "ACHIEVEMENT_EARNED" as any,
      title: 'Received "Teacher of the Month" Award',
      description: "Outstanding contribution to student learning",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      metadata: { points: 100 },
    },
  ],

  teacher: {
    id: "teacher-1",
    employeeId: "EMP2018001",
    schoolId: "school-1",
    givenName: "Sarah",
    surname: "Johnson",
    gender: "FEMALE",
    emailAddress: "sarah.johnson@hogwarts.edu",
    birthDate: new Date("1985-03-15"),
    joiningDate: new Date("2018-08-15"),
    employmentStatus: "ACTIVE",
    employmentType: "FULL_TIME",
    profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    createdAt: new Date("2018-08-15"),
    updatedAt: new Date(),
    departments: [
      {
        id: "dept-1",
        schoolId: "school-1",
        name: "Computer Science",
        code: "CS",
        headOfDepartmentId: "teacher-2",
        description: "Department of Computer Science and Engineering",
        createdAt: new Date("2018-01-01"),
        updatedAt: new Date(),
      },
    ],
    qualifications: [
      {
        id: "qual-1",
        teacherId: "teacher-1",
        schoolId: "school-1",
        degree: "Ph.D. in Computer Science",
        institution: "MIT",
        yearOfCompletion: 2015,
        specialization: "Machine Learning",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "qual-2",
        teacherId: "teacher-1",
        schoolId: "school-1",
        degree: "M.S. in Computer Science",
        institution: "Stanford University",
        yearOfCompletion: 2010,
        specialization: "Artificial Intelligence",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    experience: [
      {
        id: "exp-1",
        teacherId: "teacher-1",
        schoolId: "school-1",
        organizationName: "Tech University",
        position: "Assistant Professor",
        startDate: new Date("2015-09-01"),
        endDate: new Date("2018-07-31"),
        responsibilities:
          "Teaching undergraduate courses, research supervision",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    subjectExpertise: [
      {
        id: "expert-1",
        teacherId: "teacher-1",
        subjectId: "subject-1",
        schoolId: "school-1",
        proficiencyLevel: "EXPERT",
        yearsOfExperience: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    classes: generateMockClasses(),
  } as any,

  professionalInfo: {
    employeeId: "EMP2018001",
    designation: "Senior Professor",
    employmentType: "FULL_TIME",
    employmentStatus: "ACTIVE",
    joiningDate: new Date("2018-08-15"),
    totalExperience: 10,
    specializations: [
      "Machine Learning",
      "Data Structures",
      "Algorithms",
      "Web Development",
    ],
    researchInterests: [
      "AI in Education",
      "Adaptive Learning Systems",
      "Computer Vision",
    ],
    publications: generateMockPublications(),
  },

  teachingMetrics: {
    totalStudentsTaught: 450,
    totalClassesAssigned: 12,
    averageStudentRating: 4.8,
    feedbackCount: 234,
    passRate: 94.5,
    attendanceRate: 92.3,
  },

  schedule: {
    weeklyHours: 20,
    currentClasses: [
      {
        classId: "class-1",
        className: "CS101 - Programming Fundamentals",
        subject: "Computer Science",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        room: "Room 301",
      },
      {
        classId: "class-2",
        className: "CS201 - Data Structures",
        subject: "Computer Science",
        dayOfWeek: 3,
        startTime: "14:00",
        endTime: "15:30",
        room: "Room 205",
      },
    ],
    officeHours: [
      {
        dayOfWeek: 2,
        startTime: "14:00",
        endTime: "16:00",
        location: "Office 312",
        isOnline: false,
      },
      {
        dayOfWeek: 4,
        startTime: "15:00",
        endTime: "17:00",
        location: "Online",
        isOnline: true,
      },
    ],
    availability: "available",
  },

  contributionData: {
    totalContributions: 523,
    currentStreak: 34,
    longestStreak: 67,
    contributions: generateMockContributions(),
    monthlyStats: [
      {
        month: "2024-01",
        totalContributions: 78,
        averagePerDay: 2.5,
        mostActiveDay: "2024-01-15",
        categories: {
          academic: 50,
          extracurricular: 15,
          social: 10,
          other: 3,
        },
      },
    ],
  },
})

// Generate mock classes
function generateMockClasses() {
  return [
    {
      id: "class-1",
      schoolId: "school-1",
      name: "Programming Fundamentals",
      code: "CS101",
      subjectId: "subject-1",
      teacherId: "teacher-1",
      academicYearId: "year-1",
      termId: "term-1",
      students: [],
      subject: {
        id: "subject-1",
        schoolId: "school-1",
        name: "Computer Science",
        code: "CS",
        description: "Introduction to programming",
        creditHours: 4,
        isCore: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
}

// Generate mock publications
function generateMockPublications() {
  return [
    {
      title: "Machine Learning in Educational Technology",
      type: "journal" as const,
      publisher: "IEEE Education",
      year: 2023,
      doi: "10.1109/EDU.2023.123456",
      url: "https://doi.org/10.1109/EDU.2023.123456",
    },
    {
      title: "Adaptive Learning Systems: A Comprehensive Survey",
      type: "conference" as const,
      publisher: "ACM SIGCSE",
      year: 2022,
      url: "https://dl.acm.org/doi/10.1145/3478431.3499309",
    },
  ]
}

// Generate mock contribution data
function generateMockContributions() {
  const contributions = []
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const count = Math.floor(Math.random() * 15)
    contributions.push({
      date: date.toISOString().split("T")[0],
      count,
      level: Math.min(4, Math.floor(count / 3)) as any,
      details: {
        assignments: Math.floor(Math.random() * count),
        attendance: Math.random() > 0.3 ? 1 : 0,
        activities: Math.floor(Math.random() * count),
        achievements: Math.random() > 0.95 ? 1 : 0,
      },
    })
  }
  return contributions.reverse()
}

// ============================================================================
// Component
// ============================================================================

export function TeacherProfileContent({
  teacherId,
  dictionary,
  lang = "en",
  isOwner = false,
  className,
}: TeacherProfileContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { open: sidebarOpen } = useSidebar()

  // Use mock data for profile structure (replace with real API calls)
  const profile = useMemo(() => generateMockTeacherProfile(), [])
  const isLoading = false
  const error = null

  // Real data hooks for GitHub-style features
  const { data: contributionData } = useServerContributions(teacherId)
  const { data: pinnedItems } = useServerPinnedItems(teacherId)
  const { data: recentActivity } = useServerActivity(teacherId, 10)

  // Merge real contribution data with profile if available
  const profileWithRealData = useMemo(() => {
    if (contributionData) {
      return {
        ...profile,
        contributionData: {
          ...profile.contributionData,
          totalContributions: contributionData.totalContributions,
          contributions: contributionData.contributions,
        },
      }
    }
    return profile
  }, [profile, contributionData])

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      id: "classes",
      label: "Classes",
      icon: <Users className="h-4 w-4" />,
      badge: 12,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: "qualifications",
      label: "Qualifications",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      id: "publications",
      label: "Publications",
      icon: <BookOpen className="h-4 w-4" />,
      badge: 5,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="h-4 w-4" />,
      badge: 234,
    },
  ]

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-destructive">Failed to load profile</p>
          <p className="text-muted-foreground text-sm">
            Please try again later
          </p>
        </div>
      </div>
    )
  }

  // Tabs content component (reusable for both layouts)
  const tabsContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="relative">
            <span className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="bg-primary/10 text-primary ml-1 rounded-full px-1.5 py-0.5 text-xs">
                  {tab.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* GitHub-style pinned items */}
        <PinnedItems
          items={pinnedItems || []}
          isOwner={isOwner}
          onCustomize={() => console.log("Customize pins")}
          dictionary={dictionary}
          lang={lang}
        />

        {/* GitHub-style contribution graph */}
        <ContributionGraph
          data={profileWithRealData.contributionData}
          dictionary={dictionary}
          lang={lang}
          onDayClick={(date) => console.log("Day clicked:", date)}
        />

        {/* Recent Activity - use real data if available */}
        <ActivityTimeline
          activities={
            recentActivity?.length
              ? recentActivity.map((a) => ({
                  id: a.id,
                  type: a.activityType as any,
                  title: a.title,
                  description: a.description || undefined,
                  timestamp: new Date(a.createdAt),
                  metadata: a.metadata as Record<string, any> | undefined,
                }))
              : profileWithRealData.recentActivity
          }
          dictionary={dictionary}
          lang={lang}
          onActivityClick={(activity) =>
            console.log("Activity clicked:", activity)
          }
          maxItems={10}
        />

        {/* Overview Tab Content */}
        <OverviewTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="classes">
        <ClassesTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="schedule">
        <ScheduleTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="qualifications">
        <QualificationsTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="publications">
        <PublicationsTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewsTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>
    </Tabs>
  )

  // Sidebar ON: Compact horizontal layout
  if (sidebarOpen) {
    return (
      <div className={cn("space-y-0", className)}>
        {/* Compact Profile Header */}
        <ProfileHeaderCompact
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
          connectionStatus={isOwner ? undefined : "none"}
          onEdit={() => console.log("Edit profile")}
          onConnect={() => console.log("Connect")}
          onMessage={() => console.log("Message")}
          onShare={() => console.log("Share")}
          onFollow={() => console.log("Follow")}
          showExperience={true}
        />

        {/* Main Content */}
        <div className="space-y-6 p-6">{tabsContent}</div>
      </div>
    )
  }

  // Sidebar OFF: Full GitHub layout
  return (
    <div className={cn("", className)}>
      <ProfileGitHubLayout
        profile={profileWithRealData}
        dictionary={dictionary}
        lang={lang}
        isOwner={isOwner}
        connectionStatus={isOwner ? undefined : "none"}
        onEdit={() => console.log("Edit profile")}
        onConnect={() => console.log("Connect")}
        onMessage={() => console.log("Message")}
        onShare={() => console.log("Share")}
        onFollow={() => console.log("Follow")}
      >
        {tabsContent}
      </ProfileGitHubLayout>
    </div>
  )
}
