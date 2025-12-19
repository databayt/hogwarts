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

  const isRTL = lang === "ar"

  return (
    <Button
      onClick={onSubmit}
      disabled={pending}
      className="h-12 w-full px-8 text-base font-medium"
      style={{
        backgroundColor: "#141413",
        color: "#faf9f5",
      }}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {isRTL ? "جاري التحميل..." : "Loading..."}
        </>
      ) : isRTL ? (
        "التسجيل في الدورة"
      ) : (
        "Enroll in Course"
      )}
    </Button>
  )
}
