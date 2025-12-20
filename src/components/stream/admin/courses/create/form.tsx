"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { tryCatch } from "@/hooks/try-catch"
import { useConfetti } from "@/hooks/use-confetti"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/stream/shared/file-upload"
import { RichTextEditor } from "@/components/stream/shared/rich-text-editor"

import { createCourseAction } from "./actions"
import { createCourseSchema, type CreateCourseInput } from "./validation"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  userId: string
}

export function StreamCourseCreateForm({
  dictionary,
  lang,
  schoolId,
  userId,
}: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { subdomain } = useParams<{ subdomain: string }>()
  const triggerConfetti = useConfetti()

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      price: undefined,
      imageUrl: undefined,
    },
  })

  function onSubmit(values: CreateCourseInput) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("title", values.title)
      if (values.description) formData.append("description", values.description)
      if (values.categoryId) formData.append("categoryId", values.categoryId)
      if (values.price !== undefined && values.price !== null) {
        formData.append("price", values.price.toString())
      }
      if (values.imageUrl) formData.append("imageUrl", values.imageUrl)

      const { data: result, error } = await tryCatch(
        createCourseAction(subdomain, formData)
      )

      if (error) {
        toast.error(error.message || "Failed to create course")
        return
      }

      if (result?.success) {
        toast.success("Course created successfully!")
        triggerConfetti()
        form.reset()
        router.push(`/stream/admin/courses`)
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href={`/stream/admin/courses`}
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h2>Create Course</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide basic information about the course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Course title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Course description"
                        disabled={pending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                      <FileUpload
                        accept="image"
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url)}
                        onRemove={() => field.onChange("")}
                        disabled={pending}
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
                  <FormItem className="w-full">
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Price"
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(
                            val === "" ? undefined : parseFloat(val)
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    Creating...
                    <Loader2 className="ml-1 size-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Create Course <PlusIcon className="ml-1 size-4" />
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
