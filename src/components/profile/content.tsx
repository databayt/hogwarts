"use client"

import { useState } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  LayoutGrid,
  BookOpen,
  FolderKanban,
  Award,
  Star,
  GraduationCap,
  Users,
  Calendar,
  Briefcase
} from "lucide-react"
import ProfileSidebar from "./profile-sidebar"
import PinnedItems from "./pinned-items"
import ActivityGraph from "./activity-graph"
import ActivityOverview from "./activity-overview"
import StudentDashboard from "./student"
import TeacherDashboard from "./teacher"
import StaffDashboard from "./staff"
import ParentDashboard from "./parent"
import type { Locale } from "@/components/internationalization/config"
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
    { id: "overview", label: "Overview", icon: <LayoutGrid className="size-4" /> },
    { id: "courses", label: "Courses", count: 8, icon: <BookOpen className="size-4" /> },
    { id: "projects", label: "Projects", count: 12, icon: <FolderKanban className="size-4" /> },
    { id: "achievements", label: "Achievements", count: 5, icon: <Award className="size-4" /> },
    { id: "awards", label: "Awards", count: 2, icon: <Star className="size-4" /> },
  ],
  teacher: [
    { id: "overview", label: "Overview", icon: <LayoutGrid className="size-4" /> },
    { id: "classes", label: "Classes", count: 6, icon: <Users className="size-4" /> },
    { id: "schedule", label: "Schedule", icon: <Calendar className="size-4" /> },
    { id: "achievements", label: "Awards", count: 4, icon: <Award className="size-4" /> },
    { id: "resources", label: "Resources", count: 15, icon: <BookOpen className="size-4" /> },
  ],
  parent: [
    { id: "overview", label: "Overview", icon: <LayoutGrid className="size-4" /> },
    { id: "children", label: "Children", count: 3, icon: <GraduationCap className="size-4" /> },
    { id: "events", label: "Events", count: 5, icon: <Calendar className="size-4" /> },
    { id: "communications", label: "Messages", count: 8, icon: <Star className="size-4" /> },
  ],
  staff: [
    { id: "overview", label: "Overview", icon: <LayoutGrid className="size-4" /> },
    { id: "tasks", label: "Tasks", count: 24, icon: <FolderKanban className="size-4" /> },
    { id: "department", label: "Department", icon: <Briefcase className="size-4" /> },
    { id: "reports", label: "Reports", count: 8, icon: <BookOpen className="size-4" /> },
  ],
}

export default function ProfileContent({ role, data, dictionary, lang }: Props) {
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

  const formatCurrentDate = () => {
    const now = new Date()
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const MainContent = () => (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border">
          <TabsList className="h-auto bg-transparent p-0 gap-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2 transition-colors hover:text-foreground"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ms-1">
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
          <div className="rounded-lg border border-border p-6">
            <ActivityGraph role={role} data={data} />
          </div>

          {/* Activity Overview */}
          <ActivityOverview role={role} data={data} />

          {/* Activity Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">{formatCurrentDate()}</h3>
            <div className="text-center py-8 text-muted-foreground">
              <p>No activity recorded for this period.</p>
            </div>
            <button className="w-full bg-muted border border-border rounded-lg py-3 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors">
              Show more activity
            </button>
          </div>
        </TabsContent>

        {/* Other Tabs - Show Role Dashboard */}
        {tabs.slice(1).map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {getRoleDashboard()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer Help Link */}
      <p className="text-sm text-muted-foreground text-center pb-6">
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
      <div className="max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
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
