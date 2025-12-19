"use client"

import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Edit,
  MoreHorizontal,
  PlusIcon,
  Trash,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
  isPublished: boolean
  createdAt: Date
  chapters: Array<{
    lessons: Array<{ id: string }>
  }>
  _count: {
    enrollments: number
  }
}

interface Props {
  dictionary: any
  lang: string
  courses: Course[]
}

export default function AdminCoursesContent({
  dictionary,
  lang,
  courses,
}: Props) {
  const isRTL = lang === "ar"

  // Get lesson count for a course
  const getLessonCount = (course: Course) => {
    return course.chapters.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0
    )
  }

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price || price === 0) {
      return isRTL ? "مجاني" : "Free"
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>{isRTL ? "دوراتك" : "Your Courses"}</h2>
          <p className="muted">
            {isRTL
              ? `${courses.length} دورة في مكتبتك`
              : `${courses.length} courses in your library`}
          </p>
        </div>

        <Link
          className={buttonVariants()}
          href={`/${lang}/stream/admin/courses/create`}
        >
          <PlusIcon className="size-4" />
          {isRTL ? "إنشاء دورة" : "Create Course"}
        </Link>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 size-12" />
              <h3>{isRTL ? "لا توجد دورات بعد" : "No courses yet"}</h3>
              <p className="muted mb-4">
                {isRTL
                  ? "أنشئ أول دورة للبدء مع Stream"
                  : "Create your first course to get started with Stream LMS"}
              </p>
              <Link
                className={buttonVariants()}
                href={`/${lang}/stream/admin/courses/create`}
              >
                <PlusIcon className="size-4" />
                {isRTL ? "إنشاء أول دورة" : "Create Your First Course"}
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              {/* Course Image */}
              <div className="bg-muted relative aspect-video w-full overflow-hidden">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <BookOpen className="text-muted-foreground size-12" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant={course.isPublished ? "default" : "secondary"}>
                    {course.isPublished
                      ? isRTL
                        ? "منشور"
                        : "Published"
                      : isRTL
                        ? "مسودة"
                        : "Draft"}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1 text-lg">
                    {course.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${lang}/stream/admin/courses/${course.id}/edit`}
                        >
                          <Edit className="mr-2 size-4" />
                          {isRTL ? "تعديل" : "Edit"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="text-destructive focus:text-destructive"
                      >
                        <Link
                          href={`/${lang}/stream/admin/courses/${course.id}/delete`}
                        >
                          <Trash className="mr-2 size-4" />
                          {isRTL ? "حذف" : "Delete"}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description ||
                    (isRTL ? "لا يوجد وصف" : "No description")}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span>
                    {course.chapters.length} {isRTL ? "فصل" : "chapters"}
                  </span>
                  <span>
                    {getLessonCount(course)} {isRTL ? "درس" : "lessons"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t pt-4">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Users className="size-4" />
                  <span>
                    {course._count.enrollments} {isRTL ? "مسجل" : "enrolled"}
                  </span>
                </div>
                <span className="font-semibold">
                  {formatPrice(course.price)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
