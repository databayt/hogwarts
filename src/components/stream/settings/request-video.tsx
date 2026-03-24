"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitVideoProposal } from "@/components/school-dashboard/listings/subjects/catalog/proposal-actions"

interface Props {
  catalogLessonId: string
  lessonName: string
  subjectName?: string
}

export function RequestVideoButton({
  catalogLessonId,
  lessonName,
  subjectName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitVideoProposal(catalogLessonId, {
        lessonName,
        subjectName,
        description: description || undefined,
      })

      if (result.success) {
        toast.success("Video request submitted")
        setOpen(false)
        setDescription("")
      } else {
        toast.error(result.error || "Failed to submit request")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Video className="mr-2 size-4" />
          Request Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Video for Lesson</DialogTitle>
          <DialogDescription>
            Request a video to be created for this lesson. The platform team
            will review your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Lesson</Label>
            <Input value={lessonName} disabled />
          </div>
          {subjectName && (
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subjectName} disabled />
            </div>
          )}
          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any specific topics or format preferences..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
