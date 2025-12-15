"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { deleteBook } from "../../actions"

interface Props {
  bookId: string
  schoolId: string
  dictionary: any
}

export default function BookTableActions({
  bookId,
  schoolId,
  dictionary,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const t = dictionary.school

  const handleDelete = async () => {
    if (!confirm(`${t.common.messages.confirmDelete}?`)) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteBook({ id: bookId, schoolId })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error || t.library.messages.bookNotFound)
      }
    } catch (error) {
      toast.error(t.common.messages.errorOccurred)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/library/books/${bookId}`)}
      >
        {t.common.actions.view}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? t.common.status.deleting : t.common.actions.delete}
      </Button>
    </div>
  )
}
