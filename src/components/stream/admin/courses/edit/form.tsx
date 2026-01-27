"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
import { Icons } from "@/components/icons"
import { RichTextEditor } from "@/components/stream/shared/rich-text-editor"

import {
  updateCourseSchema,
  type UpdateCourseInput,
} from "../create/validation"

interface EditCourseFormProps {
  data: {
    id: string
    title: string
    description: string | null
    price: number | null
    imageUrl: string | null
    isPublished: boolean
  }
}

export function EditCourseForm({ data }: EditCourseFormProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<UpdateCourseInput>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      price: data.price || undefined,
      imageUrl: data.imageUrl || undefined,
      isPublished: data.isPublished,
    },
  })

  async function onSubmit(values: UpdateCourseInput) {
    setIsPending(true)
    try {
      // TODO: Implement update course action
      console.log("Update course:", values)
      toast.success("Course updated successfully!")
    } catch (error) {
      toast.error("Failed to update course")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter course title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter course description"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter price"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                    field.onChange(val === "" ? undefined : parseFloat(val))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Icons.loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icons.save className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
