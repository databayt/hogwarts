// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getDictionary } from "@/components/internationalization/dictionaries"
import { readLessonWithProgress } from "@/components/lumos/data/catalog/get-lesson-with-progress"
import { fetchLessonQuizQuestions, toClientQuestion } from "@/components/lumos/lib/lesson-quiz"

import { authenticate, isAuthError } from "../../../lib/authenticate"

const FALLBACK_VIDEO_URL = `https://${
  process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim() || "cdn.databayt.org"
}/hogwarts/media/story.mp4`

const GRADE_WORDS_AR: Record<number, string> = {
  1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس", 6: "السادس",
  7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر", 11: "الحادي عشر", 12: "الثاني عشر",
}
const GRADE_WORDS: Record<number, string> = {
  1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven",
  8: "Eight", 9: "Nine", 10: "Ten", 11: "Eleven", 12: "Twelve",
}

function formatDuration(minutes?: number | null, seconds?: number | null): string {
  const totalMin = minutes ?? (seconds ? Math.ceil(seconds / 60) : 0)
  if (totalMin === 0) return ""
  if (totalMin >= 60) return `${Math.floor(totalMin / 60)}h ${totalMin % 60} min`
  return `${totalMin} min`
}

/**
 * `/lumos/courses/[slug]/[lessonId]` as data — the page's `getLessonWithProgress`
 * read with the token's user, the answer-key-free quiz (`getLessonContent`'s
 * set), and the lines the page composes: the play label, the info line and
 * the paragraph. Video and file URLs are the protected `/api/lumos/*` routes,
 * which accept this app's Bearer token.
 *
 * GET /api/mobile/lumos/lessons/:lessonId?lang=ar|en
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { lessonId } = await params
    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"

    const [lesson, rows, dictionary] = await Promise.all([
      readLessonWithProgress(lessonId, { userId: auth.userId, role: auth.role, schoolId: auth.schoolId }),
      fetchLessonQuizQuestions(lessonId, auth.schoolId).catch(() => []),
      getDictionary(lang),
    ])
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    const d = ((dictionary as { lumos?: { lesson?: Record<string, string> } }).lumos?.lesson ?? {}) as Record<string, string>

    const gradeWord = (n: number) => (lang === "ar" ? GRADE_WORDS_AR[n] : GRADE_WORDS[n]) ?? String(n)
    const course = lesson.chapter.course
    const gradeLabel = course.grades.length > 0
      ? `${d.grade || "Grade"} ${course.grades.map(gradeWord).join(" / ")}`
      : null
    const meta = [gradeLabel, lesson.year ? String(lesson.year) : null, formatDuration(lesson.duration, lesson.videoDuration) || null]
      .filter((p): p is string => Boolean(p))
      .join(" · ")
    const blurb = [
      [course.title, lesson.chapter.title].filter(Boolean).join(" · ") || null,
      lesson.description || course.description || d.exploreLesson || "Explore this lesson and discover new concepts.",
    ].filter(Boolean).join(" ")
    const playLabel = (d.playAt || "Play {c}{cn}, {l}{ln}")
      .replace("{c}", d.chapterShort || "C")
      .replace("{cn}", String(lesson.chapter.position))
      .replace("{l}", d.lessonShort || "L")
      .replace("{ln}", String(lesson.position))

    const first = lesson.availableVideos[0]
    const videoUrl = first?.videoUrl ?? lesson.videoUrl ?? (lesson.availableVideos.length === 0 ? FALLBACK_VIDEO_URL : null)

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      thumbnail_url: lesson.thumbnailUrl,
      color: lesson.color,
      is_free: lesson.isFree,
      duration: lesson.duration,
      video_duration: lesson.videoDuration,
      course: { id: course.id, slug: course.slug, title: course.title },
      chapter: { title: lesson.chapter.title, position: lesson.chapter.position },
      position: lesson.position,
      meta,
      blurb,
      play_label: playLabel,
      video_url: videoUrl,
      /** True when this is the marketing clip, which must never write progress. */
      is_fallback_video: lesson.availableVideos.length === 0,
      instructors: lesson.availableVideos.length,
      progress: lesson.progress
        ? { is_completed: lesson.progress.isCompleted, watched_seconds: lesson.progress.watchedSeconds, total_seconds: lesson.progress.totalSeconds }
        : null,
      previous: lesson.previousLesson,
      next: lesson.nextLesson ? { id: lesson.nextLesson.id, title: lesson.nextLesson.title } : null,
      siblings: lesson.siblingLessons.map((s) => ({
        id: s.id,
        title: s.title,
        thumbnail_url: s.thumbnailUrl,
        color: s.color,
        duration: s.duration,
        lesson_position: s.lessonPosition,
        chapter_position: s.chapterPosition,
        watched_minutes: s.watchedMinutes,
      })),
      resources: [
        ...lesson.attachments.map((a) => ({ id: a.id, title: a.name, description: null, url: a.url })),
        ...lesson.materials.map((m) => ({ id: m.id, title: m.title, description: m.description, url: m.url })),
      ],
      quiz: rows.map(toClientQuestion).map((q) => ({
        id: q.id,
        text: q.questionText,
        type: q.questionType,
        choices: q.choices,
      })),
      labels: {
        more: d.more, free: d.free, add: d.add, more_from: d.moreFrom, min: d.min, min_watched: d.minWatched,
        chapter_short: d.chapterShort, lesson_short: d.lessonShort, instructors: d.instructors,
        resource_one: d.resourceOne, resource_many: d.resourceMany,
        quiz: d.quiz, quiz_submit: d.quizSubmit, quiz_submitting: d.quizSubmitting, quiz_failed: d.quizSubmitFailed,
        quiz_placeholder: d.quizAnswerPlaceholder, quiz_recorded: d.quizRecorded, quiz_practice: d.quizPractice, answer: d.answer,
        duration: d.duration, minutes: d.minutes, completed: d.completed, mark_complete: d.markAsComplete,
        resources: d.resources, previous: d.previous, next: d.next, back_to_course: d.backToCourse,
        done: d.done, information: d.information, course: d.course, chapter: d.chapter, current_lesson: d.currentLesson,
        description: d.description,
      },
    })
  } catch (error) {
    console.error("[mobile/lumos/lessons/:id] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
