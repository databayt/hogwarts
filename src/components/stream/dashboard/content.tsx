"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface EnrolledCourse {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  enrollmentId: string
  enrolledAt: Date
  progressPercent: number
  completedLessons: number
  totalLessons: number
  chapters: Array<{
    lessons: Array<{ id: string }>
  }>
}

interface AvailableCourse {
  id: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  price: number | null
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
  schoolId: string | null
  userId: string
  enrolledCourses: EnrolledCourse[]
  availableCourses: AvailableCourse[]
}

export function StreamDashboardContent({
  dictionary,
  lang,
  schoolId,
  userId,
  enrolledCourses,
  availableCourses,
}: Props) {
  const isRTL = lang === "ar"

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

  // Get lesson count
  const getLessonCount = (
    chapters: Array<{ lessons: Array<{ id: string }> }>
  ) => {
    return chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
  }

  return (
    <div className="space-y-8">
      {/* Enrolled Courses Section */}
      <div>
        <div className="mb-6 flex flex-col gap-2">
          <h2>{isRTL ? "دوراتي" : "My Courses"}</h2>
          <p className="muted">
            {isRTL
              ? "تابع التعلم من حيث توقفت"
              : "Continue learning where you left off"}
          </p>
        </div>

        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <GraduationCap className="text-muted-foreground mx-auto mb-4 size-16" />
                <h3>{isRTL ? "لا توجد دورات مسجلة" : "No Courses Enrolled"}</h3>
                <p className="muted mb-6">
                  {isRTL
                    ? "لم تسجل في أي دورة بعد."
                    : "You haven't enrolled in any courses yet."}
                </p>
                <Link
                  className={buttonVariants()}
                  href={`/${lang}/stream/courses`}
                >
                  {isRTL ? "تصفح الدورات" : "Browse Courses"}
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                {/* Course Image */}
                <div className="bg-muted relative aspect-video w-full overflow-hidden">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-12" />
                    </div>
                  )}
                  {/* Progress Badge */}
                  {course.progressPercent === 100 && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">
                        {isRTL ? "مكتمل" : "Completed"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="pt-4">
                  <h4 className="mb-2 line-clamp-1 font-semibold">
                    {course.title}
                  </h4>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isRTL ? "التقدم" : "Progress"}
                      </span>
                      <span className="font-medium">
                        {course.progressPercent}%
                      </span>
                    </div>
                    <Progress value={course.progressPercent} className="h-2" />
                    <p className="text-muted-foreground text-xs">
                      {isRTL
                        ? `${course.completedLessons} من ${course.totalLessons} درس مكتمل`
                        : `${course.completedLessons} of ${course.totalLessons} lessons completed`}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <Link
                    href={`/${lang}/stream/dashboard/${course.slug}`}
                    className={buttonVariants({ className: "w-full" })}
                  >
                    <PlayCircle className="size-4" />
                    {course.progressPercent > 0
                      ? isRTL
                        ? "متابعة التعلم"
                        : "Continue Learning"
                      : isRTL
                        ? "ابدأ التعلم"
                        : "Start Learning"}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Courses Section */}
      {availableCourses.length > 0 && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2>{isRTL ? "دورات متاحة" : "Available Courses"}</h2>
              <p className="muted">
                {isRTL
                  ? "اكتشف دورات جديدة لتطوير مهاراتك"
                  : "Discover new courses to level up your skills"}
              </p>
            </div>
            <Link
              href={`/${lang}/stream/courses`}
              className={buttonVariants({ variant: "outline" })}
            >
              {isRTL ? "عرض الكل" : "View All"}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                {/* Course Image */}
                <div className="bg-muted relative aspect-video w-full overflow-hidden">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-12" />
                    </div>
                  )}
                </div>

                <CardContent className="pt-4">
                  <h4 className="mb-2 line-clamp-1 font-semibold">
                    {course.title}
                  </h4>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {course.description ||
                      (isRTL ? "لا يوجد وصف" : "No description")}
                  </p>

                  <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
                    <span>
                      {course.chapters.length} {isRTL ? "فصل" : "chapters"}
                    </span>
                    <span>
                      {getLessonCount(course.chapters)}{" "}
                      {isRTL ? "درس" : "lessons"}
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
                  <Link
                    href={`/${lang}/stream/courses/${course.slug}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {formatPrice(course.price)}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
