"use client"

import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
        icon: <OcticonRepo className="size-4" />,
      })
      tabs.push({
        id: "achievements",
        icon: <OcticonPackage className="size-4" />,
      })
      break
    case "teacher":
      tabs.push({
        id: "classes",
        icon: <OcticonTable className="size-4" />,
      })
      tabs.push({
        id: "achievements",
        icon: <OcticonPackage className="size-4" />,
      })
      break
    case "parent":
      tabs.push({
        id: "children",
        icon: <OcticonTable className="size-4" />,
      })
      break
    case "staff":
      tabs.push({
        id: "organizations",
        icon: <OcticonOrganization className="size-4" />,
      })
      tabs.push({
        id: "achievements",
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

  // GitHub's tab rail: labels stay visible on a phone, and the row scrolls
  // sideways rather than wrapping.
  const tabsNav = (
    <TabsList className="h-auto gap-6 bg-transparent p-0">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className="text-muted-foreground data-[state=active]:text-foreground hover:text-foreground data-[state=active]:border-b-primary relative gap-2 !rounded-none !border-0 !border-b-2 border-transparent px-1 py-3 text-[13px] font-medium !shadow-none transition-colors data-[state=active]:!border-0 data-[state=active]:!border-b-2 data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
        >
          {tab.icon}
          <span>{p?.tabs?.[tab.id] ?? tab.id}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  )

  // The desktop year rail is a column of buttons beside the graph; a phone has
  // no room for it, so the same choice becomes a dropdown on the graph heading.
  const yearSelect = (
    <Select
      value={String(selectedYear)}
      onValueChange={(value) => setSelectedYear(Number(value))}
    >
      <SelectTrigger
        size="sm"
        className="h-8 w-auto gap-1 text-xs"
        aria-label={p?.overview?.year ?? "Year"}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {years.map((year) => (
          <SelectItem key={year} value={String(year)} className="text-xs">
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const overviewPanel = (
    <TabsContent value="overview" className="mt-6 space-y-6">
      <PinnedItems items={data.pinned} isOwner={isOwner} dictionary={p} />

      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-foreground text-lg font-semibold md:text-sm md:font-medium">
                {(p?.overview?.contributionsTitle ?? "Activity").replace(
                  "{year}",
                  String(selectedYear)
                )}
              </h3>
              {useMobileLayout && yearSelect}
            </div>
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

        {/* Year rail — desktop only; md matches the layout breakpoint so the
            rail and the dropdown never both appear. */}
        <div className="hidden w-24 flex-col gap-1.5 pt-2 md:flex">
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
  )

  const rolePanels = tabs.slice(1).map((tab) => (
    <TabsContent key={tab.id} value={tab.id} className="mt-6">
      {tabContent(tab.id)}
    </TabsContent>
  ))

  // Phone: the tab rail leads, then the profile header, then the panel —
  // GitHub's own mobile order.
  if (useMobileLayout) {
    return (
      <div className="min-h-screen">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full gap-0"
        >
          {/* No padding of its own: the dashboard container already insets the
              page to the header's 16px, and a second inset pushed the profile
              out of line with the menu icon. */}
          <div className="border-border overflow-x-auto border-b">
            {tabsNav}
          </div>
          <div className="flex flex-col pt-6 pb-6">
            <ProfileSidebar data={data} dictionary={p} lang={lang} />
            {overviewPanel}
            {rolePanels}
          </div>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-4 lg:px-0">
          <div className="min-w-0 lg:col-span-1">
            <ProfileSidebar data={data} dictionary={p} lang={lang} />
          </div>
          <div className="min-w-0 lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full gap-0"
            >
              <div className="border-border border-b">{tabsNav}</div>
              {overviewPanel}
              {rolePanels}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
