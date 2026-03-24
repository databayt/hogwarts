"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  activeTab: string
  userRole: string
  overviewContent?: React.ReactNode
  enrollmentsContent: React.ReactNode
  instructorsContent: React.ReactNode
  videosContent: React.ReactNode
}

export function StreamSettingsContent({
  activeTab,
  userRole,
  overviewContent,
  enrollmentsContent,
  instructorsContent,
  videosContent,
}: Props) {
  const isFullAdmin = userRole === "ADMIN" || userRole === "DEVELOPER"

  const tabs = [
    ...(isFullAdmin
      ? [
          { value: "overview", label: "Overview" },
          { value: "enrollments", label: "Enrollments" },
          { value: "instructors", label: "Instructors" },
        ]
      : []),
    { value: "videos", label: "Videos" },
  ]

  const defaultTab = isFullAdmin ? activeTab || "overview" : "videos"

  return (
    <div className="space-y-6">
      <div>
        <h2>Stream Settings</h2>
        <p className="muted">
          Manage enrollments, instructor preferences, and video content
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isFullAdmin && (
          <>
            <TabsContent value="overview">{overviewContent}</TabsContent>
            <TabsContent value="enrollments">{enrollmentsContent}</TabsContent>
            <TabsContent value="instructors">{instructorsContent}</TabsContent>
          </>
        )}

        <TabsContent value="videos">{videosContent}</TabsContent>
      </Tabs>
    </div>
  )
}
