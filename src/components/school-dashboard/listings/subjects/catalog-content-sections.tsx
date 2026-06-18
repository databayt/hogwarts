"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  ClipboardList,
  Clock,
  FileEdit,
  FileText,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Library,
  Play,
  Presentation,
  StickyNote,
  Video,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoItem {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number
  viewCount: number
  isFeatured: boolean
  provider: string
  catalogLessonId: string
  color: string | null
}

interface MaterialItem {
  id: string
  title: string
  description: string | null
  type: string
  pageCount: number | null
  downloadCount: number
  fileSize: number | null
  mimeType: string | null
}

interface ExamItem {
  id: string
  title: string
  examType: string
  durationMinutes: number | null
  totalMarks: number | null
  totalQuestions: number | null
  usageCount: number
}

interface QuestionTypeCard {
  type: string
  count: number
  byDifficulty: Record<string, number>
}

interface QuestionStats {
  total: number
  cards: QuestionTypeCard[]
}

interface AssignmentItem {
  id: string
  title: string
  assignmentType: string | null
  estimatedTime: number | null
  totalPoints: number | null
  usageCount: number
}

export interface ContentSectionsData {
  videos: VideoItem[]
  materials: MaterialItem[]
  exams: ExamItem[]
  questionStats: QuestionStats
  assignments: AssignmentItem[]
}

