"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { format } from "date-fns"
import { Eye, Film } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { TeacherVideo } from "./actions"

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

export function TeachVideosContent({ videos }: Props) {
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
              Upload videos through the admin course editor or subject catalog.
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

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-end">Views</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
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
                      variant={statusVariant[video.approvalStatus] ?? "outline"}
                    >
                      {video.approvalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{video.visibility}</Badge>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
