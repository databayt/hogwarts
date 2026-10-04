"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { TeacherSubjectsEditor } from "./editor"
import { closeAssignSubjectsDialog, useAssignSubjectsDialog } from "./store"

/** Mounted once by the teachers table; opened from a row's action menu. */
export function AssignSubjectsDialog() {
  const { open, teacherId, name } = useAssignSubjectsDialog()
  const { dictionary } = useDictionary()
  const t = (
    (dictionary?.school as Record<string, unknown> | undefined)?.teachers as
      | Record<string, unknown>
      | undefined
  )?.subjectsEditor as Record<string, string> | undefined

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAssignSubjectsDialog()
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t?.title || "Subjects & sections"}
            {name ? ` — ${name}` : ""}
          </DialogTitle>
          <DialogDescription>
            {t?.description ||
              "Pick the subjects this teacher teaches and in which sections. Those periods in the timetable get this teacher."}
          </DialogDescription>
        </DialogHeader>
        {teacherId && (
          <TeacherSubjectsEditor
            key={teacherId}
            teacherId={teacherId}
            showSaveButton
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
