"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Eye, EyeOff, Globe, School, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import {
  deleteOwnVideo,
  revokeVideoAccess,
  updateVideoVisibility,
} from "../video/video-owner-actions"

interface VideoSettingsDialogProps {
  video: {
    id: string
    title: string
    visibility: string
    approvalStatus: string
    viewCount: number
    lessonName: string
    courseName: string
  }
  onUpdate?: () => void
  children: React.ReactNode
}

const VISIBILITY_OPTIONS = [
  {
    value: "PRIVATE",
    label: "Private",
    icon: EyeOff,
    description: "Only you can see",
  },
  {
    value: "SCHOOL",
    label: "School",
    icon: School,
    description: "Visible to school members",
  },
  {
    value: "PUBLIC",
    label: "Public",
    icon: Globe,
    description: "Visible to everyone",
  },
] as const

export function VideoSettingsDialog({
  video,
  onUpdate,
  children,
}: VideoSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [visibility, setVisibility] = useState(video.visibility)

  function handleVisibilityChange(newVisibility: string) {
    setVisibility(newVisibility)
    startTransition(async () => {
      const result = await updateVideoVisibility(
        video.id,
        newVisibility as "PRIVATE" | "SCHOOL" | "PUBLIC"
      )
      if (result.status === "success") {
        toast.success(result.message)
        onUpdate?.()
      } else {
        toast.error(result.message)
        setVisibility(video.visibility)
      }
    })
  }

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeVideoAccess(video.id)
      if (result.status === "success") {
        toast.success(result.message)
        setVisibility("PRIVATE")
        onUpdate?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOwnVideo(video.id)
      if (result.status === "success") {
        toast.success(result.message)
        setOpen(false)
        onUpdate?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{video.title}</DialogTitle>
          <DialogDescription>
            {video.lessonName} &middot; {video.courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge
              variant={
                video.approvalStatus === "APPROVED"
                  ? "default"
                  : video.approvalStatus === "REJECTED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {video.approvalStatus}
            </Badge>
          </div>

          {/* Views */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Views</span>
            <span className="text-sm font-medium">
              {video.viewCount.toLocaleString()}
            </span>
          </div>

          <Separator />

          {/* Visibility Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={visibility}
              onValueChange={handleVisibilityChange}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="size-4" />
                      <span>{opt.label}</span>
                      <span className="text-muted-foreground text-xs">
                        — {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              You can change visibility at any time. Your video, your choice.
            </p>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              disabled={isPending || visibility === "PRIVATE"}
              className="justify-start"
            >
              <Shield className="mr-2 size-4" />
              Revoke Access Immediately
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive justify-start"
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Video Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{video.title}&rdquo; and
                    remove it from the lesson. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Ownership notice */}
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Eye className="text-muted-foreground mt-0.5 size-4" />
              <div className="space-y-1">
                <p className="text-xs font-medium">You own this video</p>
                <p className="text-muted-foreground text-xs">
                  You retain all rights. The platform only displays your video
                  while visibility is non-private. You can revoke access or
                  delete at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
