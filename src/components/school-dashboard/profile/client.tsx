"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  OcticonBook,
  OcticonClock,
  OcticonClose,
  OcticonExpand,
  OcticonFlame,
  OcticonGitFork,
  OcticonGitMerge,
  OcticonGrabber,
  OcticonIssueOpened,
  OcticonOrganization,
  OcticonPackage,
  OcticonPeople,
  OcticonPullRequest,
  OcticonRepo,
  OcticonRepoPush,
  OcticonSmiley,
  OcticonStar,
  OcticonStarFilled,
  OcticonStarLarge,
  OcticonTable,
  OcticonTriangleDown,
} from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"

import ContributionActivity from "./activity"
import ContributionGraph from "./graph"
import ParentDashboard from "./parent"
import PinnedItems from "./pinned"
import ProfileSidebar from "./sidebar"
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
      id: "repositories",
      label: "Repositories",
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
      id: "repositories",
      label: "Repositories",
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
      icon: <OcticonPackage className="size-4" />,
    },
    {
      id: "resources",
      label: "Resources",
      count: 15,
      icon: <OcticonStar className="size-4" />,
    },
  ],
  parent: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "repositories",
      label: "Repositories",
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
      icon: <OcticonPackage className="size-4" />,
    },
  ],
  staff: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "repositories",
      label: "Repositories",
      count: 12,
      icon: <OcticonRepo className="size-4" />,
    },
    {
      id: "issues",
      label: "Issues",
      count: 24,
      icon: <OcticonIssueOpened className="size-4" />,
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
  const [showBanner, setShowBanner] = useState(true)

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
        return <StudentDashboard data={data} isOwner={isOwner} />
      case "teacher":
        return <TeacherDashboard data={data} isOwner={isOwner} />
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
          <TabsList className="h-auto gap-6 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-muted-foreground data-[state=active]:text-foreground hover:text-foreground data-[state=active]:border-b-primary relative gap-2 !rounded-none !border-0 !border-b-2 border-transparent px-1 py-3 text-[13px] font-medium !shadow-none !ring-0 transition-colors !outline-none focus-visible:!border-transparent focus-visible:!ring-0 focus-visible:!outline-none data-[state=active]:!border-0 data-[state=active]:!border-b-2 data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge
                    variant="secondary"
                    className="ms-0.5 h-4 px-1.5 py-0 text-[10px]"
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
          {/* Notification Banner */}
          {isOwner && showBanner && (
            <div className="flex items-start gap-3 rounded border border-[#54aeff]/40 bg-[#ddf4ff] px-3 py-4 dark:border-blue-800/40 dark:bg-blue-950/30">
              <p className="text-foreground flex-1 text-xs">
                You unlocked new Achievements with private contributions! Show
                them off by including private contributions in your Profile in{" "}
                <a href="#" className="text-[#0969da] hover:underline">
                  settings
                </a>
                .
              </p>
              <button
                onClick={() => setShowBanner(false)}
                className="shrink-0 p-0.5 text-[#0969da] transition-colors hover:text-[#0969da]/80"
              >
                <OcticonClose className="size-3.5" />
              </button>
            </div>
          )}

          {/* Pinned Section */}
          <PinnedItems role={role} data={data} />

          {/* Content + Year Column */}
          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-6">
              {/* Contribution Graph */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground text-sm font-medium">
                    1,086 contributions in {new Date().getFullYear()}
                  </h3>
                  <button className="text-muted-foreground flex items-center gap-0.5 text-xs transition-colors hover:text-[#0969da] hover:underline">
                    Contribution settings
                    <OcticonTriangleDown className="size-4" />
                  </button>
                </div>
                <div className="border-border rounded-md border p-3">
                  <ContributionGraph
                    role={role}
                    userId={userId}
                    isOwner={isOwner}
                  />
                </div>
              </div>

              {/* Contribution Activity */}
              <ContributionActivity
                role={role}
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>
            <div className="hidden w-24 flex-col gap-1.5 pt-2 sm:flex">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`rounded px-3 py-1.5 text-start text-[11px] transition-colors ${
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

          {/* Icon Reference Grid */}
          <div className="border-border rounded-md border p-3">
            <h3 className="text-foreground mb-4 text-sm font-semibold">
              Octicon Icons
            </h3>
            <div className="grid grid-cols-5 gap-4 sm:grid-cols-7 md:grid-cols-10">
              {[
                { icon: <OcticonRepo className="size-5" />, name: "Repo" },
                { icon: <OcticonBook className="size-5" />, name: "Book" },
                { icon: <OcticonTable className="size-5" />, name: "Table" },
                {
                  icon: <OcticonPackage className="size-5" />,
                  name: "Package",
                },
                { icon: <OcticonStar className="size-5" />, name: "Star" },
                {
                  icon: <OcticonStarFilled className="size-5" />,
                  name: "StarFill",
                },
                {
                  icon: <OcticonStarLarge className="size-5" />,
                  name: "StarLg",
                },
                { icon: <OcticonGitFork className="size-5" />, name: "Fork" },
                {
                  icon: <OcticonOrganization className="size-5" />,
                  name: "Org",
                },
                { icon: <OcticonClock className="size-5" />, name: "Clock" },
                { icon: <OcticonPeople className="size-5" />, name: "People" },
                { icon: <OcticonSmiley className="size-5" />, name: "Smiley" },
                { icon: <OcticonRepoPush className="size-5" />, name: "Push" },
                { icon: <OcticonExpand className="size-5" />, name: "Expand" },
                {
                  icon: <OcticonGrabber className="size-5" />,
                  name: "Grabber",
                },
                { icon: <OcticonClose className="size-5" />, name: "Close" },
                { icon: <OcticonPullRequest className="size-5" />, name: "PR" },
                { icon: <OcticonFlame className="size-5" />, name: "Flame" },
                { icon: <OcticonGitMerge className="size-5" />, name: "Merge" },
                {
                  icon: <OcticonIssueOpened className="size-5" />,
                  name: "Issue",
                },
                {
                  icon: <OcticonTriangleDown className="size-5" />,
                  name: "TriDown",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="text-muted-foreground hover:text-foreground flex flex-col items-center gap-1.5 rounded-md p-2 transition-colors"
                >
                  {item.icon}
                  <span className="text-[10px]">{item.name}</span>
                </div>
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
