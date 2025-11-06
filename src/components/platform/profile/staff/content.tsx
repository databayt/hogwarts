/**
 * Staff Profile Content Component
 * Comprehensive staff member profile with administrative features
 */

"use client"

import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ProfileHeader } from '../shared/profile-header'
import { ProfileHeaderCompact } from '../shared/profile-header-compact'
import { ProfileGitHubLayout } from '../shared/profile-github-layout'
import { ProfileSidebar } from '../shared/profile-sidebar'
import { ContributionGraph } from '../shared/contribution-graph'
import { ActivityTimeline } from '../shared/activity-timeline'
import { OverviewTab } from './tabs/overview-tab'
import { ResponsibilitiesTab } from './tabs/responsibilities-tab'
import { ScheduleTab } from './tabs/schedule-tab'
import { TasksTab } from './tabs/tasks-tab'
import { ReportsTab } from './tabs/reports-tab'
import { SettingsTab } from './tabs/settings-tab'
import { useProfile, useProfileActivity, useProfileContributions } from '../hooks'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { StaffProfile, ConnectionStatus } from '../types'
import { UserProfileType } from '../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

// ============================================================================
// Types
// ============================================================================

interface StaffProfileContentProps {
  staffId?: string
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  className?: string
}

interface TabConfig {
  id: string
  label: string
  badge?: number
}

// ============================================================================
// Mock Data (temporary until API is ready)
// ============================================================================

const generateMockStaffProfile = (): any => ({
  id: 'staff-1',
  type: UserProfileType.STAFF,
  userId: 'user-4',
  schoolId: 'school-1',
  displayName: 'Michael Anderson',
  email: 'michael.anderson@hogwarts.edu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&h=400&fit=crop',
  bio: 'Experienced administrative professional with 8+ years in educational institution management. Passionate about creating efficient systems and supporting school operations.',

  phone: '+1 234 567 8905',
  address: '200 Admin Building',
  city: 'New York',
  state: 'New York',
  country: 'United States',
  postalCode: '10001',

  socialLinks: {
    linkedin: 'https://linkedin.com/in/michaelanderson',
    email: 'michael.anderson@hogwarts.edu'
  },

  joinedAt: new Date('2016-03-15'),
  lastActive: new Date(),
  isOnline: true,
  visibility: 'SCHOOL' as any,
  completionPercentage: 92,

  settings: {
    theme: 'system',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowConnectionRequests: true
  },

  activityStats: {
    totalViews: 678,
    totalConnections: 89,
    totalPosts: 25,
    totalAchievements: 12,
    contributionStreak: 23,
    lastContribution: new Date()
  },

  recentActivity: [
    {
      id: '1',
      type: 'TASK_COMPLETED' as any,
      title: 'Completed monthly financial report',
      description: 'Finance department report for February 2024',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'DOCUMENT_CREATED' as any,
      title: 'Created staff meeting agenda',
      description: 'Agenda for weekly staff meeting',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'SYSTEM_UPDATE' as any,
      title: 'Updated payroll records',
      description: 'Processed March 2024 payroll',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: { count: 45 }
    }
  ],

  staff: {
    id: 'staff-1',
    employeeId: 'EMP2016003',
    schoolId: 'school-1',
    givenName: 'Michael',
    surname: 'Anderson',
    gender: 'MALE',
    emailAddress: 'michael.anderson@hogwarts.edu',
    birthDate: new Date('1980-07-20'),
    joiningDate: new Date('2016-03-15'),
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    createdAt: new Date('2016-03-15'),
    updatedAt: new Date()
  } as any,

  staffInfo: {
    employeeId: 'EMP2016003',
    department: 'Finance & Administration',
    designation: 'Senior Administrative Officer',
    role: 'ACCOUNTANT',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    joiningDate: new Date('2016-03-15'),
    reportingTo: 'Principal Williams',
    yearsOfService: 8,
    skills: ['Financial Management', 'Excel', 'QuickBooks', 'Reporting', 'Budget Planning', 'Data Analysis'],
    certifications: [
      {
        name: 'Certified Public Accountant (CPA)',
        issuer: 'AICPA',
        date: new Date('2018-06-15'),
        expiry: new Date('2025-06-15')
      },
      {
        name: 'Advanced Excel Certification',
        issuer: 'Microsoft',
        date: new Date('2020-03-10')
      }
    ]
  } as any,

  responsibilities: {
    primary: [
      'Manage school financial records and accounts',
      'Process monthly payroll for all staff',
      'Prepare financial reports for board meetings',
      'Monitor budget compliance across departments'
    ],
    secondary: [
      'Assist with procurement processes',
      'Support HR with employee documentation',
      'Coordinate with external auditors',
      'Maintain vendor relationships'
    ],
    committees: ['Finance Committee', 'Budget Planning Committee', 'IT Committee']
  },

  workMetrics: {
    tasksCompleted: 234,
    tasksInProgress: 12,
    tasksPending: 8,
    averageCompletionTime: 2.5, // days
    onTimeCompletionRate: 94.5,
    reportsGenerated: 48,
    documentsProcessed: 567,
    meetingsAttended: 89
  } as any,

  schedule: {
    workingHours: '8:30 AM - 5:00 PM',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    breakTime: '12:30 PM - 1:30 PM',
    currentAvailability: 'available',
    upcomingLeave: [],
    officeLocation: 'Admin Building, Room 204'
  } as any,

  contributionData: {
    totalContributions: 345,
    currentStreak: 23,
    longestStreak: 45,
    contributions: generateMockContributions(),
    monthlyStats: [
      {
        month: '2024-02',
        totalContributions: 56,
        averagePerDay: 2,
        mostActiveDay: '2024-02-15',
        categories: {
          academic: 0,
          extracurricular: 0,
          social: 10,
          other: 46
        }
      }
    ]
  }
})

