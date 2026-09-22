// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  getAllCatalogCourses,
  type CatalogCourseType,
} from "@/components/lumos/data/catalog/get-all-courses"
import { getContinueWatching } from "@/components/lumos/data/catalog/get-continue-watching"
import { getCourseShelves } from "@/components/lumos/data/catalog/get-course-shelves"
import { getStartHereLesson } from "@/components/lumos/data/catalog/get-start-here"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { toCourseDto } from "./course-dto"

/**
 * Mobile Lumos courses — `/lumos/courses`, as data.
 *
 * Step for step the page's `CoursesRenderer`, over the same four reads: the
 * per-grade shelves, what this reader has in progress, their own grade (a
 * student's), and — when nothing is in progress — the opening lesson of the
 * grade's first course with one. A student opening Lumos on the web is sent
 * straight here, so this is what the phone's Lumos tab opens on for them too.
 *
 * GET /api/mobile/lumos/courses?lang=ar|en&level=<grade>&search=<q>&page=
 *
 * `level` is which grade the browse view shows; the web keeps it in the URL
 * and re-renders, the phone re-asks. Only a `search` leaves the browse view,
 * for the paginated grid.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId, role } = auth

    const params = new URL(request.url).searchParams
    const lang = params.get("lang") === "en" ? "en" : "ar"
    const level = Number(params.get("level")) || null
    const search = params.get("search")?.trim() || ""
    const page = Math.max(1, Number(params.get("page")) || 1)
    const perPage = 12
    const isBrowsing = !search

    const [{ rows, count }, shelfData, continueWatching, recommendedGrade] =
      await Promise.all([
        isBrowsing
          ? Promise.resolve({ rows: [] as CatalogCourseType[], count: 0 })
          : getAllCatalogCourses(
              { page, perPage, search, grade: level ?? undefined, lang },
              { schoolId }
            ),
        isBrowsing
          ? getCourseShelves(lang, schoolId)
          : Promise.resolve({ shelves: [], total: 0 }),
        isBrowsing ? getContinueWatching(10, { schoolId, userId }) : Promise.resolve([]),
        // A student's own grade is which grade the page opens on — the one
        // honest basis this catalog offers for ordering anything by a person.
        role === "STUDENT"
          ? db.student
              .findUnique({
                where: { userId },
                select: { academicGrade: { select: { gradeNumber: true } } },
              })
              .then((s) => s?.academicGrade?.gradeNumber ?? null)
          : Promise.resolve(null),
      ])

    const effectiveGrade =
      level ?? recommendedGrade ?? shelfData.shelves[0]?.grade ?? null

    // The lead card is never absent: with nothing in progress it opens the
    // first course of the shown grade that has a way in.
    const gradeCourses =
      shelfData.shelves.find((sf) => sf.grade === effectiveGrade)?.courses ?? []
    const startHere = continueWatching[0]
      ? null
      : await getStartHereLesson(
          gradeCourses.map((c) => ({ id: c.id, slug: c.slug })),
          lang,
          schoolId
        )
    const leadCourse = startHere
      ? gradeCourses.find((c) => c.id === startHere.courseId)
      : null

    return NextResponse.json({
      shelves: shelfData.shelves.map((sf) => ({
        grade: sf.grade,
        courses: sf.courses.map(toCourseDto),
      })),
      continue_watching: continueWatching.map((c) => ({
        lesson_id: c.lessonId,
        lesson_title: c.lessonTitle,
        chapter_title: c.chapterTitle,
        course_title: c.courseTitle,
        course_slug: c.courseSlug,
        thumbnail_url: c.thumbnailUrl,
        color: c.color,
        grade: c.grade,
        watched_seconds: c.watchedSeconds,
        total_seconds: c.totalSeconds,
        instructor: c.instructor,
      })),
      recommended_grade: recommendedGrade,
      effective_grade: effectiveGrade,
      start_here:
        startHere && leadCourse
          ? {
              lesson_id: startHere.lessonId,
              lesson_title: startHere.lessonTitle,
              chapter_title: startHere.chapterTitle,
              course_id: leadCourse.id,
              course_title: leadCourse.title,
              course_slug: startHere.courseSlug,
              thumbnail_url: startHere.thumbnailUrl,
              color: startHere.color,
              grade: leadCourse._catalog.grades?.[0] ?? null,
              total_lessons: leadCourse._catalog.totalLessons,
              instructor: startHere.instructor,
            }
          : null,
      search: {
        query: search,
        courses: rows.map(toCourseDto),
        total: count,
        page,
        per_page: perPage,
      },
    })
  } catch (error) {
    console.error("[mobile/lumos/courses] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
