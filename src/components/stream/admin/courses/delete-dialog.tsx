"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { deleteCourse } from "./delete/actions"

interface DeleteCourseDialogProps {
  courseId: string
  courseTitle: string
  lang: string
  onSuccess?: () => void
}

export function DeleteCourseDialog({
  courseId,
  courseTitle,
  lang,
  onSuccess,
}: DeleteCourseDialogProps) {
  const { dictionary } = useDictionary()
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCourse(courseId)

      if (result.status === "success") {
        toast.success(result.message)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {dictionary?.stream?.deleteDialog?.delete ?? "Delete"}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dictionary?.stream?.deleteDialog?.deleteCourse ?? "Delete Course"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dictionary?.stream?.deleteDialog?.confirmDelete?.replace(
              "{title}",
              courseTitle
            ) ??
              `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {dictionary?.stream?.deleteDialog?.cancel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {dictionary?.stream?.deleteDialog?.deleting ?? "Deleting..."}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                {dictionary?.stream?.deleteDialog?.delete ?? "Delete"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