// Generate mock contribution data
function generateMockContributions() {
  const contributions = []
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const count = Math.floor(Math.random() * 8)
    contributions.push({
      date: date.toISOString().split('T')[0],
      count,
      level: Math.min(4, Math.floor(count / 2)) as any,
      details: {
        assignments: 0,
        attendance: 1,
        activities: Math.floor(Math.random() * count),
        achievements: Math.random() > 0.95 ? 1 : 0
      }
    })
  }
  return contributions.reverse()
}

// ============================================================================
// Component
// ============================================================================

export function StaffProfileContent({
  staffId,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: StaffProfileContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { open: sidebarOpen } = useSidebar()

  // Use mock data for now (replace with real API calls)
  const profile = useMemo(() => generateMockStaffProfile(), [])
  const isLoading = false
  const error = null

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'responsibilities', label: 'Responsibilities' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'tasks', label: 'Tasks', badge: 12 },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ]

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive">Failed to load profile</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  // Tabs content component (reusable for both layouts)
  const tabsContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* PageNav-style navigation */}
      <div className="border-b">
        <ScrollArea className="max-w-[600px] lg:max-w-none">
          <nav className="flex items-center gap-6 rtl:flex-row-reverse">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-1 pb-3 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
                {tab.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </nav>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* GitHub-style contribution graph */}
        <ContributionGraph
          data={profile.contributionData}
          dictionary={dictionary}
          lang={lang}
          onDayClick={(date) => console.log('Day clicked:', date)}
        />

        {/* Recent Activity */}
        <ActivityTimeline
          activities={profile.recentActivity}
          dictionary={dictionary}
          lang={lang}
          onActivityClick={(activity) => console.log('Activity clicked:', activity)}
          maxItems={10}
        />

        {/* Overview Tab Content */}
        <OverviewTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="responsibilities">
        <ResponsibilitiesTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="schedule">
        <ScheduleTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="tasks">
        <TasksTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="reports">
        <ReportsTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>
    </Tabs>
  )

  // Sidebar ON: Compact horizontal layout
  if (sidebarOpen) {
    return (
      <div className={cn('space-y-0', className)}>
        {/* Compact Profile Header */}
        <ProfileHeaderCompact
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
          connectionStatus={isOwner ? undefined : 'none'}
          onEdit={() => console.log('Edit profile')}
          onConnect={() => console.log('Connect')}
          onMessage={() => console.log('Message')}
          onShare={() => console.log('Share')}
          onFollow={() => console.log('Follow')}
        />

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {tabsContent}
        </div>
      </div>
    )
  }

  // Sidebar OFF: Full GitHub layout
  return (
    <div className={cn('', className)}>
      <ProfileGitHubLayout
        profile={profile}
        dictionary={dictionary}
        lang={lang}
        isOwner={isOwner}
        connectionStatus={isOwner ? undefined : 'none'}
        onEdit={() => console.log('Edit profile')}
        onConnect={() => console.log('Connect')}
        onMessage={() => console.log('Message')}
        onShare={() => console.log('Share')}
        onFollow={() => console.log('Follow')}
      >
        {tabsContent}
      </ProfileGitHubLayout>
    </div>
  )
}