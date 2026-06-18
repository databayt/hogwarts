"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useModal } from "@/components/atom/modal/context"
import { ErrorToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createClassroom, updateClassroom } from "./actions"
import { resolveClassroomError } from "./errors"
import { classroomCreateSchema } from "./validation"

type FormData = z.infer<typeof classroomCreateSchema>

export interface ClassroomEditValues {
  roomName: string
  typeId: string
  capacity: number
  gradeId?: string
}

interface SelectOption {
  id: string
  name: string
}

const BLANK_VALUES: FormData = {
  roomName: "",
  typeId: "",
  capacity: 30,
  gradeId: undefined,
}

interface ClassroomFormProps {
  onSuccess?: () => void
  /**
   * Select option lists, fetched once on the server and passed down. Keeping
   * them out of the dialog means no on-open fetch, no option-list flicker.
   */
  types: SelectOption[]
  grades: SelectOption[]
  /**
   * Pre-loaded values for the row being edited (sourced from the table data
   * the user already sees). Feeding these via RHF `values` makes the dialog
   * render fully populated on first paint — no async `getClassroom` round-trip,
   * so no blank→filled "reload" and no height re-center "bounce".
   */
  editValues?: ClassroomEditValues | null
}

export function ClassroomForm({
  onSuccess,
  types,
  grades,
  editValues,
}: ClassroomFormProps) {
  const { modal, closeModal } = useModal()
  const isEdit = !!modal.id
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classrooms

  // Reactive form values: blank for create, the row's current values for edit.
  // Memoized so unrelated re-renders never reset an in-progress edit.
  const values = useMemo<FormData>(
    () =>
      isEdit && editValues
        ? {
            roomName: editValues.roomName,
            typeId: editValues.typeId,
            capacity: editValues.capacity,
            gradeId: editValues.gradeId,
          }
        : BLANK_VALUES,
    [isEdit, editValues]
  )

  const form = useForm<FormData>({
    resolver: zodResolver(classroomCreateSchema),
    values,
  })

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateClassroom({ ...data, id: modal.id! })
        : await createClassroom(data)

      if (result.success) {
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(
          resolveClassroomError(
            result.error,
            (result as { details?: string }).details,
            (d as { errors?: Record<string, string> } | undefined)?.errors,
            d?.failedToSave || "Failed to save classroom"
          )
        )
      }
    })
  }

  return (
    <Dialog
      open={modal.open}
      onOpenChange={(open) => {
        if (!open) closeModal()
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? d?.editRoom || "Edit room" : d?.addRoom || "Add room"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Room name + grade share one row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{d?.roomName || "Room Name"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={d?.roomNamePlaceholder || "e.g., A01"}
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {d?.gradeOptional || "Grade (optional)"}
                    </FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? "" : v)
                      }
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              d?.sharedNoGrade || "Shared (no grade)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          {d?.sharedNoGrade || "Shared (no grade)"}
                        </SelectItem>
                        {grades.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type + capacity share one row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{d?.type || "Room Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={d?.selectType || "Select type"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{d?.capacity || "Capacity"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? d?.saving || "Saving..."
                  : isEdit
                    ? d?.update || "Update"
                    : d?.create || "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
