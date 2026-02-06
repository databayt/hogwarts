"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Icons } from "@/components/icons"
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

  // Get stream dictionary with fallbacks
  const t = dictionary?.stream?.courses?.create || {
    pageTitle: "Create Course",
    cardTitle: "Basic Information",
    cardDescription: "Provide basic information about the course",
    title: "Title",
    titlePlaceholder: "Course title",
    description: "Description",
    descriptionPlaceholder: "Course description",
    coverImage: "Cover Image",
    price: "Price ($)",
    pricePlaceholder: "Price",
    creating: "Creating...",
    createButton: "Create Course",
    success: "Course created successfully!",
    error: "Failed to create course",
  }

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
        toast.error(error.message || t.error)
        return
      }

      if (result?.success) {
        toast.success(t.success)
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
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
                  <FormItem className="w-full">
                    <FormLabel>{t.description}</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={t.descriptionPlaceholder}
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
                    <FormLabel>{t.coverImage}</FormLabel>
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
                    <FormLabel>{t.price}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.pricePlaceholder}
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
                    {t.creating}
                    <Icons.loader2 className="ms-1 size-4 animate-spin" />
                  </>
                ) : (
                  <>
                    {t.createButton} <Icons.plus className="ms-1 size-4" />
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
