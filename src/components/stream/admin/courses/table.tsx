"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useModal } from "@/components/atom/modal/context"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import type { CourseRow } from "./columns"
import { getCourseColumns } from "./columns"
import { DeleteCourseDialog } from "./delete-dialog"

interface Props {
  initialData: CourseRow[]
  total: number
  lang: string
  dictionary: any
}

function AdminCoursesTableInner({
  initialData,
  total,
  lang,
  dictionary,
}: Props) {
  const router = useRouter()
  const { openModal } = useModal()
  const isRTL = lang === "ar"
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null)

  const handleEdit = useCallback(
    (course: CourseRow) => {
      openModal(course.id)
    },
    [openModal]
  )

  const handleDelete = useCallback((course: CourseRow) => {
    setDeleteTarget(course)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setDeleteTarget(null)
    router.refresh()
  }, [router])

  const columns = useMemo(
    () =>
      getCourseColumns(lang, {
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [lang, handleEdit, handleDelete]
  )

  const { table } = useDataTable<CourseRow>({
    data: initialData,
    columns,
    pageCount: Math.ceil(total / (initialData.length || 12)),
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialData.length || 12,
      },
    },
  })

  if (initialData.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
            <h3>{isRTL ? "لا توجد دورات بعد" : "No courses yet"}</h3>
            <p className="muted mb-4">
              {isRTL
                ? "أنشئ أول دورة لتبدأ مع Stream LMS"
                : "Create your first course to get started with Stream LMS"}
            </p>
            <Button onClick={() => openModal()}>
              {isRTL ? "إنشاء دورة" : "Create Course"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <DataTable table={table} />

      {deleteTarget && (
        <DeleteCourseDialog
          courseId={deleteTarget.id}
          courseTitle={deleteTarget.title}
          lang={lang}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}

export const AdminCoursesTable = React.memo(AdminCoursesTableInner)
