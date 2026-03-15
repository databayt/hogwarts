"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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

import {
  createClassroom,
  getClassroom,
  getClassroomTypes,
  getGrades,
  updateClassroom,
} from "./actions"
import { classroomCreateSchema } from "./validation"

type FormData = z.infer<typeof classroomCreateSchema>

interface ClassroomFormProps {
  onSuccess?: () => void
}

export function ClassroomForm({ onSuccess }: ClassroomFormProps) {
  const { modal, closeModal } = useModal()
  const isEdit = !!modal.id
  const [isPending, startTransition] = useTransition()
  const [types, setTypes] = useState<{ id: string; name: string }[]>([])
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([])
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classrooms

  const form = useForm<FormData>({
    resolver: zodResolver(classroomCreateSchema),
    defaultValues: {
      roomName: "",
      typeId: "",
      capacity: 30,
      gradeId: undefined,
    },
  })

  // Load classroom types and grades
  useEffect(() => {
    Promise.all([getClassroomTypes(), getGrades()]).then(([t, g]) => {
      setTypes(t)
      setGrades(g)
    })
  }, [])

  // Load existing data for edit
  useEffect(() => {
    if (!isEdit || !modal.id) return
    getClassroom({ id: modal.id }).then((data) => {
      if (data) {
        form.reset({
          roomName: data.roomName,
          typeId: data.typeId,
          capacity: data.capacity,
          gradeId: data.gradeId ?? undefined,
        })
      }
    })
  }, [isEdit, modal.id, form])

  const handleSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateClassroom({ ...data, id: modal.id! })
        : await createClassroom(data)

      if (result.success) {
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(result.error || "Failed to save classroom")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roomName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.roomName || "Room Name"}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.type || "Room Type"}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={d?.selectType || "Select type"} />
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
          name="gradeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.gradeOptional || "Grade (optional)"}</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={d?.sharedNoGrade || "Shared (no grade)"}
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

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? d?.saving || "Saving..."
            : isEdit
              ? d?.update || "Update"
              : d?.create || "Create"}
        </Button>
      </form>
    </Form>
  )
}
