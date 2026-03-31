"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  activeTab: string
  userRole: string
  dictionary?: Record<string, any>
  overviewContent?: React.ReactNode
  enrollmentsContent: React.ReactNode
  instructorsContent: React.ReactNode
  videosContent: React.ReactNode
  reviewContent?: React.ReactNode
  pendingReviewCount?: number
}

export function StreamSettingsContent({
  activeTab,
  userRole,
  dictionary,
  overviewContent,
  enrollmentsContent,
  instructorsContent,
  videosContent,
  reviewContent,
  pendingReviewCount = 0,
}: Props) {
  const isFullAdmin = userRole === "ADMIN" || userRole === "DEVELOPER"
  const d = dictionary?.settings

  const tabs = [
    ...(isFullAdmin
      ? [
          { value: "overview", label: d?.overview || "Overview" },
          { value: "enrollments", label: d?.enrollments || "Enrollments" },
          { value: "instructors", label: d?.instructors || "Instructors" },
          {
            value: "review",
            label: `${d?.review || "Review"}${pendingReviewCount > 0 ? ` (${pendingReviewCount})` : ""}`,
          },
        ]
      : []),
    { value: "videos", label: d?.videos || "Videos" },
  ]

  const defaultTab = isFullAdmin ? activeTab || "overview" : "videos"

  return (
    <div className="space-y-6">
      <div>
        <h2>{d?.title || "Stream Settings"}</h2>
        <p className="muted">
          {d?.description ||
            "Manage enrollments, instructor preferences, and video content"}
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
            {reviewContent && (
              <TabsContent value="review">{reviewContent}</TabsContent>
            )}
          </>
        )}

        <TabsContent value="videos">{videosContent}</TabsContent>
      </Tabs>
    </div>
  )
}
