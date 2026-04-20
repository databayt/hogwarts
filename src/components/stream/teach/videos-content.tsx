"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Fragment, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Film,
  Settings,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { TeacherVideo } from "./actions"
import { VideoSettingsDialog } from "./video-settings-dialog"

interface Props {
  dictionary: Record<string, unknown>
  lang: string
  videos: TeacherVideo[]
  subdomain: string
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
}

type StatusFilter = "all" | "APPROVED" | "PENDING" | "REJECTED"

export function TeachVideosContent({ videos }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all")
  const router = useRouter()

  const filteredVideos = useMemo(
    () =>
      filter === "all"
        ? videos
        : videos.filter((v) => v.approvalStatus === filter),
    [videos, filter]
  )

  const counts = useMemo(
    () => ({
      all: videos.length,
      APPROVED: videos.filter((v) => v.approvalStatus === "APPROVED").length,
      PENDING: videos.filter((v) => v.approvalStatus === "PENDING").length,
      REJECTED: videos.filter((v) => v.approvalStatus === "REJECTED").length,
    }),
    [videos]
  )

  const totalViews = useMemo(
    () => videos.reduce((sum, v) => sum + v.viewCount, 0),
    [videos]
  )

  if (videos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Videos</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-sm">
              You haven&apos;t uploaded any videos yet.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Use the &quot;Propose a Video&quot; button from your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Videos</h1>
        <Badge variant="outline">{videos.length} videos</Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Film className="text-muted-foreground size-5" />
            <div>
              <p className="text-xl font-bold">{counts.all}</p>
              <p className="text-muted-foreground text-xs">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <CheckCircle2 className="size-5 text-green-600" />
            <div>
              <p className="text-xl font-bold">{counts.APPROVED}</p>
              <p className="text-muted-foreground text-xs">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Clock className="size-5 text-yellow-600" />
            <div>
              <p className="text-xl font-bold">{counts.PENDING}</p>
              <p className="text-muted-foreground text-xs">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Eye className="text-muted-foreground size-5" />
            <div>
              <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Total Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="APPROVED">
            Approved ({counts.APPROVED})
          </TabsTrigger>
          <TabsTrigger value="PENDING">Pending ({counts.PENDING})</TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rejected ({counts.REJECTED})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className="text-end">Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video) => {
                const isPaid =
                  video.visibility === "PAID" ||
                  (video.price != null && video.price > 0)
                const showRejection =
                  video.approvalStatus === "REJECTED" && !!video.rejectionReason

                return (
                  <Fragment key={video.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {video.isFeatured && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              Featured
                            </Badge>
                          )}
                          {video.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {video.lesson.chapter.subject.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {video.lesson.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[video.approvalStatus] ?? "outline"
                          }
                        >
                          {video.approvalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{video.visibility}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {isPaid && video.price != null
                          ? `${video.price.toFixed(2)} ${video.currency ?? ""}`
                          : "Free"}
                      </TableCell>
                      <TableCell className="text-end">
                        <span className="flex items-center justify-end gap-1">
                          <Eye className="size-3" />
                          {video.viewCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(video.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <VideoSettingsDialog
                          video={{
                            id: video.id,
                            title: video.title,
                            visibility: video.visibility,
                            approvalStatus: video.approvalStatus,
                            viewCount: video.viewCount,
                            lessonName: video.lesson.name,
                            courseName: video.lesson.chapter.subject.name,
                          }}
                          onUpdate={() => router.refresh()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <Settings className="size-3.5" />
                          </Button>
                        </VideoSettingsDialog>
                      </TableCell>
                    </TableRow>
                    {showRejection && (
                      <TableRow className="bg-destructive/5 hover:bg-destructive/5">
                        <TableCell
                          colSpan={9}
                          className="text-destructive py-2 text-xs"
                        >
                          <span className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                            <span>
                              <span className="font-medium">
                                Rejection reason:{" "}
                              </span>
                              {video.rejectionReason}
                            </span>
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
              {filteredVideos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No {filter !== "all" ? filter.toLowerCase() : ""} videos
                    found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ownership reminder */}
      <p className="text-muted-foreground text-center text-xs">
        You retain full ownership of all your videos. Use the{" "}
        <Settings className="inline size-3" /> button to manage visibility or
        delete.
      </p>
    </div>
  )
}
