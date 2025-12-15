"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { tryCatch } from "@/hooks/try-catch"
import { Button } from "@/components/ui/button"

import { enrollInCourseAction } from "./actions"

export function EnrollmentButton({
  courseId,
  lang,
}: {
  courseId: string
  lang: string
}) {
  const [pending, startTransition] = useTransition()

  function onSubmit() {
    startTransition(async () => {
      const { error } = await tryCatch(enrollInCourseAction(courseId))

      if (error) {
        toast.error(
          error.message || "An unexpected error occurred. Please try again."
        )
        return
      }

      // If no error, redirect() was called and user will be redirected
    })
  }

  return (
    <Button onClick={onSubmit} disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Enroll Now!"
      )}
    </Button>
  )
}
