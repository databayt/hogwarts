"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { CheckCircle2, Clock, Eye, Film } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { TeacherStats } from "./actions"
import type { ProposableGrade } from "./get-proposable-lessons"
import { ProposeVideoDialog } from "./propose-video-dialog"

interface Props {
  dictionary: Record<string, any>
  lang: string
  stats: TeacherStats
  subdomain: string
  proposableGrades?: ProposableGrade[]
  /** The school's own currency (School.currency) — what a paid video is priced in. */
  currency?: string
}

export function TeachOverviewContent({
  dictionary,
  lang,
  stats,
  subdomain,
  proposableGrades = [],
  currency,
}: Props) {
  const base = `/${lang}/lumos/videos`
  const d = dictionary?.teachDashboard

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {d?.title || "Teacher Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {d?.description || "Manage your content contributions and uploads"}
          </p>
        </div>
        <Link href={base}>
          <Button>
            <Film className="me-2 size-4" />
            {d?.myVideos || "My Videos"}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalVideos || "Total Videos"}
            </CardTitle>
            <Film className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.pendingReview || "Pending Review"}
            </CardTitle>
            <Clock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.approved || "Live"}
            </CardTitle>
            <CheckCircle2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.approvedVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalViews || "Total Views"}
            </CardTitle>
            <Eye className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalViews}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.quickActions || "Quick Actions"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* An empty catalog opens a dialog with nothing to pick — a
              freshly-onboarded school has no active SubjectSelection yet.
              Point at the fix instead. Mirrors videos-content.tsx. */}
          {proposableGrades.length > 0 ? (
            <ProposeVideoDialog
              grades={proposableGrades}
              lang={lang}
              dictionary={dictionary}
              {...(currency ? { currency } : {})}
            />
          ) : (
            <Link href={`/${lang}/subjects`}>
              <Button variant="outline">
                {dictionary?.proposeVideo?.empty ||
                  "No lessons available to upload to."}
              </Button>
            </Link>
          )}
          <Link href={base}>
            <Button variant="outline">
              <Film className="me-2 size-4" />
              {d?.viewMyVideos || "View My Videos"}
            </Button>
          </Link>
          <Link href={`/${lang}/lumos/courses`}>
            <Button variant="outline">
              {d?.browseCatalog || "Browse Catalog"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
