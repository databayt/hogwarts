"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { FileUpload } from "@/components/stream/shared/file-upload"

import {
  createLessonSchema,
  type CreateLessonInput,
} from "../create/validation"
import { updateLesson } from "../edit/actions"

interface LessonFormProps {
  data: {
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    duration: number | null
    position: number
    isFree: boolean
  }
  courseId: string
  chapterId: string
  dictionary?: any
}

export function LessonForm({
  data,
  courseId,
  chapterId,
  dictionary,
}: LessonFormProps) {
  const [isPending, setIsPending] = useState(false)

  // Get stream dictionary with fallbacks
  const t = dictionary?.stream?.courses?.lesson || {
    pageTitle: "Edit Lesson",
    cardTitle: "Lesson Details",
    cardDescription: "Update the lesson information and content",
    title: "Lesson Title",
    titlePlaceholder: "Enter lesson title",
    description: "Description",
    descriptionPlaceholder: "Enter lesson description",
    video: "Lesson Video",
    videoDescription:
      "Upload MP4, WebM, or MOV. Max 2GB for Vercel Blob, up to 5GB with S3.",
    duration: "Duration (minutes)",
    durationPlaceholder: "Enter duration",
    saving: "Saving...",
    saveButton: "Save Changes",
    success: "Lesson updated successfully!",
    error: "Failed to update lesson",
  }

  const form = useForm<CreateLessonInput>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      videoUrl: data.videoUrl || undefined,
      duration: data.duration || undefined,
      position: data.position,
      isFree: data.isFree,
    },
  })

  async function onSubmit(values: CreateLessonInput) {
    setIsPending(true)
    try {
      const result = await updateLesson(data.id, {
        title: values.title,
        description: values.description,
        videoUrl: values.videoUrl,
        duration: values.duration,
        isFree: values.isFree,
      })

      if (result.status === "success") {
        toast.success(t.success)
      } else {
        toast.error(result.message || t.error)
      }
    } catch (error) {
      toast.error(t.error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/stream/admin/courses/${courseId}/edit`}
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <Icons.arrowLeft className="size-4" />
        </Link>
        <h2>{t.pageTitle}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription>{t.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.title}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.titlePlaceholder} {...field} />
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
                    <FormLabel>{t.description}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.descriptionPlaceholder}
                        className="min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.video}</FormLabel>
                    <FormControl>
                      <FileUpload
                        accept="video"
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url)}
                        onRemove={() => field.onChange("")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>{t.videoDescription}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.duration}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t.durationPlaceholder}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === "" ? undefined : parseInt(val))
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
                    <Icons.loader2 className="me-2 size-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Icons.save className="me-2 size-4" />
                    {t.saveButton}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}
