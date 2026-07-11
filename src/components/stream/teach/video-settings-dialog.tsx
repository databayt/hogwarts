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
  removeVideoPaywall,
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
  // The `stream` dictionary subtree.
  dictionary?: Record<string, any>
}

type FreeVisibility = "PRIVATE" | "SCHOOL" | "PUBLIC"

export function VideoSettingsDialog({
  video,
  onUpdate,
  children,
  dictionary,
}: VideoSettingsDialogProps) {
  const d = dictionary?.videoSettings ?? {}
  const dt = dictionary?.teachVideos ?? {}
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [visibility, setVisibility] = useState(video.visibility)
  const [approvalStatus, setApprovalStatus] = useState(video.approvalStatus)
  const [paywallTarget, setPaywallTarget] = useState<FreeVisibility>("SCHOOL")
  const isPaid = visibility === "PAID"

  const statusLabel: Record<string, string> = {
    APPROVED: dt.statusApproved ?? "Approved",
    PENDING: dt.statusPending ?? "Pending",
    REJECTED: dt.statusRejected ?? "Rejected",
  }

  const visibilityOptions: Array<{
    value: FreeVisibility
    label: string
    icon: typeof EyeOff
    description: string
  }> = [
    {
      value: "PRIVATE",
      label: d.optionPrivate ?? "Private",
      icon: EyeOff,
      description: d.optionPrivateDesc ?? "Only you can see",
    },
    {
      value: "SCHOOL",
      label: d.optionSchool ?? "School",
      icon: School,
      description: d.optionSchoolDesc ?? "Visible to school members",
    },
    {
      value: "PUBLIC",
      label: d.optionPublic ?? "Public",
      icon: Globe,
      description: d.optionPublicDesc ?? "Visible to everyone",
    },
  ]

  function handleRemovePaywall() {
    startTransition(async () => {
      const result = await removeVideoPaywall(video.id, paywallTarget)
      if (result.status === "success") {
        toast.success(d.toastPaywallRemoved ?? result.message)
        setVisibility(paywallTarget)
        onUpdate?.()
      } else {
        toast.error(d.failedAction ?? result.message)
      }
    })
  }

  function handleVisibilityChange(newVisibility: string) {
    // Widening an APPROVED video to PUBLIC resubmits it for platform review —
    // mirror the server rule so the toast + status badge stay truthful.
    const willResubmit =
      newVisibility === "PUBLIC" &&
      visibility !== "PUBLIC" &&
      approvalStatus === "APPROVED"
    setVisibility(newVisibility)
    startTransition(async () => {
      const result = await updateVideoVisibility(
        video.id,
        newVisibility as FreeVisibility
      )
      if (result.status === "success") {
        if (willResubmit) {
          setApprovalStatus("PENDING")
          toast.success(d.toastResubmitted ?? result.message)
        } else {
          toast.success(d.toastVisibility ?? result.message)
        }
        onUpdate?.()
      } else {
        toast.error(d.failedAction ?? result.message)
        setVisibility(video.visibility)
      }
    })
  }

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeVideoAccess(video.id)
      if (result.status === "success") {
        toast.success(d.toastRevoked ?? result.message)
        setVisibility("PRIVATE")
        onUpdate?.()
      } else {
        toast.error(d.failedAction ?? result.message)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOwnVideo(video.id)
      if (result.status === "success") {
        toast.success(d.toastDeleted ?? result.message)
        setOpen(false)
        onUpdate?.()
      } else {
        toast.error(d.failedAction ?? result.message)
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
            <span className="text-muted-foreground text-sm">
              {d.status ?? "Status"}
            </span>
            <Badge
              variant={
                approvalStatus === "APPROVED"
                  ? "default"
                  : approvalStatus === "REJECTED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {statusLabel[approvalStatus] ?? approvalStatus}
            </Badge>
          </div>

          {/* Views */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {d.views ?? "Views"}
            </span>
            <span className="text-sm font-medium">
              {video.viewCount.toLocaleString()}
            </span>
          </div>

          <Separator />

          {/* Visibility Control */}
          {isPaid ? (
            // PAID can't be represented by the free-audience Select, and the
            // generic toggle refuses to un-paywall. Offer an explicit
            // "remove paywall → free audience" path instead.
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {d.paywall ?? "Paywall"}
              </label>
              <Badge variant="secondary">{d.paid ?? "Paid"}</Badge>
              <p className="text-muted-foreground text-xs">
                {d.paywallDescription ??
                  "This is a paid video. Removing the paywall makes it free at the audience you choose. Existing buyers are not refunded."}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={paywallTarget}
                  onValueChange={(v) => setPaywallTarget(v as FreeVisibility)}
                  disabled={isPending}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="size-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePaywall}
                  disabled={isPending}
                >
                  {d.removePaywall ?? "Remove paywall"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {d.visibility ?? "Visibility"}
              </label>
              <Select
                value={visibility}
                onValueChange={handleVisibilityChange}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((opt) => (
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
                {d.visibilityNote ??
                  "You can change visibility at any time. Your video, your choice."}
                {approvalStatus === "APPROVED" && visibility !== "PUBLIC" && (
                  <>
                    {" "}
                    {d.publicResubmitNote ??
                      "Making an approved video public resubmits it for platform review."}
                  </>
                )}
              </p>
            </div>
          )}

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
              <Shield className="me-2 size-4" />
              {d.revoke ?? "Revoke Access Immediately"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive justify-start"
                  disabled={isPending}
                >
                  <Trash2 className="me-2 size-4" />
                  {d.deletePermanently ?? "Delete Video Permanently"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {d.deleteTitle ?? "Delete this video?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {(
                      d.deleteDescription ??
                      "This will permanently delete “{title}” and remove it from the lesson. This action cannot be undone."
                    ).replace("{title}", video.title)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{d.cancel ?? "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {d.delete ?? "Delete"}
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
                <p className="text-xs font-medium">
                  {d.ownershipTitle ?? "You own this video"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {d.ownershipBody ??
                    "You retain all rights. The platform only displays your video while visibility is non-private. You can revoke access or delete at any time."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
