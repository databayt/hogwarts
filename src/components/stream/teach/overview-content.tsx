"use client"

import Link from "next/link"
import { CheckCircle2, Clock, Eye, Film } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { TeacherStats } from "./actions"

interface Props {
  dictionary: Record<string, unknown>
  lang: string
  stats: TeacherStats
  subdomain: string
}

export function TeachOverviewContent({
  dictionary,
  lang,
  stats,
  subdomain,
}: Props) {
  const base = `/${lang}/s/${subdomain}/stream/teach`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your content contributions and uploads
          </p>
        </div>
        <Link href={`${base}/videos`}>
          <Button>
            <Film className="me-2 size-4" />
            My Videos
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Film className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.approvedVideos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`${base}/videos`}>
            <Button variant="outline">
              <Film className="me-2 size-4" />
              View My Videos
            </Button>
          </Link>
          <Link href={`/${lang}/s/${subdomain}/stream/courses`}>
            <Button variant="outline">Browse Catalog</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
