// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLiveClass } from "@/components/school-dashboard/conference/actions/sessions"
import {
  getLessonReferenceContent,
  type LessonReferenceContent,
} from "@/components/school-dashboard/conference/queries"

interface Props {
  id: string
  locale: string
  dictionary: Dictionary
}

function formatWhen(d: Date | string, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return date.toISOString()
  }
}

function formatDay(d: Date | string, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
    })
  } catch {
    return date.toISOString()
  }
}

export async function LiveClassDetailContent({
  id,
  locale,
  dictionary,
}: Props) {
  const result = await getLiveClass(id)
  if (!("success" in result) || !result.success) {
    notFound()
  }
  const session = result.data

  const t = dictionary?.liveClasses
  const r = t?.references

  const canJoin = session.status === "live" || session.status === "scheduled"
  const isExternal = session.provider === "external"

  // The linked catalog lesson's teachable content (videos, materials,
  // practice questions) — one FK, whole payload.
  let lessonContent: LessonReferenceContent | null = null
  if (session.catalogLessonId) {
    try {
      lessonContent = await getLessonReferenceContent(session.catalogLessonId)
    } catch {
      lessonContent = null
    }
  }

  const examResources = session.resources.filter((x) => x.schoolExam)
  const assignmentResources = session.resources.filter(
    (x) => x.schoolAssignment
  )
  const linkResources = session.resources.filter((x) => x.url)

  const hasReferences =
    Boolean(session.catalogLesson) ||
    examResources.length > 0 ||
    assignmentResources.length > 0 ||
    linkResources.length > 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={typography.h2}>{session.title}</h1>
          <p className={typography.muted}>
            {formatWhen(session.scheduledStart, locale)} —{" "}
            {formatWhen(session.scheduledEnd, locale)}
          </p>
        </div>
        <Badge>{t?.status?.[session.status] ?? session.status}</Badge>
      </div>

      {session.description && (
        <p className={typography.p}>{session.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        {session.section && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.section ?? "Section"}
            </dt>
            <dd>{session.section.name}</dd>
          </div>
        )}
        {session.subject && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.subject ?? "Subject"}
            </dt>
            <dd>{session.subject.name}</dd>
          </div>
        )}
        {session.teacher && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.teacher ?? "Teacher"}
            </dt>
            <dd>
              {session.teacher.firstName} {session.teacher.lastName}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">
            {t?.labels?.visibility ?? "Who can join"}
          </dt>
          <dd>
            {session.visibility === "school"
              ? (t?.labels?.visibilitySchool ?? "Whole school")
              : (t?.labels?.visibilitySection ?? "Section only")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t?.labels?.recording ?? "Recording"}
          </dt>
          <dd>
            {session.recordingEnabled
              ? (t?.labels?.enabled ?? "Enabled")
              : (t?.labels?.disabled ?? "Disabled")}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        {canJoin &&
          (isExternal ? (
            session.meetingUrl ? (
              <Button asChild>
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t?.actions?.openMeeting ?? t?.actions?.join ?? "Join"}
                </a>
              </Button>
            ) : null
          ) : (
            <Button asChild>
              <Link href={`/${locale}/conference/${session.id}/room`}>
                {t?.actions?.join ?? "Join"}
              </Link>
            </Button>
          ))}
        {session.status === "ended" && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/conference/${session.id}/recordings`}>
              {t?.actions?.viewRecordings ?? "View recordings"}
            </Link>
          </Button>
        )}
      </div>

      {hasReferences && (
        <section className="space-y-4 rounded-lg border p-4">
          <h2 className={typography.h4}>{r?.title ?? "Lesson & references"}</h2>

          {session.catalogLesson && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {t?.labels?.lesson ?? "Lesson"}
                </span>
                <Badge variant="outline">{session.catalogLesson.name}</Badge>
                {lessonContent && lessonContent.questionCount > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {lessonContent.questionCount}{" "}
                    {r?.practiceQuestions ?? "practice questions"}
                  </span>
                )}
              </div>

              {lessonContent && lessonContent.videos.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    {r?.videos ?? "Videos"}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {lessonContent.videos.map((v) => (
                      <li key={v.id}>
                        <a
                          className="underline underline-offset-2"
                          href={v.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {v.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lessonContent &&
                (lessonContent.attachments.length > 0 ||
                  lessonContent.materials.length > 0) && (
                  <div>
                    <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      {r?.materials ?? "Materials"}
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {lessonContent.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            className="underline underline-offset-2"
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {a.name}
                          </a>
                        </li>
                      ))}
                      {lessonContent.materials.map((m) => {
                        const href = m.fileUrl ?? m.externalUrl
                        return (
                          <li key={m.id}>
                            {href ? (
                              <a
                                className="underline underline-offset-2"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {m.title}
                              </a>
                            ) : (
                              <span>{m.title}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {examResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.exams ?? "Exams & quizzes"}
              </h3>
              <ul className="space-y-1 text-sm">
                {examResources.map((x) => (
                  <li key={x.id} className="flex items-center gap-2">
                    <span>{x.schoolExam!.title}</span>
                    <Badge variant="secondary">{x.schoolExam!.examType}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolExam!.examDate, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assignmentResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.assignments ?? "Assignments"}
              </h3>
              <ul className="space-y-1 text-sm">
                {assignmentResources.map((x) => (
                  <li key={x.id} className="flex items-center gap-2">
                    <span>{x.schoolAssignment!.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolAssignment!.dueDate, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {linkResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.links ?? "Links"}
              </h3>
              <ul className="space-y-1 text-sm">
                {linkResources.map((x) => (
                  <li key={x.id}>
                    <a
                      className="underline underline-offset-2"
                      href={x.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {x.title || x.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
