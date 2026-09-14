"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, Clock, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { ShelfCard, shelfScroller } from "@/components/lumos/shared/shelf-card"

import { elongate, gradeLine, stageLine } from "./textbook/format"
import type { ReaderLabels } from "./textbook/types"

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

// Assignment tile material, measured off Figma iuYSGaRV8xkcEGnyIltPRg node
// 32:1950 (a 160px tile, 34px corners): #F8F8F8 face, a half-pixel rim, a
// white highlight along the top and bottom edges only (negative spread keeps
// it off the sides), and a soft drop shadow. The rim and highlights were
// fitted by rendering at the capture's 546% zoom and diffing pixels; the drop
// shadow (Figma: 0 8px 44px /20%) is deliberately softened to about half.
const ASSIGNMENT_TILE = cn(
  "w-56 shrink-0 rounded-[34px] bg-[#f8f8f8] text-neutral-900",
  "shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),inset_0_0_0_0.5px_rgba(0,0,0,0.25),inset_0_5px_3px_-1px_#fff,inset_0_-5px_3px_-1px_#fff]",
  "dark:bg-card dark:text-card-foreground dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.15),inset_0_5px_3px_-1px_rgba(255,255,255,0.06),inset_0_-5px_3px_-1px_rgba(255,255,255,0.06)]"
)

