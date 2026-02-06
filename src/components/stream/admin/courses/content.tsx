"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  Edit,
  Grid3X3,
  Layers,
  List,
  MoreHorizontal,
  PlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { AdminCoursesTable } from "@/components/stream/admin/courses/table"

import type { CourseRow } from "./columns"
import { DeleteCourseDialog } from "./delete-dialog"
import { StreamCourseForm } from "./form"

interface Category {
  id: string
  name: string
}

interface Props {
  dictionary: any
  lang: string
  initialData: CourseRow[]
  total: number
  categories?: Category[]
}

// Course types based on chapter count
const getCourseType = (chaptersCount: number, isRTL: boolean): string => {
  if (chaptersCount >= 10)
    return isRTL ? "شهادة احترافية" : "Professional Certificate"
  if (chaptersCount >= 5) return isRTL ? "تخصص" : "Specialization"
  if (chaptersCount >= 3) return isRTL ? "دورة" : "Course"
  return isRTL ? "دورة قصيرة" : "Short Course"
}

// Admin Course Card matching public style + admin actions
function AdminCourseCard({
  course,
  lang,
  dictionary,
  onDelete,
  onEdit,
}: {
  course: CourseRow
  lang: string
  dictionary: any
  onDelete: () => void
  onEdit: () => void
}) {
  const isRTL = lang === "ar"
  const chaptersCount = course.chapters.length
  const courseType = getCourseType(chaptersCount, isRTL)

  return (
    <div className="group relative">
      {/* Card Image */}
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center rounded-xl">
            <BookOpen className="text-muted-foreground size-16" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished
              ? (dictionary?.stream?.adminCourses?.published ?? "Published")
              : (dictionary?.stream?.adminCourses?.draft ?? "Draft")}
          </Badge>
        </div>

        {/* Admin Actions */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="me-2 size-4" />
                {dictionary?.stream?.adminCourses?.editInfo ?? "Edit Info"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/stream/admin/courses/${course.id}/edit`}>
                  <Layers className="me-2 size-4" />
                  {dictionary?.stream?.adminCourses?.manageChapters ??
                    "Manage Chapters"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteCourseDialog
                courseId={course.id}
                courseTitle={course.title}
                lang={lang}
                onSuccess={onDelete}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className={cn("space-y-1.5 px-2 pt-3", isRTL && "text-end")}>
        <div
          className={cn(
            "flex items-center gap-1.5",
            isRTL && "flex-row-reverse"
          )}
        >
          <span className="text-muted-foreground text-xs">
            {course.category?.name ||
              (dictionary?.stream?.adminCourses?.uncategorized ??
                "Uncategorized")}
          </span>
        </div>

        <Link href={`/${lang}/stream/admin/courses/${course.id}/edit`}>
          <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
            {course.title}
          </h3>
        </Link>

        <p className="text-muted-foreground text-xs">{courseType}</p>

        <div
          className={cn(
            "flex items-center gap-3 text-xs",
            isRTL && "flex-row-reverse"
          )}
        >
          <span>
            {course._count.enrollments}{" "}
            {dictionary?.stream?.adminCourses?.enrolled ?? "enrolled"}
          </span>
          <span>•</span>
          <span className="font-medium">
            {course.price
              ? `$${course.price}`
              : (dictionary?.stream?.adminCourses?.free ?? "Free")}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoursesContent({
  dictionary,
  lang,
  initialData,
  total,
  categories = [],
}: Props) {
  const { dictionary: dict } = useDictionary()
  const router = useRouter()
  const { openModal } = useModal()
  const isRTL = lang === "ar"
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [view, setView] = useState<"grid" | "table">("grid")

  const handleDelete = () => {
    router.refresh()
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>{dict?.stream?.adminCourses?.yourCourses ?? "Your Courses"}</h2>
          <p className="muted">
            {total}{" "}
            {dict?.stream?.adminCourses?.coursesInLibrary ??
              "courses in your library"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="size-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setView("table")}
            >
              <List className="size-4" />
            </Button>
          </div>
          <Button onClick={() => openModal()}>
            <PlusIcon className="size-4" />
            {dict?.stream?.adminCourses?.createCourse ?? "Create Course"}
          </Button>
        </div>
      </div>

      {/* Table View */}
      {view === "table" ? (
        <AdminCoursesTable
          initialData={initialData}
          total={total}
          lang={lang}
          dictionary={dict}
        />
      ) : (
        /* Grid View */
        <>
          {initialData.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
                  <h3>
                    {dict?.stream?.adminCourses?.noCoursesYet ??
                      "No courses yet"}
                  </h3>
                  <p className="muted mb-4">
                    {dict?.stream?.adminCourses?.createFirstCourse ??
                      "Create your first course to get started with Stream LMS"}
                  </p>
                  <Button onClick={() => openModal()}>
                    <PlusIcon className="size-4" />
                    {dict?.stream?.adminCourses?.createYourFirstCourse ??
                      "Create Your First Course"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {initialData.map((course, idx) => (
                <div
                  key={course.id}
                  className="group relative block h-full w-full p-2"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <AnimatePresence>
                    {hoveredIndex === idx && (
                      <motion.span
                        className="bg-muted dark:bg-muted/80 absolute inset-0 block h-full w-full rounded-2xl"
                        layoutId="adminCourseHoverBackground"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: { duration: 0.15 },
                        }}
                        exit={{
                          opacity: 0,
                          transition: { duration: 0.15, delay: 0.2 },
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative z-10">
                    <AdminCourseCard
                      course={course}
                      lang={lang}
                      dictionary={dict}
                      onDelete={handleDelete}
                      onEdit={() => openModal(course.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Course Create/Edit Modal */}
      <Modal
        content={
          <StreamCourseForm
            dictionary={dict}
            lang={lang}
            categories={categories}
            onSuccess={handleSuccess}
          />
        }
      />
    </div>
  )
}
