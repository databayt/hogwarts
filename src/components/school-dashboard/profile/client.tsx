"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  OcticonBook,
  OcticonOrganization,
  OcticonPackage,
  OcticonRepo,
  OcticonTable,
} from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"

import AchievementsGrid from "./achievements"
import ContributionActivity from "./activity"
import ContributionGraph from "./graph"
import ParentDashboard from "./parent"
import PinnedItems from "./pinned"
import type { ProfileViewData } from "./queries"
import ProfileSidebar from "./sidebar"
import StaffDashboard from "./staff"
import StudentDashboard from "./student"
import TeacherDashboard from "./teacher"

interface Props {
  data: ProfileViewData
  dictionary?: Record<string, any>
  lang?: Locale
}

interface TabDef {
  id: string
  count?: number
  icon: React.ReactNode
}

function buildTabs(data: ProfileViewData): TabDef[] {
  const tabs: TabDef[] = [
    { id: "overview", icon: <OcticonBook className="size-4" /> },
  ]
  switch (data.role) {
    case "student":
      tabs.push({
        id: "subjects",
        count: data.roleDetail.subjects.length,
        icon: <OcticonRepo className="size-4" />,
      })
      tabs.push({
        id: "achievements",
        count: data.badges.length,
        icon: <OcticonPackage className="size-4" />,
      })
      break
    case "teacher":
      tabs.push({
        id: "classes",
        count: data.roleDetail.classes.length,
        icon: <OcticonTable className="size-4" />,
      })
      tabs.push({
        id: "achievements",
        count: data.badges.length,
        icon: <OcticonPackage className="size-4" />,
      })
      break
    case "parent":
      tabs.push({
        id: "children",
        count: data.roleDetail.children.length,
        icon: <OcticonTable className="size-4" />,
      })
      break
    case "staff":
      tabs.push({
        id: "organizations",
        count: data.organizations.length,
        icon: <OcticonOrganization className="size-4" />,
      })
      tabs.push({
        id: "achievements",
        count: data.badges.length,
        icon: <OcticonPackage className="size-4" />,
      })
      break
  }
  return tabs
}

export default function ProfileContent({ data, dictionary, lang }: Props) {
  const { isMobile } = useSidebar()
  const [activeTab, setActiveTab] = useState("overview")
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const p = dictionary
  const role = data.role
  const isOwner = data.isOwner

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const useMobileLayout = isMobile
  const tabs = buildTabs(data)

  const tabContent = (tabId: string) => {
    if (tabId === "achievements")
      return (
        <AchievementsGrid badges={data.badges} dictionary={p} lang={lang} />
      )
    switch (role) {
      case "student":
        return <StudentDashboard data={data} dictionary={p} />
      case "teacher":
        return <TeacherDashboard data={data} dictionary={p} />
      case "staff":
        return <StaffDashboard data={data} dictionary={p} />
      case "parent":
        return <ParentDashboard data={data} dictionary={p} lang={lang} />
      default:
        return null
    }
  }

  const MainContent = () => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-border border-b">
          <TabsList className="h-auto gap-6 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-muted-foreground data-[state=active]:text-foreground hover:text-foreground data-[state=active]:border-b-primary relative gap-2 !rounded-none !border-0 !border-b-2 border-transparent px-1 py-3 text-[13px] font-medium !shadow-none transition-colors data-[state=active]:!border-0 data-[state=active]:!border-b-2 data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
              >
                {tab.icon}
                <span className="hidden sm:inline">
                  {p?.tabs?.[tab.id] ?? tab.id}
                </span>
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

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <PinnedItems items={data.pinned} isOwner={isOwner} dictionary={p} />

          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-6">
              <div className="space-y-3">
                <h3 className="text-foreground text-sm font-medium">
                  {(p?.overview?.contributionsTitle ?? "Activity").replace(
                    "{year}",
                    String(selectedYear)
                  )}
                </h3>
                <div className="border-border rounded-md border p-3">
                  <ContributionGraph
                    role={role}
                    userId={data.userId ?? undefined}
                    year={selectedYear}
                    dictionary={p}
                    lang={lang}
                  />
                </div>
              </div>

              <ContributionActivity
                items={data.recentActivity}
                dictionary={p}
                lang={lang}
              />
            </div>

            {/* Year rail */}
            <div className="hidden w-24 flex-col gap-1.5 pt-2 sm:flex">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  aria-pressed={selectedYear === year}
                  className={`rounded px-3 py-1.5 text-start text-[11px] transition-colors ${
                    selectedYear === year
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Role tabs */}
        {tabs.slice(1).map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tabContent(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        {useMobileLayout ? (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <div className="flex justify-start">
              <ProfileSidebar data={data} dictionary={p} lang={lang} />
            </div>
            <div className="w-full">
              <MainContent />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-4 lg:px-0">
            <div className="min-w-0 lg:col-span-1">
              <ProfileSidebar data={data} dictionary={p} lang={lang} />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <MainContent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