interface Props {
  data: ContentSectionsData
  lang: Locale
  subjectColor: string | null
  name: string
  subdomain: string
  subjectSlug: string
  catalogSubjectId: string
  textbookPdfUrl: string | null
  /** In-app reader route (`/${lang}/subjects/${slug}/textbook`); null when the subject has no PDF. */
  textbookReaderHref?: string | null
  textbookCoverUrl: string | null
  /** School level + grade of the subject — the two lines the textbook's own
   *  cover prints around its title. Omit and the tile shows the title alone. */
  subjectLevel?: string | null
  subjectGrade?: number | null
  /** The book's own title, as printed on its board — the untranslated subject
   *  name, so the tile and the reader's cover read alike. Defaults to `name`. */
  textbookTitle?: string
  /** Destination for the summary tile that sits beside the textbook. Empty
   *  while the summaries are still being written — the tile then shows but
   *  does not link. */
  summaryHref?: string
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

/** One colour per type, from the qbank tiles' palette below. */
const EXAM_TYPE_PIPELINE = [
  { key: "final", label: "Final", color: "#2C70B2" },
  { key: "midterm", label: "Midterm", color: "#825BA3" },
  { key: "chapter_test", label: "Chapter", color: "#4B976A" },
  { key: "quiz", label: "Quiz", color: "#CF6E30" },
  { key: "practice", label: "Practice", color: "#57908C" },
  { key: "diagnostic", label: "Diagnostic", color: "#D25E8C" },
] as const

const TEST_TYPES = new Set(["chapter_test", "quiz", "practice"])

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
  textbookReaderHref,
  textbookCoverUrl,
  subjectLevel = null,
  subjectGrade = null,
  textbookTitle,
  summaryHref = "",
  materialsHref = `/${lang}/subjects/${subjectSlug}/materials`,
  qbankHref = `/${lang}/exams/qbank?catalogSubjectId=${catalogSubjectId}`,
  examsHref = `/${lang}/exams/upcoming?catalogSubjectId=${catalogSubjectId}`,
  videosHref = `/${lang}/lumos/dashboard/${subjectSlug}`,
  videoTileBasePath = `/${lang}/lumos/dashboard/${subjectSlug}`,
}: Props) {
  // This component needs dictionary passed as prop - for now use useDictionary
  // since it's a client component that doesn't receive dictionary prop
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog

  const t = useMemo(
    () => ({
      videos: cat?.videos || "Videos",
      materials: cat?.materials || "Materials",
      summary: cat?.summary || "Summary",
      exams: cat?.exams || "Exams",
      qbank: cat?.qbank || "QBank",
      examsBook: cat?.examsBook || "Exams",
      referencesBook: cat?.referencesBook || "References",
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
      // Count units (singular / plural)
      unitExam: cat?.unitExam || "exam",
      unitExams: cat?.unitExams || "exams",
      unitTest: cat?.unitTest || "test",
      unitTests: cat?.unitTests || "tests",
      unitItem: cat?.unitItem || "item",
      unitItems: cat?.unitItems || "items",
      pagesAvg: cat?.pagesAvg || "pg avg",
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

  const readerLabels = useMemo(() => (cat?.reader ?? {}) as ReaderLabels, [cat])

  const hasVideos = data.videos.length > 0

  const accentColor = subjectColor ?? "#1e40af"

  return (
    <div className="mt-8 space-y-8">
      <ContentSection
        title={t.materials}
        accentColor={accentColor}
        actionHref={materialsHref}
        actionLabel={t.seeAll}
      >
        <MaterialTypePipeline
          accentColor={accentColor}
          t={t}
          textbookPdfUrl={textbookPdfUrl}
          textbookReaderHref={textbookReaderHref}
          textbookCoverUrl={textbookCoverUrl}
          textbookTitle={textbookTitle || name}
          summaryHref={summaryHref}
          qbankHref={qbankHref}
          examsHref={examsHref}
          materialsHref={materialsHref}
          subjectLevel={subjectLevel}
          subjectGrade={subjectGrade}
          readerLabels={readerLabels}
          lang={lang}
        />
      </ContentSection>

      {hasVideos && (
        <ContentSection
          title={t.videos}
          accentColor={accentColor}
          actionHref={videosHref}
          actionLabel={t.continueWatching}
        >
          {/* The lumos lesson page's "More from" shelf: the name under the
              artwork, the numbers as the eyebrow above it. */}
          <div className={shelfScroller}>
            {data.videos.map((video) => (
              <ShelfCard
                key={video.id}
                href={
                  videoTileBasePath
                    ? `${videoTileBasePath}/${video.catalogLessonId}`
                    : videosHref
                }
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                color={video.color || accentColor}
                titleBelow
                eyebrow={
                  <span className="inline-flex items-center gap-1 align-middle">
                    <Play className="size-3 fill-current" />
                    <span>{formatDuration(video.durationSeconds)}</span>
                    <span>&middot;</span>
                    <span>
                      {video.viewCount.toLocaleString()} {t.views}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        </ContentSection>
      )}

      {data.exams.length > 0 && (
        <ContentSection
          title={t.exams}
          accentColor={accentColor}
          actionHref={examsHref}
          actionLabel={t.seeAll}
        >
          <ExamTypePipeline exams={data.exams} href={examsHref} t={t} />
        </ContentSection>
      )}

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

      {data.assignments.length > 0 && (
        <ContentSection title={t.assignments} accentColor={accentColor}>
          {/* The scroller clips on both axes, so it is padded out far enough
              for the card's 24px shadow (dropped 4px) to render, then pulled
              back. */}
          <div className="no-scrollbar -mx-7 -mt-6 -mb-8 flex gap-4 overflow-x-auto px-7 pt-6 pb-8">
            {data.assignments.map((assignment) => (
              <div key={assignment.id} className={ASSIGNMENT_TILE}>
                <div className="p-5">
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
                </div>
              </div>
            ))}
          </div>
        </ContentSection>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exam Type Pipeline
// ---------------------------------------------------------------------------

function ExamTypePipeline({
  exams,
  href,
  t,
}: {
  exams: ExamItem[]
  /** Where a tile leads — the exams list. Empty on surfaces with none. */
  href: string
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

    // Pipeline order, and only the types this subject actually has — a row of
    // zero cards reads as a broken section, not as information.
    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : null
    return EXAM_TYPE_PIPELINE.filter((p) => grouped[p.key]).map((p) => {
      const g = grouped[p.key]
      return {
        key: p.key,
        color: p.color,
        label: t[p.key as keyof typeof t] ?? p.label,
        count: g.count,
        avgDuration: avg(g.durations),
        avgQuestions: avg(g.questions),
        avgMarks: avg(g.marks),
      }
    })
  }, [exams, t])

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {typeGroups.map((group) => {
        const unit = TEST_TYPES.has(group.key)
          ? group.count === 1
            ? t.unitTest
            : t.unitTests
          : group.count === 1
            ? t.unitExam
            : t.unitExams
        const stats = [
          { value: group.avgDuration, unit: t.min },
          { value: group.avgQuestions, unit: t.questions },
          { value: group.avgMarks, unit: t.marks },
        ]
        const tile = (
          <>
            {/* Name + how many — the qbank tiles' cream head, so the two rows
                read as one system. */}
            <div className="flex items-center justify-between gap-2 bg-[#F4F1D0] px-3.5 py-2.5 text-[#212222]">
              <p className="text-sm font-bold">{group.label}</p>
              <span className="text-xs font-semibold opacity-70">
                {group.count} {unit}
              </span>
            </div>
            {/* The averages, one per column, set large on the type's colour. */}
            <div
              className="grid grid-cols-3 divide-x divide-white/25 px-1 py-5 text-center text-white"
              style={{ backgroundColor: group.color }}
            >
              {stats.map((stat) => (
                <div key={stat.unit} className="px-1">
                  <p className="text-2xl leading-none font-bold tabular-nums">
                    {stat.value ?? "–"}
                  </p>
                  <p className="mt-1.5 text-[11px] text-white/80">
                    {stat.unit}
                  </p>
                </div>
              ))}
            </div>
          </>
        )
        const className =
          "block w-60 shrink-0 overflow-hidden rounded-xl transition-opacity hover:opacity-90"
        return href ? (
          <Link key={group.key} href={href} className={className}>
            {tile}
          </Link>
        ) : (
          <div key={group.key} className={className}>
            {tile}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Material Type Pipeline
// ---------------------------------------------------------------------------

function MaterialTypePipeline({
  accentColor,
  t,
  textbookPdfUrl,
  textbookReaderHref,
  textbookCoverUrl,
  textbookTitle,
  subjectLevel,
  subjectGrade,
  readerLabels,
  lang,
  summaryHref,
  qbankHref,
  examsHref,
  materialsHref,
}: {
  accentColor: string
  t: Record<string, string>
  textbookPdfUrl: string | null
  /** In-app reader route (`/${lang}/subjects/${slug}/textbook`); null when the subject has no PDF. */
  textbookReaderHref?: string | null
  textbookCoverUrl: string | null
  textbookTitle: string
  subjectLevel: string | null
  subjectGrade: number | null
  readerLabels: ReaderLabels
  lang: string
  summaryHref: string
  qbankHref: string
  examsHref: string
  materialsHref: string
}) {
  const [coverError, setCoverError] = useState(false)

  // The three lines a textbook prints on its board — the same words, from the
  // same labels, as the book's own first screen in the reader.
  const coverStage = stageLine(subjectLevel, readerLabels)
  const coverGrade = gradeLine(subjectGrade, subjectLevel, readerLabels, lang)

  // Every tile is off the same board: the textbook itself, which opens the
  // in-app reader (the raw PDF stays one click away inside it), then the books
  // around it, each marked by its own coloured label. Without a cover the board
  // falls back to the subject colour.
  const board = {
    coverUrl: coverError ? null : textbookCoverUrl,
    onCoverError: () => setCoverError(true),
    accentColor,
    alt: t.TEXTBOOK,
    stage: coverStage,
    title: textbookTitle,
    grade: coverGrade,
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      <BookCoverTile
        {...board}
        href={textbookReaderHref || textbookPdfUrl || null}
        external={!textbookReaderHref && !!textbookPdfUrl}
      />
      <BookCoverTile {...board} href={summaryHref || null} badge={t.summary} />
      <BookCoverTile
        {...board}
        href={qbankHref || null}
        badge={t.qbank}
        badgeClassName="bg-sky-600"
      />
      <BookCoverTile
        {...board}
        href={examsHref || null}
        badge={t.examsBook}
        badgeClassName="bg-rose-600"
      />
      <BookCoverTile
        {...board}
        href={materialsHref ? `${materialsHref}#material-type-REFERENCE` : null}
        badge={t.referencesBook}
        badgeClassName="bg-violet-600"
      />
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

// ---------------------------------------------------------------------------
// Book cover tile — the textbook and its summary, off one board
// ---------------------------------------------------------------------------

/**
 * A book as the reader's first screen prints it: the cover art, and over its
 * free head the three lines a textbook sets there — stage, title, grade. A
 * badge marks a tile that is not the book itself (the summary).
 */
function BookCoverTile({
  coverUrl,
  onCoverError,
  accentColor,
  alt,
  stage,
  title,
  grade,
  href,
  external = false,
  badge,
  badgeClassName = "bg-emerald-500",
}: {
  coverUrl: string | null
  onCoverError: () => void
  accentColor: string
  alt: string
  stage: string | null
  title: string
  grade: string | null
  href?: string | null
  external?: boolean
  badge?: string
  /** Label colour — one per kind, so two badged tiles never read alike. */
  badgeClassName?: string
}) {
  const className = "group relative block shrink-0 overflow-hidden"
  const style = { width: 180, height: 260 }

  const inner = (
    <>
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="180px"
          unoptimized
          onError={onCoverError}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <BookOpen className="size-20 text-white/10" />
        </div>
      )}
      {/* The board's free head, the way the reader's cover sets it: stage,
          title, grade centred in the upper half under a white veil. The ink is
          fixed rather than tokenised — the veil is always white, so a dark-mode
          foreground would vanish. */}
      <div
        className="absolute inset-x-0 top-0 flex h-1/2 flex-col items-center justify-center gap-0.5 px-2.5 pt-3 pb-2 text-center"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.95) 58%, rgba(255,255,255,0.72) 82%, rgba(255,255,255,0) 100%)",
          color: "#1c1c1e",
          fontFamily:
            'var(--font-thmanyah-text), ui-serif, Georgia, "Times New Roman", serif',
        }}
      >
        {stage && (
          <p className="text-[11px] leading-tight font-semibold">{stage}</p>
        )}
        <p className="line-clamp-2 text-lg leading-tight font-bold text-balance">
          {elongate(title)}
        </p>
        {grade && (
          <p className="text-[11px] leading-tight font-semibold">{grade}</p>
        )}
      </div>
      {badge && (
        <span
          className={cn(
            "absolute start-0 top-0 z-10 p-0 text-xl leading-none font-bold text-white",
            badgeClassName
          )}
        >
          {badge}
        </span>
      )}
    </>
  )

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {inner}
      </a>
    )
  }
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    )
  }
  return (
    <div className={className} style={style}>
      {inner}
    </div>
  )
}
