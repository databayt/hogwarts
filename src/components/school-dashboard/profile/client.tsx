"use client"

import { useState } from "react"

import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OcticonBook, OcticonRepo } from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"

import ContributionActivity from "./activity"
import ContributionGraph from "./graph"
import ParentDashboard from "./parent"
import PinnedItems from "./pinned"
import ProfileSidebar from "./sidebar"
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

// Overview is shared; each non-staff role gets one tab for its real dashboard.
// No fabricated count badges — the GitHub-style "Repositories/Projects" tabs
// were placeholders and have been removed.
const ROLE_TABS: Record<ProfileRole, ProfileTab[]> = {
  student: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "academics",
      label: "Academics",
      icon: <OcticonRepo className="size-4" />,
    },
  ],
  teacher: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    {
      id: "teaching",
      label: "Teaching",
      icon: <OcticonRepo className="size-4" />,
    },
  ],
  parent: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
    },
    { id: "family", label: "Family", icon: <OcticonRepo className="size-4" /> },
  ],
  staff: [
    {
      id: "overview",
      label: "Overview",
      icon: <OcticonBook className="size-4" />,
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

  const p = (dictionary as any)?.profile

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
        return <StudentDashboard data={data} isOwner={isOwner} dictionary={p} />
      case "teacher":
        return <TeacherDashboard data={data} isOwner={isOwner} dictionary={p} />
      case "parent":
        return <ParentDashboard data={data} dictionary={p} />
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
                <span className="hidden sm:inline">
                  {p?.tabs?.[tab.id] ?? tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Pinned Section */}
          <PinnedItems userId={userId} isOwner={isOwner} dictionary={p} />

          {/* Content + Year Column */}
          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-6">
              {/* Contribution Graph */}
              <div className="space-y-3">
                <h3 className="text-foreground text-sm font-medium">
                  {(
                    p?.overview?.contributionsHeading ??
                    "Contributions in {year}"
                  ).replace("{year}", String(selectedYear))}
                </h3>
                <div className="border-border rounded-md border p-3">
                  <ContributionGraph
                    role={role}
                    userId={userId}
                    isOwner={isOwner}
                    dictionary={p}
                    lang={lang}
                  />
                </div>
              </div>

              {/* Contribution Activity */}
              <ContributionActivity
                role={role}
                userId={userId}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                dictionary={p}
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
        </TabsContent>

        {/* Other Tabs - Show Role Dashboard */}
        {tabs.slice(1).map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {getRoleDashboard()}
          </TabsContent>
        ))}
      </Tabs>
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
              <ProfileSidebar
                role={role}
                data={data}
                isOwner={isOwner}
                dictionary={p}
              />
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
              <ProfileSidebar
                role={role}
                data={data}
                isOwner={isOwner}
                dictionary={p}
              />
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
