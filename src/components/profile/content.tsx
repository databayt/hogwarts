"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  OcticonBook,
  OcticonPackage,
  OcticonRepo,
  OcticonStar,
  OcticonTable,
} from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"

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
  isOwner?: boolean
  userId?: string
}

// Tab configurations per role
const ROLE_TABS: Record<ProfileRole, ProfileTab[]> = {
  student: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "courses",
      label: "Courses",
      count: 8,
      icon: <OcticonRepo className="size-4" />,
    },
    {
      id: "projects",
      label: "Projects",
      count: 12,
      icon: <OcticonTable className="size-4" />,
    },
    {
      id: "achievements",
      label: "Achievements",
      count: 5,
      icon: <OcticonPackage className="size-4" />,
    },
    {
      id: "awards",
      label: "Awards",
      count: 2,
      icon: <OcticonStar className="size-4" />,
    },
  ],
  teacher: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "classes",
      label: "Classes",
      count: 6,
      icon: <OcticonRepo className="size-4" />,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: <OcticonTable className="size-4" />,
    },
    {
      id: "achievements",
      label: "Awards",
      count: 4,
      icon: <OcticonStar className="size-4" />,
    },
    {
      id: "resources",
      label: "Resources",
      count: 15,
      icon: <OcticonPackage className="size-4" />,
    },
  ],
  parent: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "children",
      label: "Children",
      count: 3,
      icon: <OcticonRepo className="size-4" />,
    },
    {
      id: "events",
      label: "Events",
      count: 5,
      icon: <OcticonTable className="size-4" />,
    },
    {
      id: "communications",
      label: "Messages",
      count: 8,
      icon: <OcticonStar className="size-4" />,
    },
  ],
  staff: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "tasks",
      label: "Tasks",
      count: 24,
      icon: <OcticonRepo className="size-4" />,
    },
    {
      id: "department",
      label: "Department",
      icon: <OcticonTable className="size-4" />,
    },
    {
      id: "reports",
      label: "Reports",
      count: 8,
      icon: <OcticonPackage className="size-4" />,
    },
  ],
}

export default function ProfileContent({
  role,
  data,
  dictionary,
  lang,
  isOwner = false,
  userId,
}: Props) {
  const { isMobile } = useSidebar()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const years = Array.from(
    { length: 11 },
    (_, i) => new Date().getFullYear() - i
  )

  // Determine layout: stacked on mobile or when sidebar is expanded
  const useMobileLayout = isMobile

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
      {/* Notification Banner */}
      {isOwner && (
        <div className="rounded-lg border border-[#54aeff] bg-[#ddf4ff] p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-muted-foreground text-sm">
            You unlocked new Achievements with private contributions!{" "}
            <a href="#" className="text-primary hover:underline">
              Show them off
            </a>{" "}
            by including private contributions in your Profile in{" "}
            <a href="#" className="text-primary hover:underline">
              settings
            </a>
            .
          </p>
        </div>
      )}

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

          {/* Content + Year Column */}
          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-6">
              {/* Contribution Graph */}
              <div className="border-border rounded-lg border p-6">
                <ContributionGraph
                  role={role}
                  userId={userId}
                  isOwner={isOwner}
                />
              </div>

              {/* Contribution Activity */}
              <ContributionActivity
                role={role}
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>
            <div className="hidden w-24 flex-col gap-1 pt-2 sm:flex">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`rounded px-3 py-1 text-start text-xs transition-colors ${
                    selectedYear === year
                      ? "bg-[#0969da] font-medium text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
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
          // Mobile layout: Stack vertically
          <div className="flex flex-col gap-6 px-4 pb-6">
            {/* Profile Sidebar - Left-aligned when stacked */}
            <div className="flex justify-start">
              <ProfileSidebar role={role} data={data} isOwner={isOwner} />
            </div>

            {/* Main Content - Full width below */}
            <div className="w-full">
              <MainContent />
            </div>
          </div>
        ) : (
          // Desktop layout: Side by side
          <div className="grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-4 lg:px-0">
            {/* Left Sidebar */}
            <div className="min-w-0 lg:col-span-1">
              <ProfileSidebar role={role} data={data} isOwner={isOwner} />
            </div>

            {/* Main Content */}
            <div className="min-w-0 lg:col-span-3">
              <MainContent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
