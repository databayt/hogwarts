"use client"

import { useEffect, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { StreamCourseLevel } from "@prisma/client"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { tryCatch } from "@/hooks/try-catch"
import { useConfetti } from "@/hooks/use-confetti"
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
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import { Icons } from "@/components/icons"
import { FileUpload } from "@/components/stream/shared/file-upload"
import { RichTextEditor } from "@/components/stream/shared/rich-text-editor"

import { createCourseAction } from "./create/actions"
import { editCourse } from "./edit/actions"

// Validation schema
const courseFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.number().min(0).max(10000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  level: z.nativeEnum(StreamCourseLevel).optional(),
  isPublished: z.boolean().optional(),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

interface StreamCourseFormProps {
  dictionary: any
  lang: string
  categories?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

// Server function to get course data
async function getCourseById(
  courseId: string
): Promise<CourseFormValues | null> {
  const response = await fetch(`/api/stream/courses/${courseId}`)
  if (!response.ok) return null
  return response.json()
}

export function StreamCourseForm({
  dictionary,
  lang,
  categories = [],
  onSuccess,
}: StreamCourseFormProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { subdomain } = useParams<{ subdomain: string }>()
  const { modal, closeModal } = useModal()
  const triggerConfetti = useConfetti()

  // Determine mode from modal state
  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined
  const isEdit = !!currentId && !isView

  const t = dictionary?.stream?.courseForm ?? {
    createCourse: "Create Course",
    editCourse: "Edit Course",
    viewCourse: "View Course",
    createDescription: "Add a new course to your catalog",
    editDescription: "Update course information",
    viewDescription: "View course details",
    title: "Title",
    titlePlaceholder: "Course title",
    description: "Description",
    descriptionPlaceholder: "Course description",
    category: "Category",
    selectCategory: "Select a category",
    price: "Price ($)",
    pricePlaceholder: "0 for free",
    coverImage: "Cover Image",
    level: "Level",
    selectLevel: "Select level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    saving: "Saving...",
    basicInfo: "Basic Information",
  }

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      price: undefined,
      imageUrl: undefined,
      level: StreamCourseLevel.BEGINNER,
      isPublished: false,
    },
  })

  // Load course data when editing
  useEffect(() => {
    const loadCourse = async () => {
      if (!currentId) return

      try {
        const response = await fetch(`/api/stream/courses/${currentId}`)
        if (!response.ok) {
          toast.error("Failed to load course")
          return
        }
        const course = await response.json()

        form.reset({
          title: course.title ?? "",
          description: course.description ?? "",
          categoryId: course.categoryId ?? undefined,
          price: course.price ?? undefined,
          imageUrl: course.imageUrl ?? undefined,
          level: course.level ?? StreamCourseLevel.BEGINNER,
          isPublished: course.isPublished ?? false,
        })
      } catch (error) {
        console.error("Failed to load course:", error)
        toast.error("Failed to load course")
      }
    }

    void loadCourse()
  }, [currentId, form])

  async function onSubmit(values: CourseFormValues) {
    startTransition(async () => {
      if (isEdit && currentId) {
        // Update existing course
        const result = await editCourse(
          {
            title: values.title,
            description: values.description,
            categoryId: values.categoryId,
            price: values.price,
            imageUrl: values.imageUrl,
            level: values.level,
            isPublished: values.isPublished,
          },
          currentId
        )

        if (result.status === "success") {
          toast.success(result.message)
          closeModal()
          onSuccess?.()
        } else {
          toast.error(result.message)
        }
      } else {
        // Create new course
        const formData = new FormData()
        formData.append("title", values.title)
        if (values.description)
          formData.append("description", values.description)
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
          closeModal()
          onSuccess?.()
        }
      }
    })
  }

  const handleBack = () => {
    closeModal()
  }

  const handleNext = () => {
    form.handleSubmit(onSubmit)()
  }

  // Title and description based on mode
  const modalTitle = isView
    ? t.viewCourse
    : isEdit
      ? t.editCourse
      : t.createCourse
  const modalDescription = isView
    ? t.viewDescription
    : isEdit
      ? t.editDescription
      : t.createDescription

  return (
    <>
      <ModalFormLayout title={modalTitle} description={modalDescription}>
        <Form {...form}>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.title}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.titlePlaceholder}
                      {...field}
                      disabled={pending || isView}
                    />
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
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={t.descriptionPlaceholder}
                      disabled={pending || isView}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.length > 0 && (
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.category}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                        disabled={pending || isView}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectCategory} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.level}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={pending || isView}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectLevel} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={StreamCourseLevel.BEGINNER}>
                          {t.beginner}
                        </SelectItem>
                        <SelectItem value={StreamCourseLevel.INTERMEDIATE}>
                          {t.intermediate}
                        </SelectItem>
                        <SelectItem value={StreamCourseLevel.ADVANCED}>
                          {t.advanced}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.price}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.pricePlaceholder}
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === "" ? undefined : parseFloat(val))
                      }}
                      disabled={pending || isView}
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
                <FormItem>
                  <FormLabel>{t.coverImage}</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image"
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
                      disabled={pending || isView}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalFormLayout>

      <ModalFooter
        currentStep={1}
        totalSteps={1}
        stepLabel={t.basicInfo}
        isView={isView}
        isEdit={isEdit}
        isDirty={form.formState.isDirty}
        isSubmitting={pending}
        onBack={handleBack}
        onNext={handleNext}
        labels={{
          cancel: t.cancel,
          create: t.create,
          save: t.save,
          saving: t.saving,
        }}
      />
    </>
  )
}

export default StreamCourseForm
