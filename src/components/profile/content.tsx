"use client"

import { useState } from "react"
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  Star,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"

import ActivityOverview from "./activity-overview"
import ContributionActivity from "./contribution-activity"
import ContributionGraph from "./contribution-graph"
import ParentDashboard from "./parent"
import PinnedItems from "./pinned-items"
import ProfileSidebar from "./profile-sidebar"
import StaffDashboard from "./staff"
import StudentDashboard from "./student"
import TeacherDashboard from "./teacher"
import type { ProfileRole, ProfileTab } from "./types"

interface Props {
  role: ProfileRole
  data: Record<string, unknown>
  dictionary?: Record<string, unknown>
  lang?: Locale
}

// Tab configurations per role
const ROLE_TABS: Record<ProfileRole, ProfileTab[]> = {
  student: [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutGrid className="size-4" />,
    },
    {
      id: "courses",
      label: "Courses",
      count: 8,
      icon: <BookOpen className="size-4" />,
    },
    {
      id: "projects",
      label: "Projects",
      count: 12,
      icon: <FolderKanban className="size-4" />,
    },
    {
      id: "achievements",
      label: "Achievements",
      count: 5,
      icon: <Award className="size-4" />,
    },
    {
      id: "awards",
      label: "Awards",
      count: 2,
      icon: <Star className="size-4" />,
    },
  ],
  teacher: [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutGrid className="size-4" />,
    },
    {
      id: "classes",
      label: "Classes",
      count: 6,
      icon: <Users className="size-4" />,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <Calendar className="size-4" />,
    },
    {
      id: "achievements",
      label: "Awards",
      count: 4,
      icon: <Award className="size-4" />,
    },
    {
      id: "resources",
      label: "Resources",
      count: 15,
      icon: <BookOpen className="size-4" />,
    },
  ],
  parent: [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutGrid className="size-4" />,
    },
    {
      id: "children",
      label: "Children",
      count: 3,
      icon: <GraduationCap className="size-4" />,
    },
    {
      id: "events",
      label: "Events",
      count: 5,
      icon: <Calendar className="size-4" />,
    },
    {
      id: "communications",
      label: "Messages",
      count: 8,
      icon: <Star className="size-4" />,
    },
  ],
  staff: [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutGrid className="size-4" />,
    },
    {
      id: "tasks",
      label: "Tasks",
      count: 24,
      icon: <FolderKanban className="size-4" />,
    },
    {
      id: "department",
      label: "Department",
      icon: <Briefcase className="size-4" />,
    },
    {
      id: "reports",
      label: "Reports",
      count: 8,
      icon: <BookOpen className="size-4" />,
    },
  ],
}

export default function ProfileContent({
  role,
  data,
  dictionary,
  lang,
}: Props) {
  const { open, isMobile } = useSidebar()
  const [activeTab, setActiveTab] = useState("overview")

  // Determine layout: stacked on mobile or when sidebar is expanded
  const useMobileLayout = isMobile || open

  const tabs = ROLE_TABS[role] || ROLE_TABS.student

  const getRoleDashboard = () => {
    switch (role) {
      case "student":
        return <StudentDashboard data={data} />
      case "teacher":
        return <TeacherDashboard data={data} />
      case "staff":
        return <StaffDashboard data={data} />
      case "parent":
        return <ParentDashboard data={data} />
      default:
        return null
    }
  }

  const MainContent = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-border border-b">
          <TabsList className="h-auto gap-0 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary hover:text-foreground relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-colors data-[state=active]:bg-transparent"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge
                    variant="secondary"
                    className="ms-1 h-5 px-1.5 text-[10px]"
                  >
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Pinned Section */}
          <PinnedItems role={role} data={data} />

          {/* Activity Graph */}
          <div className="border-border rounded-lg border p-6">
            <ContributionGraph role={role} data={data} />
          </div>

          {/* Contribution Activity Timeline */}
          <ContributionActivity role={role} data={data} />

          {/* Activity Overview with pie chart */}
          <ActivityOverview role={role} data={data} />
        </TabsContent>

        {/* Other Tabs - Show Role Dashboard */}
        {tabs.slice(1).map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {getRoleDashboard()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer Help Link */}
      <p className="text-muted-foreground pb-6 text-center text-sm">
        Need help navigating the system? Check out the{" "}
        <a href="#" className="text-primary hover:underline">
          school portal guide
        </a>
        .
      </p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        {useMobileLayout ? (
          // Mobile/Expanded sidebar layout: Stack vertically
          <div className="flex flex-col gap-6 pb-6">
            {/* Profile Sidebar - Left-aligned when stacked */}
            <div className="flex justify-start">
              <ProfileSidebar role={role} data={data} />
            </div>

            {/* Main Content - Full width below */}
            <div className="w-full">
              <MainContent />
            </div>
          </div>
        ) : (
          // Desktop Collapsed sidebar layout: Side by side
          <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-4">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <ProfileSidebar role={role} data={data} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <MainContent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
