/**
 * Student Profile Content Component
 * Comprehensive GitHub-inspired student profile with all features
 */

"use client"

import React, { useMemo, useState } from "react"
import {
  Activity,
  BookOpen,
  Calendar,
  FileText,
  LayoutGrid,
  Star,
  Trophy,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
import type { ConnectionStatus, StudentProfile } from "../types"
import { AcademicTab } from "./tabs/academic-tab"
import { AchievementsTab } from "./tabs/achievements-tab"
import { ActivitiesTab } from "./tabs/activities-tab"
import { ConnectionsTab } from "./tabs/connections-tab"
import { DocumentsTab } from "./tabs/documents-tab"
import { OverviewTab } from "./tabs/overview-tab"

// ============================================================================
// Types
// ============================================================================

interface StudentProfileContentProps {
  studentId?: string
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

const generateMockStudentProfile = (): StudentProfile => ({
  id: "student-1",
  type: "STUDENT" as any,
  userId: "user-1",
  schoolId: "school-1",
  displayName: "Emma J. Parker",
  email: "emmaparker@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  coverImage:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop",
  bio: "Passionate computer science student with a love for coding and problem-solving. Always eager to learn new technologies and collaborate on innovative projects.",

  phone: "+1 234 567 8901",
  address: "350 5th Avenue, Suite 2300",
  city: "New York",
  state: "New Jersey",
  country: "United States",
  postalCode: "10118",

  socialLinks: {
    website: "https://emmaparker.dev",
    github: "https://github.com/emmaparker",
    linkedin: "https://linkedin.com/in/emmaparker",
    twitter: "https://twitter.com/emmaparker",
  },

  joinedAt: new Date("2022-09-01"),
  lastActive: new Date(),
  isOnline: true,
  visibility: "SCHOOL" as any,
  completionPercentage: 85,

  settings: {
    theme: "system",
    language: "en",
    emailNotifications: true,
    pushNotifications: true,
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowConnectionRequests: true,
  },

  activityStats: {
    totalViews: 342,
    totalConnections: 47,
    totalPosts: 23,
    totalAchievements: 15,
    contributionStreak: 12,
    lastContribution: new Date(),
  },

  recentActivity: [
    {
      id: "1",
      type: "ASSIGNMENT_SUBMITTED" as any,
      title: "Submitted Programming Assignment #5",
      description: "Fundamentals of Programming using C",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { score: 95 },
    },
    {
      id: "2",
      type: "ACHIEVEMENT_EARNED" as any,
      title: 'Earned "Perfect Attendance" Badge',
      description: "100% attendance for Fall semester",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: { points: 50 },
    },
    {
      id: "3",
      type: "COURSE_ENROLLED" as any,
      title: "Enrolled in Advanced Web Development",
      description: "Spring 2024 Semester",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ],

  student: {
    id: "student-1",
    grNumber: "GR2022001",
    admissionNumber: "ADM2022001",
    schoolId: "school-1",
    givenName: "Emma",
    middleName: "J",
    surname: "Parker",
    dateOfBirth: new Date("2006-06-05"),
    gender: "FEMALE",
    bloodGroup: "A_POSITIVE",
    nationality: "American",
    email: "emmaparker@example.com",
    mobileNumber: "+1 234 567 8901",
    currentAddress: "350 5th Avenue, Suite 2300, New York, NY",
    permanentAddress: "350 5th Avenue, Suite 2300, New York, NY",
    city: "New York",
    state: "New York",
    country: "United States",
    postalCode: "10118",
    profilePhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    status: "ACTIVE",
    studentType: "REGULAR",
    createdAt: new Date("2022-09-01"),
    updatedAt: new Date(),
  } as any,

  academicInfo: {
    grNumber: "GR2022001",
    admissionNumber: "ADM2022001",
    rollNumber: "0000123456",
    currentYearLevel: "BCA-CC-Semester-1",
    currentSection: "BATCH-A",
    house: "Gryffindor",
    studentType: "REGULAR",
    enrollmentDate: new Date("2022-09-01"),
    expectedGraduation: new Date("2026-06-01"),
    gpa: 3.85,
    rank: 5,
    totalCredits: 45,
  },

  performance: {
    attendanceRate: 95,
    assignmentCompletionRate: 98,
    averageGrade: 88.5,
    subjectPerformance: [
      {
        subjectId: "1",
        subjectName: "Programming in C",
        currentGrade: 92,
        trend: "up",
        attendance: 100,
        assignmentsCompleted: 8,
        assignmentsTotal: 8,
      },
      {
        subjectId: "2",
        subjectName: "Digital Marketing",
        currentGrade: 85,
        trend: "stable",
        attendance: 95,
        assignmentsCompleted: 6,
        assignmentsTotal: 7,
      },
      {
        subjectId: "3",
        subjectName: "Mathematical Aptitude",
        currentGrade: 90,
        trend: "up",
        attendance: 93,
        assignmentsCompleted: 10,
        assignmentsTotal: 10,
      },
    ],
    strengthAreas: ["Programming", "Problem Solving", "Team Collaboration"],
    improvementAreas: ["Time Management", "Public Speaking"],
  },

  skillsAndInterests: {
    skills: [
      { name: "Python", level: "advanced", verified: true, endorsements: 12 },
      {
        name: "JavaScript",
        level: "intermediate",
        verified: true,
        endorsements: 8,
      },
      {
        name: "React",
        level: "intermediate",
        verified: false,
        endorsements: 5,
      },
      {
        name: "Data Structures",
        level: "advanced",
        verified: true,
        endorsements: 15,
      },
      {
        name: "Problem Solving",
        level: "expert",
        verified: true,
        endorsements: 20,
      },
    ],
    interests: [
      "Artificial Intelligence",
      "Web Development",
      "Mobile Apps",
      "Game Development",
    ],
    hobbies: ["Reading", "Photography", "Traveling", "Music"],
    extracurriculars: [
      "Coding Club",
      "Debate Team",
      "Robotics Club",
      "Student Council",
    ],
    languages: [
      { name: "English", proficiency: "native" },
      { name: "Spanish", proficiency: "professional" },
      { name: "French", proficiency: "conversational" },
    ],
    certifications: [
      {
        name: "Python for Data Science",
        issuer: "Coursera",
        issueDate: new Date("2023-06-15"),
        credentialId: "CERT-PY-2023-001",
        url: "https://coursera.org/verify/cert-001",
      },
      {
        name: "Web Development Bootcamp",
        issuer: "Udemy",
        issueDate: new Date("2023-08-20"),
        credentialId: "CERT-WEB-2023-002",
        url: "https://udemy.com/certificate/cert-002",
      },
    ],
  },

  contributionData: {
    totalContributions: 287,
    currentStreak: 12,
    longestStreak: 45,
    contributions: generateMockContributions(),
    monthlyStats: [
      {
        month: "2024-01",
        totalContributions: 45,
        averagePerDay: 1.5,
        mostActiveDay: "2024-01-15",
        categories: {
          academic: 25,
          extracurricular: 10,
          social: 8,
          other: 2,
        },
      },
    ],
  },
})

// Generate mock contribution data
function generateMockContributions() {
  const contributions = []
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const count = Math.floor(Math.random() * 10)
    contributions.push({
      date: date.toISOString().split("T")[0],
      count,
      level: Math.min(4, Math.floor(count / 2)) as any,
      details: {
        assignments: Math.floor(Math.random() * count),
        attendance: Math.random() > 0.3 ? 1 : 0,
        activities: Math.floor(Math.random() * count),
        achievements: Math.random() > 0.9 ? 1 : 0,
      },
    })
  }
  return contributions.reverse()
}

// ============================================================================
// Component
// ============================================================================

export function StudentProfileContent({
  studentId,
  dictionary,
  lang = "en",
  isOwner = false,
  className,
}: StudentProfileContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { open: sidebarOpen } = useSidebar()

  // Use mock data for profile structure (replace with real API calls)
  const profile = useMemo(() => generateMockStudentProfile(), [])
  const isLoading = false
  const error = null

  // Real data hooks for GitHub-style features
  const { data: contributionData, isLoading: contribLoading } =
    useServerContributions(studentId)
  const { data: pinnedItems, isLoading: pinnedLoading } =
    useServerPinnedItems(studentId)
  const { data: recentActivity, isLoading: activityLoading } =
    useServerActivity(studentId, 10)

  // Merge real contribution data with profile if available
  const profileWithRealData = useMemo(() => {
    if (contributionData) {
      return {
        ...profile,
        contributionData: {
          ...profile.contributionData,
          totalContributions: contributionData.totalContributions,
          contributions: contributionData.contributions,
          currentStreak: profile.contributionData.currentStreak,
          longestStreak: profile.contributionData.longestStreak,
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
      id: "academic",
      label: "Academic",
      icon: <BookOpen className="h-4 w-4" />,
      badge: 3,
    },
    {
      id: "activities",
      label: "Activities",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: <Trophy className="h-4 w-4" />,
      badge: 15,
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "connections",
      label: "Connections",
      icon: <Users className="h-4 w-4" />,
      badge: 47,
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
      <TabsList className="border-border/40 h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <Badge
                  variant="secondary"
                  className="ms-1.5 h-5 px-1.5 py-0 text-xs"
                >
                  {tab.badge}
                </Badge>
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
          onCustomize={() => {
            // TODO: Open pinned items customization modal
          }}
          dictionary={dictionary}
          lang={lang}
        />

        {/* GitHub-style contribution graph */}
        <ContributionGraph
          data={profileWithRealData.contributionData}
          dictionary={dictionary}
          lang={lang}
          onDayClick={() => {
            // TODO: Navigate to day's attendance/activity details
          }}
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
          onActivityClick={() => {
            // TODO: Navigate to activity details
          }}
          maxItems={10}
        />

        {/* Overview Tab Content */}
        <OverviewTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="academic">
        <AcademicTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="activities">
        <ActivitiesTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="achievements">
        <AchievementsTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab
          profile={profileWithRealData}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="connections">
        <ConnectionsTab
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
          onEdit={() => {
            // TODO: Open edit profile modal
          }}
          onConnect={() => {
            // TODO: Send connection request
          }}
          onMessage={() => {
            // TODO: Open message dialog
          }}
          onShare={() => {
            // TODO: Open share dialog
          }}
          onFollow={() => {
            // TODO: Toggle follow status
          }}
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
        onEdit={() => {
          // TODO: Open edit profile modal
        }}
        onConnect={() => {
          // TODO: Send connection request
        }}
        onMessage={() => {
          // TODO: Open message dialog
        }}
        onShare={() => {
          // TODO: Open share dialog
        }}
        onFollow={() => {
          // TODO: Toggle follow status
        }}
      >
        {tabsContent}
      </ProfileGitHubLayout>
    </div>
  )
}
