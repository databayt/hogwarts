"use client"

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

import {
  createClassroom,
  getClassroom,
  getClassroomTypes,
  updateClassroom,
} from "./actions"
import { classroomCreateSchema } from "./validation"

type FormData = z.infer<typeof classroomCreateSchema>

interface ClassroomFormProps {
  onSuccess?: () => void
}

export function ClassroomForm({ onSuccess }: ClassroomFormProps) {
  const { modal } = useModal()
  const isEdit = !!modal.id
  const [isPending, startTransition] = useTransition()
  const [types, setTypes] = useState<{ id: string; name: string }[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(classroomCreateSchema),
    defaultValues: {
      roomName: "",
      typeId: "",
      capacity: 30,
    },
  })

  // Load classroom types
  useEffect(() => {
    getClassroomTypes().then(setTypes)
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
        onSuccess?.()
      } else {
        ErrorToast(result.error)
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
              <FormLabel>Room Name</FormLabel>
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
              <FormLabel>Room Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
              <FormLabel>Capacity</FormLabel>
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
          {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </form>
    </Form>
  )
}
