/**
 * Parent Profile Content Component
 * Comprehensive parent/guardian profile with child monitoring features
 */

"use client"

import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileHeader } from '../shared/profile-header'
import { ProfileHeaderCompact } from '../shared/profile-header-compact'
import { ProfileGitHubLayout } from '../shared/profile-github-layout'
import { ProfileSidebar } from '../shared/profile-sidebar'
import { ContributionGraph } from '../shared/contribution-graph'
import { ActivityTimeline } from '../shared/activity-timeline'
import { OverviewTab } from './tabs/overview-tab'
import { ChildrenTab } from './tabs/children-tab'
import { AcademicTab } from './tabs/academic-tab'
import { PaymentsTab } from './tabs/payments-tab'
import { CommunicationTab } from './tabs/communication-tab'
import { DocumentsTab } from './tabs/documents-tab'
import { useProfile, useProfileActivity, useProfileContributions } from '../hooks'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { ParentProfile, ConnectionStatus } from '../types'
import { UserProfileType } from '../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  LayoutGrid,
  Users,
  GraduationCap,
  CreditCard,
  MessageSquare,
  FileText,
  Bell,
  Calendar
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface ParentProfileContentProps {
  parentId?: string
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
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

const generateMockParentProfile = (): ParentProfile => ({
  id: 'parent-1',
  type: UserProfileType.PARENT,
  userId: 'user-3',
  schoolId: 'school-1',
  displayName: 'Robert Thompson',
  email: 'robert.thompson@email.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
  coverImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&h=400&fit=crop',
  bio: 'Dedicated parent of two wonderful students. Active in school community and PTA member. Passionate about supporting my children\'s educational journey.',

  phone: '+1 234 567 8903',
  address: '123 Family Lane',
  city: 'New York',
  state: 'New York',
  country: 'United States',
  postalCode: '10002',

  socialLinks: {
    linkedin: 'https://linkedin.com/in/robertthompson',
    twitter: 'https://twitter.com/robthompson'
  },

  joinedAt: new Date('2020-09-01'),
  lastActive: new Date(),
  isOnline: true,
  visibility: 'SCHOOL' as any,
  completionPercentage: 90,

  settings: {
    theme: 'system',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    showEmail: true,
    showPhone: true,
    showLocation: true,
    allowMessages: true,
    allowConnectionRequests: true
  },

  activityStats: {
    totalViews: 456,
    totalConnections: 32,
    totalPosts: 12,
    totalAchievements: 5,
    contributionStreak: 15,
    lastContribution: new Date()
  },

  recentActivity: [
    {
      id: '1',
      type: 'PAYMENT_MADE' as any,
      title: 'Made tuition payment',
      description: 'Fall semester fees for Emma Thompson',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: { amount: 5000 }
    },
    {
      id: '2',
      type: 'MESSAGE_SENT' as any,
      title: 'Messaged teacher',
      description: 'Discussed Alex\'s progress in Math',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'DOCUMENT_SIGNED' as any,
      title: 'Signed permission slip',
      description: 'Field trip authorization for Alex',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ],

  guardian: {
    id: 'guardian-1',
    schoolId: 'school-1',
    givenName: 'Robert',
    surname: 'Thompson',
    emailAddress: 'robert.thompson@email.com',
    teacherId: null,
    userId: null,
    createdAt: new Date('2020-09-01'),
    updatedAt: new Date()
  } as any,

  children: [
    {
      id: 'sg-1',
      schoolId: 'school-1',
      studentId: 'student-1',
      guardianId: 'guardian-1',
      guardianTypeId: 'gt-1',
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: {
        id: 'student-1',
        schoolId: 'school-1',
        grNumber: 'STU2021001',
        studentId: null,
        givenName: 'Alex',
        middleName: null,
        surname: 'Thompson',
        dateOfBirth: new Date('2008-06-15'),
        gender: 'MALE',
        email: 'alex.thompson@school.edu',
        enrollmentDate: new Date('2020-09-01'),
        profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any
    } as any,
    {
      id: 'sg-2',
      schoolId: 'school-1',
      studentId: 'student-2',
      guardianId: 'guardian-1',
      guardianTypeId: 'gt-1',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: {
        id: 'student-2',
        schoolId: 'school-1',
        grNumber: 'STU2021002',
        studentId: null,
        givenName: 'Emma',
        middleName: null,
        surname: 'Thompson',
        dateOfBirth: new Date('2010-03-22'),
        gender: 'FEMALE',
        email: 'emma.thompson@school.edu',
        enrollmentDate: new Date('2020-09-01'),
        profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any
    } as any
  ] as any,

  parentingInfo: {
    relationship: 'father',
    occupation: 'Software Engineer',
    employer: 'Tech Corp'
  },

  engagementMetrics: {
    meetingsAttended: 8,
    eventsParticipated: 12,
    volunteerHours: 24,
    messagesExchanged: 83
  },

  financialSummary: {
    totalDue: 10000,
    totalPaid: 7500,
    balance: 2500
  },

  contributionData: {
    totalContributions: 234,
    currentStreak: 15,
    longestStreak: 30,
    contributions: generateMockContributions(),
    monthlyStats: [
      {
        month: '2024-01',
        totalContributions: 35,
        averagePerDay: 1.1,
        mostActiveDay: '2024-01-15',
        categories: {
          academic: 20,
          extracurricular: 10,
          social: 5,
          other: 0
        }
      }
    ]
  }
} as any as ParentProfile)

// Generate mock contribution data
function generateMockContributions() {
  const contributions = []
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const count = Math.floor(Math.random() * 5)
    contributions.push({
      date: date.toISOString().split('T')[0],
      count,
      level: Math.min(4, Math.floor(count / 2)) as any,
      details: {
        assignments: 0,
        attendance: Math.random() > 0.5 ? 1 : 0,
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

export function ParentProfileContent({
  parentId,
  dictionary,
  lang = 'en',
  isOwner = false,
  className
}: ParentProfileContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { open: sidebarOpen } = useSidebar()

  // Use mock data for now (replace with real API calls)
  const profile = useMemo(() => generateMockParentProfile(), [])
  const isLoading = false
  const error = null

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="h-4 w-4" /> },
    { id: 'children', label: 'Children', icon: <Users className="h-4 w-4" />, badge: profile.children?.length || 0 },
    { id: 'academic', label: 'Academic', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" />, badge: 2 },
    { id: 'communication', label: 'Messages', icon: <MessageSquare className="h-4 w-4" />, badge: 5 },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> }
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
      <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="relative"
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {tab.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))
      }</TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* GitHub-style contribution graph */}
        <ContributionGraph
          data={(profile.contributionData || []) as any}
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

      <TabsContent value="children">
        <ChildrenTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="academic">
        <AcademicTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
        />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="communication">
        <CommunicationTab
          profile={profile}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab
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