interface Props {
  data: ContentSectionsData
  lang: Locale
  subjectColor: string | null
  name: string
  subdomain: string
  subjectSlug: string
  catalogSubjectId: string
  textbookPdfUrl: string | null
  textbookCoverUrl: string | null
  /**
   * Section "see all" / per-video deep links. Default to the school-dashboard
   * routes (live behind auth on a school subdomain); the public /community
   * surface overrides them with community-scoped, public paths. Pass an empty
   * string to suppress a section's "see all" link (e.g. community exams, which
   * have no public destination).
   */
  materialsHref?: string
  qbankHref?: string
  examsHref?: string
  videosHref?: string
  /**
   * Base path for a per-video tile link; `/${lessonId}` is appended. Empty
   * string → tiles fall back to `videosHref` (the community surface has no
   * per-lesson player, so every tile points at the chapters page). Plain
   * string only — this is a client component (no function props across the
   * server/client boundary).
   */
  videoTileBasePath?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`
}

const EXAM_TYPE_PIPELINE = [
  { key: "final", label: "Final" },
  { key: "midterm", label: "Midterm" },
  { key: "chapter_test", label: "Chapter" },
  { key: "quiz", label: "Quiz" },
  { key: "practice", label: "Practice" },
  { key: "diagnostic", label: "Diagnostic" },
] as const

const TEST_TYPES = new Set(["chapter_test", "quiz", "practice"])

const MATERIAL_TYPE_PIPELINE = [
  { key: "TEXTBOOK", icon: BookOpen },
  { key: "SYLLABUS", icon: ClipboardList },
  { key: "REFERENCE", icon: Library },
  { key: "STUDY_GUIDE", icon: GraduationCap },
  { key: "PROJECT", icon: FolderKanban },
  { key: "WORKSHEET", icon: FileEdit },
  { key: "PRESENTATION", icon: Presentation },
  { key: "LESSON_NOTES", icon: StickyNote },
  { key: "VIDEO_GUIDE", icon: Video },
  { key: "LAB_MANUAL", icon: FlaskConical },
  { key: "OTHER", icon: FileText },
] as const

const QUESTION_TYPE_CONFIG: Record<
  string,
  { svg: string; description: string; color: string }
> = {
  MULTIPLE_CHOICE: {
    svg: "https://cdn.databayt.org/hogwarts/multiple-choice.svg",
    description: "Pick the best answer from multiple options provided",
    color: "#4B976A",
  },
  TRUE_FALSE: {
    svg: "https://cdn.databayt.org/hogwarts/true-false.svg",
    description: "Decide whether each given statement is true or false",
    color: "#CF6E30",
  },
  SHORT_ANSWER: {
    svg: "https://cdn.databayt.org/hogwarts/short-answer.svg",
    description: "Write a brief response in one or two sentences",
    color: "#D25E8C",
  },
  ESSAY: {
    svg: "https://cdn.databayt.org/hogwarts/essay.svg",
    description: "Compose a detailed long-form answer with full explanation",
    color: "#2C70B2",
  },
  FILL_BLANK: {
    svg: "https://cdn.databayt.org/hogwarts/fill-in-blank.svg",
    description: "Complete the sentence by filling in the missing words",
    color: "#825BA3",
  },
  MATCHING: {
    svg: "https://cdn.databayt.org/hogwarts/matching.svg",
    description: "Connect related items by pairing them from two columns",
    color: "#57908C",
  },
  ORDERING: {
    svg: "https://cdn.databayt.org/hogwarts/ordering.svg",
    description: "Arrange the given items into their correct logical sequence",
    color: "#D85E4C",
  },
  MULTI_SELECT: {
    svg: "https://cdn.databayt.org/hogwarts/multi-select.svg",
    description: "Choose all the correct answers from the options given",
    color: "#A14B46",
  },
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CatalogContentSections({
  data,
  lang,
  subjectColor,
  name,
  subdomain,
  subjectSlug,
  catalogSubjectId,
  textbookPdfUrl,
  textbookCoverUrl,
  materialsHref = `/${lang}/subjects/${subjectSlug}/materials`,
  qbankHref = `/${lang}/exams/qbank?catalogSubjectId=${catalogSubjectId}`,
  examsHref = `/${lang}/exams/upcoming?catalogSubjectId=${catalogSubjectId}`,
  videosHref = `/${lang}/stream/dashboard/${subjectSlug}`,
  videoTileBasePath = `/${lang}/stream/dashboard/${subjectSlug}`,
}: Props) {
  // This component needs dictionary passed as prop - for now use useDictionary
  // since it's a client component that doesn't receive dictionary prop
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog

  const t = useMemo(
    () => ({
      videos: cat?.videos || "Videos",
      materials: cat?.materials || "Materials",
      exams: cat?.exams || "Exams",
      qbank: cat?.qbank || "QBank",
      assignments: cat?.assignments || "Assignments",
      continueWatching: cat?.continueWatching || "Continue to watch",
      views: cat?.views || "views",
      downloads: cat?.downloads || "downloads",
      min: cat?.min || "min",
      marks: cat?.marks || "marks",
      questions: cat?.questions || "questions",
      pts: cat?.pts || "pts",
      totalQuestions: cat?.totalQuestions || "Total Questions",
      byType: cat?.byType || "By Type",
      byDifficulty: cat?.byDifficulty || "By Difficulty",
      // Question types
      MULTIPLE_CHOICE: cat?.questionTypes?.MULTIPLE_CHOICE || "Multiple Choice",
      TRUE_FALSE: cat?.questionTypes?.TRUE_FALSE || "True/False",
      SHORT_ANSWER: cat?.questionTypes?.SHORT_ANSWER || "Short Answer",
      ESSAY: cat?.questionTypes?.ESSAY || "Essay",
      FILL_BLANK: cat?.questionTypes?.FILL_BLANK || "Fill in Blank",
      MATCHING: cat?.questionTypes?.MATCHING || "Matching",
      ORDERING: cat?.questionTypes?.ORDERING || "Ordering",
      MULTI_SELECT: cat?.questionTypes?.MULTI_SELECT || "Multi Select",
      // Difficulty levels
      EASY: cat?.difficulty?.EASY || "Easy",
      MEDIUM: cat?.difficulty?.MEDIUM || "Medium",
      HARD: cat?.difficulty?.HARD || "Hard",
      // Exam types
      midterm: cat?.examTypes?.midterm || "Midterm",
      final: cat?.examTypes?.final || "Final",
      chapter_test: cat?.examTypes?.chapter_test || "Chapter",
      practice: cat?.examTypes?.practice || "Practice",
      quiz: cat?.examTypes?.quiz || "Quiz",
      diagnostic:
        (cat?.examTypes as Record<string, string> | undefined)?.diagnostic ||
        "Diagnostic",
      // Material types
      TEXTBOOK: cat?.materialTypes?.TEXTBOOK || "Textbook",
      SYLLABUS: cat?.materialTypes?.SYLLABUS || "Syllabus",
      REFERENCE: cat?.materialTypes?.REFERENCE || "Reference",
      STUDY_GUIDE: cat?.materialTypes?.STUDY_GUIDE || "Study Guide",
      PROJECT: cat?.materialTypes?.PROJECT || "Project",
      WORKSHEET: cat?.materialTypes?.WORKSHEET || "Worksheet",
      PRESENTATION: cat?.materialTypes?.PRESENTATION || "Presentation",
      LESSON_NOTES: cat?.materialTypes?.LESSON_NOTES || "Lesson Notes",
      VIDEO_GUIDE: cat?.materialTypes?.VIDEO_GUIDE || "Video Guide",
      LAB_MANUAL: cat?.materialTypes?.LAB_MANUAL || "Lab Manual",
      OTHER: cat?.materialTypes?.OTHER || "Other",
      // Assignment types
      homework: cat?.assignmentTypes?.homework || "Homework",
      project: cat?.assignmentTypes?.project || "Project",
      lab: cat?.assignmentTypes?.lab || "Lab",
      essay: cat?.assignmentTypes?.essay || "Essay",
      presentation: cat?.assignmentTypes?.presentation || "Presentation",
      seeAll: cat?.seeAll || "See all",
      exploreQBank: cat?.exploreQBank || "Explore QBank",
      textbook: cat?.textbook || "Textbook",
      openTextbook: cat?.openTextbook || "Open Textbook",
      // Question type descriptions
      MULTIPLE_CHOICE_DESC:
        cat?.questionDescriptions?.MULTIPLE_CHOICE ||
        "Pick the best answer from multiple options provided",
      TRUE_FALSE_DESC:
        cat?.questionDescriptions?.TRUE_FALSE ||
        "Decide whether each given statement is true or false",
      SHORT_ANSWER_DESC:
        cat?.questionDescriptions?.SHORT_ANSWER ||
        "Write a brief response in one or two sentences",
      ESSAY_DESC:
        cat?.questionDescriptions?.ESSAY ||
        "Compose a detailed long-form answer with full explanation",
      FILL_BLANK_DESC:
        cat?.questionDescriptions?.FILL_BLANK ||
        "Complete the sentence by filling in the missing words",
      MATCHING_DESC:
        cat?.questionDescriptions?.MATCHING ||
        "Connect related items by pairing them from two columns",
      ORDERING_DESC:
        cat?.questionDescriptions?.ORDERING ||
        "Arrange the given items into their correct logical sequence",
      MULTI_SELECT_DESC:
        cat?.questionDescriptions?.MULTI_SELECT ||
        "Choose all the correct answers from the options given",
    }),
    [cat]
  )

  const hasVideos = data.videos.length > 0

  const accentColor = subjectColor ?? "#1e40af"

  return (
    <div className="mt-8 space-y-8">
      {hasVideos && (
        <ContentSection
          title={t.videos}
          accentColor={accentColor}
          actionHref={videosHref}
          actionLabel={t.continueWatching}
        >
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {data.videos.map((video) => (
              <Link
                key={video.id}
                href={
                  videoTileBasePath
                    ? `${videoTileBasePath}/${video.catalogLessonId}`
                    : videosHref
                }
                className="group relative w-60 shrink-0 overflow-hidden rounded-lg"
              >
                <div
                  className="relative aspect-[3/2]"
                  style={{
                    backgroundColor: video.color || accentColor || "#1a1a1a",
                  }}
                >
                  {video.thumbnailUrl && (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="240px"
                      unoptimized
                    />
                  )}
                  {/* Title — centered on image */}
                  <p className="absolute inset-0 line-clamp-2 flex items-center px-3 text-sm font-bold text-white drop-shadow-md">
                    {video.title}
                  </p>
                  {/* Metadata — Apple liquid glass bar */}
                  <div
                    className="absolute inset-x-0 bottom-0 z-10 px-2.5 pt-4 pb-1"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
                      backdropFilter: "blur(8px) saturate(110%)",
                      WebkitBackdropFilter: "blur(8px) saturate(110%)",
                      maskImage:
                        "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                    }}
                  >
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <Play className="size-3 fill-current" />
                      <span>{formatDuration(video.durationSeconds)}</span>
                      <span>&middot;</span>
                      <span>
                        {video.viewCount.toLocaleString()} {t.views}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ContentSection>
      )}

      <ContentSection
        title={t.materials}
        accentColor={accentColor}
        actionHref={materialsHref}
        actionLabel={t.seeAll}
      >
        <MaterialTypePipeline
          materials={data.materials}
          accentColor={accentColor}
          t={t}
          textbookPdfUrl={textbookPdfUrl}
          textbookCoverUrl={textbookCoverUrl}
        />
      </ContentSection>

      <ContentSection
        title={t.exams}
        accentColor={accentColor}
        actionHref={examsHref}
        actionLabel={t.seeAll}
      >
        <ExamTypePipeline exams={data.exams} accentColor={accentColor} t={t} />
      </ContentSection>

      <ContentSection
        title={t.qbank}
        accentColor={accentColor}
        actionHref={qbankHref}
        actionLabel={t.exploreQBank}
      >
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {Object.entries(QUESTION_TYPE_CONFIG).map(([type, config]) => {
            const card = data.questionStats.cards.find((c) => c.type === type)
            const cardColor = config.color ?? accentColor
            const typeName = t[type as keyof typeof t] ?? type
            const typeDescription =
              t[`${type}_DESC` as keyof typeof t] ?? config.description
            return (
              <div
                key={type}
                className="shrink-0 overflow-hidden rounded-xl"
                style={{ width: 245 }}
              >
                {/* Name */}
                <div className="bg-[#F4F1D0] px-3.5 py-2.5">
                  <p
                    className="font-mono text-sm font-bold tracking-tight"
                    style={{ color: "#212222" }}
                  >
                    {typeName}
                  </p>
                </div>
                {/* Frame with SVG filling entire area */}
                <div
                  className="relative"
                  style={{ backgroundColor: cardColor, height: 250 }}
                >
                  {config.svg && (
                    <Image
                      src={config.svg}
                      alt=""
                      fill
                      className="object-cover opacity-30"
                    />
                  )}
                  {/* Count badge */}
                  <div className="absolute end-3 top-3">
                    <span className="rounded-full bg-[#F4F1D0]/80 px-2 py-0.5 font-mono text-xs font-bold text-[#212222]">
                      {card?.count ?? 0}
                    </span>
                  </div>
                  {/* Divider + description overlaid at bottom */}
                  <div className="absolute inset-x-0 bottom-0 px-3.5 pb-6">
                    <div className="mb-2.5 h-[1.5px] w-8 bg-[#F4F1D0]" />
                    <p className="font-mono text-xs leading-relaxed text-[#F4F1D0]">
                      {typeDescription}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ContentSection>

      <ContentSection title={t.assignments} accentColor={accentColor}>
        {data.assignments.length > 0 ? (
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
            {data.assignments.map((assignment) => (
              <Card key={assignment.id} className="w-56 shrink-0">
                <CardContent className="p-3">
                  {assignment.assignmentType && (
                    <Badge
                      variant="secondary"
                      className="mb-2 text-[10px]"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                      }}
                    >
                      {t[assignment.assignmentType as keyof typeof t] ??
                        assignment.assignmentType}
                    </Badge>
                  )}
                  <p className="line-clamp-2 text-sm font-medium">
                    {assignment.title}
                  </p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {assignment.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {assignment.estimatedTime} {t.min}
                      </span>
                    )}
                    {assignment.totalPoints != null && (
                      <span>
                        {assignment.totalPoints} {t.pts}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">0 {t.assignments}</p>
        )}
      </ContentSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exam Type Pipeline
// ---------------------------------------------------------------------------

function ExamTypePipeline({
  exams,
  accentColor,
  t,
}: {
  exams: ExamItem[]
  accentColor: string
  t: Record<string, string>
}) {
  const typeGroups = useMemo(() => {
    const grouped: Record<
      string,
      {
        count: number
        durations: number[]
        questions: number[]
        marks: number[]
      }
    > = {}
    for (const exam of exams) {
      const key = exam.examType
      if (!grouped[key]) {
        grouped[key] = { count: 0, durations: [], questions: [], marks: [] }
      }
      grouped[key].count++
      if (exam.durationMinutes != null)
        grouped[key].durations.push(exam.durationMinutes)
      if (exam.totalQuestions != null)
        grouped[key].questions.push(exam.totalQuestions)
      if (exam.totalMarks != null) grouped[key].marks.push(exam.totalMarks)
    }

    // Order by pipeline constant, show ALL types (0 count when no data)
    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : null
    return EXAM_TYPE_PIPELINE.map((p) => {
      const g = grouped[p.key]
      return {
        key: p.key,
        label: t[p.key as keyof typeof t] ?? p.label,
        count: g?.count ?? 0,
        avgDuration: g ? avg(g.durations) : null,
        avgQuestions: g ? avg(g.questions) : null,
        avgMarks: g ? avg(g.marks) : null,
      }
    })
  }, [exams, t])

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {typeGroups.map((group) => (
        <div key={group.key} className="liquid-glass w-44 shrink-0">
          <div className="liquid-glass__filter" />
          <div className="liquid-glass__overlay" />
          <div className="liquid-glass__specular" />
          <div className="liquid-glass__content space-y-2 p-3">
            <p className="text-foreground text-sm font-bold">{group.label}</p>
            <p className="text-muted-foreground text-xs">
              {group.count}{" "}
              {TEST_TYPES.has(group.key)
                ? group.count === 1
                  ? "test"
                  : "tests"
                : group.count === 1
                  ? "exam"
                  : "exams"}
            </p>
            <div className="text-muted-foreground space-y-0.5 text-xs">
              {group.avgDuration != null && (
                <p className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0" />
                  {group.avgDuration} {t.min}
                </p>
              )}
              {group.avgQuestions != null && (
                <p className="flex items-center gap-1.5">
                  <FileText className="size-3 shrink-0" />
                  {group.avgQuestions} Q
                </p>
              )}
              {group.avgMarks != null && (
                <p className="flex items-center gap-1.5">
                  <span className="inline-flex size-3 shrink-0 items-center justify-center text-[10px]">
                    ✓
                  </span>
                  {group.avgMarks} {t.marks}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Material Type Pipeline
// ---------------------------------------------------------------------------

function MaterialTypePipeline({
  materials,
  accentColor,
  t,
  textbookPdfUrl,
  textbookCoverUrl,
}: {
  materials: MaterialItem[]
  accentColor: string
  t: Record<string, string>
  textbookPdfUrl: string | null
  textbookCoverUrl: string | null
}) {
  const [coverError, setCoverError] = useState(false)
  const hasTextbook = !!textbookPdfUrl || !!textbookCoverUrl

  const typeGroups = useMemo(() => {
    const grouped: Record<
      string,
      { count: number; pageCountSum: number; pageCountItems: number }
    > = {}
    for (const mat of materials) {
      const key = mat.type
      if (!grouped[key]) {
        grouped[key] = { count: 0, pageCountSum: 0, pageCountItems: 0 }
      }
      grouped[key].count++
      if (mat.pageCount != null) {
        grouped[key].pageCountSum += mat.pageCount
        grouped[key].pageCountItems++
      }
    }

    return MATERIAL_TYPE_PIPELINE.map((p) => {
      const g = grouped[p.key]
      const avgPages =
        g && g.pageCountItems > 0
          ? Math.round(g.pageCountSum / g.pageCountItems)
          : null
      return {
        key: p.key,
        icon: p.icon,
        label: t[p.key as keyof typeof t] ?? p.key,
        count: g?.count ?? 0,
        avgPages,
      }
    })
  }, [materials, t])

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {typeGroups.map((group) => {
        const Icon = group.icon

        if (group.key === "TEXTBOOK") {
          // Skip the empty textbook slot when neither a cover/PDF nor any
          // TEXTBOOK-typed material rows exist.
          if (!hasTextbook && group.count === 0) return null

          if (hasTextbook) {
            const Wrapper = textbookPdfUrl ? "a" : "div"
            const wrapperProps = textbookPdfUrl
              ? {
                  href: textbookPdfUrl,
                  target: "_blank" as const,
                  rel: "noopener noreferrer",
                }
              : {}
            return (
              <Wrapper
                key={group.key}
                {...wrapperProps}
                className="group relative block shrink-0 overflow-hidden"
                style={{ width: 180, height: 260 }}
              >
                {textbookCoverUrl && !coverError ? (
                  <Image
                    src={textbookCoverUrl}
                    alt={t.textbook ?? group.label}
                    fill
                    className="object-cover"
                    sizes="180px"
                    unoptimized
                    onError={() => setCoverError(true)}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <BookOpen className="size-20 text-white/10" />
                  </div>
                )}
              </Wrapper>
            )
          }
        }

        return (
          <div
            key={group.key}
            className="liquid-glass shrink-0"
            style={{ width: 180, height: 260 }}
          >
            <div className="liquid-glass__filter" />
            <div className="liquid-glass__overlay" />
            <div className="liquid-glass__specular" />
            <div className="liquid-glass__content space-y-2 p-3">
              <Icon className="text-muted-foreground size-5" />
              <p className="text-foreground text-sm font-bold">{group.label}</p>
              <p className="text-muted-foreground text-xs">
                {group.count} {group.count === 1 ? "item" : "items"}
              </p>
              {group.avgPages != null && (
                <p className="text-muted-foreground text-xs">
                  {group.avgPages} pg avg
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function ContentSection({
  title,
  count,
  icon: Icon,
  accentColor,
  actionHref,
  actionLabel,
  children,
}: {
  title: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
  accentColor: string
  actionHref?: string
  actionLabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <span style={{ color: accentColor }}>
            <Icon className="size-5" />
          </span>
        )}
        <h2 className="text-lg font-semibold">{title}</h2>
        {count != null && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="text-muted-foreground hover:text-foreground ms-auto text-xs transition-colors hover:underline"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
