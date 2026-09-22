// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { readCourseProgress } from "@/components/lumos/data/catalog/course-progress-core"
import { getCatalogCourse } from "@/components/lumos/data/catalog/get-course"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * `/lumos/courses/[slug]` as data — the page's own `getCatalogCourse` in the
 * reader's language, the viewer's enrolment and progress (the same reads the
 * page makes, with the token's user), and the page's words.
 *
 * GET /api/mobile/lumos/courses/:slug?lang=ar|en
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { slug } = await params
    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"

    // The app still links some courses by subject id; the page takes a slug.
    const bySlug = await db.subject.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: "PUBLISHED" },
      select: { slug: true },
    })
    if (!bySlug) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    let course: Awaited<ReturnType<typeof getCatalogCourse>>
    try {
      course = await getCatalogCourse(bySlug.slug, auth.schoolId, lang)
    } catch {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const [enrollment, progress, dictionary] = await Promise.all([
      db.enrollment.findFirst({
        where: { userId: auth.userId, catalogSubjectId: course.id, isActive: true },
        select: { id: true },
      }),
      readCourseProgress(course.id, auth.userId, auth.schoolId),
      getDictionary(lang),
    ])
    const l = (dictionary as { lumos?: Record<string, Record<string, string>> }).lumos ?? {}
    const cd = l.courseDetail ?? {}
    const eb = l.enrollmentButton ?? {}
    const cp = l.courseProgress ?? {}
    const cert = l.certificate ?? {}

    return NextResponse.json({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      objectives: course.objectives ?? [],
      prerequisites: course.prerequisites,
      target_audience: course.targetAudience,
      image_url: course.imageUrl,
      color: course._catalog?.color ?? null,
      quiz_count: course._catalog?.quizCount ?? 0,
      school_name: course._catalog?.schoolName ?? null,
      price: course.price,
      currency: course.currency,
      is_enrolled: Boolean(enrollment),
      progress: progress
        ? {
            total_lessons: progress.totalLessons,
            completed_lessons: progress.completedLessons,
            percent: progress.progressPercent,
            remaining_minutes: progress.estimatedRemainingMinutes,
          }
        : null,
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        lessons: ch.lessons.map((ls) => ({
          id: ls.id,
          title: ls.title,
          duration: ls.duration,
          image_url: ls.imageUrl,
          is_free: ls.isFree,
        })),
      })),
      labels: {
        lumos: l.title as unknown as string,
        courses: cd.courses,
        free: cd.free,
        already_registered: cd.alreadyRegistered,
        sign_in: cd.signIn,
        share_on_x: cd.shareOnX,
        share_on_linkedin: cd.shareOnLinkedIn,
        lectures: cd.lectures,
        hours_of_video: cd.hoursOfVideo,
        hour_of_video: cd.hourOfVideo,
        min_of_video: cd.minOfVideo,
        quiz: cd.quiz,
        certificate: cd.certificate,
        about: cd.aboutThisCourse,
        default_description: cd.thisCourseDescription,
        objectives: cd.learningObjectives,
        by_the_end: cd.byTheEnd,
        prerequisites: cd.prerequisites,
        no_prerequisites: cd.noPrerequisites,
        audience: cd.whoThisCourseIsFor,
        default_audience: cd.defaultTargetAudience,
        chapters: cd.chapters,
        preview: cd.preview,
        enroll_free: eb.enrollForFree,
        enroll_price: eb.enrollPrice,
        continue_learning: eb.continueLearning,
        processing: eb.processing,
        enroll_error: eb.enrollError,
        percent_complete: cp.percentComplete,
        progress_lessons: cp.lessons,
        done: cp.done,
        remaining: cp.remaining,
        left: cp.left,
        certificate_view: cert.view,
        certificate_title: cert.title,
      },
    })
  } catch (error) {
    console.error("[mobile/lumos/courses/:slug] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
