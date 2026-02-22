"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeftRight,
  BookOpen,
  CheckCheck,
  CheckSquare,
  Clock,
  Download,
  FileText,
  ListOrdered,
  PenLine,
  Play,
  TextCursorInput,
  ToggleLeft,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

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
  type: string
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
  subdomain: string
  subjectSlug: string
  catalogSubjectId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}:00`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const QUESTION_TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  MULTIPLE_CHOICE: CheckSquare,
  TRUE_FALSE: ToggleLeft,
  SHORT_ANSWER: PenLine,
  ESSAY: FileText,
  FILL_BLANK: TextCursorInput,
  MATCHING: ArrowLeftRight,
  ORDERING: ListOrdered,
  MULTI_SELECT: CheckCheck,
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CatalogContentSections({
  data,
  lang,
  subjectColor,
  subdomain,
  subjectSlug,
  catalogSubjectId,
}: Props) {
  const isRTL = lang === "ar"

  const t = useMemo(
    () => ({
      videos: isRTL
        ? "\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a"
        : "Videos",
      materials: isRTL
        ? "\u0645\u0648\u0627\u062f \u062a\u0639\u0644\u064a\u0645\u064a\u0629"
        : "Materials",
      exams: isRTL
        ? "\u0627\u062e\u062a\u0628\u0627\u0631\u0627\u062a"
        : "Exams",
      qbank: isRTL
        ? "\u0628\u0646\u0643 \u0627\u0644\u0623\u0633\u0626\u0644\u0629"
        : "QBank",
      assignments: isRTL
        ? "\u0648\u0627\u062c\u0628\u0627\u062a"
        : "Assignments",
      continueWatching: isRTL
        ? "\u062a\u0627\u0628\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629"
        : "Continue to watch",
      views: isRTL ? "\u0645\u0634\u0627\u0647\u062f\u0629" : "views",
      downloads: isRTL ? "\u062a\u062d\u0645\u064a\u0644" : "downloads",
      min: isRTL ? "\u062f\u0642\u064a\u0642\u0629" : "min",
      marks: isRTL ? "\u062f\u0631\u062c\u0629" : "marks",
      questions: isRTL ? "\u0633\u0624\u0627\u0644" : "questions",
      pts: isRTL ? "\u0646\u0642\u0637\u0629" : "pts",
      totalQuestions: isRTL
        ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0623\u0633\u0626\u0644\u0629"
        : "Total Questions",
      byType: isRTL
        ? "\u062d\u0633\u0628 \u0627\u0644\u0646\u0648\u0639"
        : "By Type",
      byDifficulty: isRTL
        ? "\u062d\u0633\u0628 \u0627\u0644\u0635\u0639\u0648\u0628\u0629"
        : "By Difficulty",
      // Question types
      MULTIPLE_CHOICE: isRTL
        ? "\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u062a\u0639\u062f\u062f"
        : "Multiple Choice",
      TRUE_FALSE: isRTL ? "\u0635\u062d / \u062e\u0637\u0623" : "True/False",
      SHORT_ANSWER: isRTL
        ? "\u0625\u062c\u0627\u0628\u0629 \u0642\u0635\u064a\u0631\u0629"
        : "Short Answer",
      ESSAY: isRTL ? "\u0645\u0642\u0627\u0644\u064a" : "Essay",
      FILL_BLANK: isRTL
        ? "\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0641\u0631\u0627\u063a"
        : "Fill in Blank",
      MATCHING: isRTL ? "\u0645\u0637\u0627\u0628\u0642\u0629" : "Matching",
      ORDERING: isRTL ? "\u062a\u0631\u062a\u064a\u0628" : "Ordering",
      MULTI_SELECT: isRTL
        ? "\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u062a\u0639\u062f\u062f"
        : "Multi Select",
      // Difficulty levels
      EASY: isRTL ? "\u0633\u0647\u0644" : "Easy",
      MEDIUM: isRTL ? "\u0645\u062a\u0648\u0633\u0637" : "Medium",
      HARD: isRTL ? "\u0635\u0639\u0628" : "Hard",
      // Exam types
      midterm: isRTL ? "\u0646\u0635\u0641\u064a" : "Midterm",
      final: isRTL ? "\u0646\u0647\u0627\u0626\u064a" : "Final",
      chapter_test: isRTL
        ? "\u0627\u062e\u062a\u0628\u0627\u0631 \u0641\u0635\u0644"
        : "Chapter Test",
      practice: isRTL ? "\u062a\u062f\u0631\u064a\u0628\u064a" : "Practice",
      quiz: isRTL
        ? "\u0627\u062e\u062a\u0628\u0627\u0631 \u0642\u0635\u064a\u0631"
        : "Quiz",
      // Material types
      TEXTBOOK: isRTL ? "\u0643\u062a\u0627\u0628" : "Textbook",
      SYLLABUS: isRTL ? "\u0645\u0646\u0647\u062c" : "Syllabus",
      WORKSHEET: isRTL
        ? "\u0648\u0631\u0642\u0629 \u0639\u0645\u0644"
        : "Worksheet",
      STUDY_GUIDE: isRTL
        ? "\u062f\u0644\u064a\u0644 \u062f\u0631\u0627\u0633\u064a"
        : "Study Guide",
      REFERENCE: isRTL ? "\u0645\u0631\u062c\u0639" : "Reference",
      VIDEO_GUIDE: isRTL
        ? "\u062f\u0644\u064a\u0644 \u0641\u064a\u062f\u064a\u0648"
        : "Video Guide",
      LAB_MANUAL: isRTL
        ? "\u062f\u0644\u064a\u0644 \u0645\u062e\u062a\u0628\u0631"
        : "Lab Manual",
      OTHER: isRTL ? "\u0623\u062e\u0631\u0649" : "Other",
      // Assignment types
      homework: isRTL
        ? "\u0648\u0627\u062c\u0628 \u0645\u0646\u0632\u0644\u064a"
        : "Homework",
      project: isRTL ? "\u0645\u0634\u0631\u0648\u0639" : "Project",
      lab: isRTL ? "\u0645\u062e\u062a\u0628\u0631" : "Lab",
      essay: isRTL ? "\u0645\u0642\u0627\u0644" : "Essay",
      presentation: isRTL
        ? "\u0639\u0631\u0636 \u062a\u0642\u062f\u064a\u0645\u064a"
        : "Presentation",
      seeAll: isRTL ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "See all",
    }),
    [isRTL]
  )

  const hasVideos = data.videos.length > 0
  const hasMaterials = data.materials.length > 0
  const hasExams = data.exams.length > 0
  const hasQuestions = data.questionStats.cards.length > 0
  const hasAssignments = data.assignments.length > 0

  if (
    !hasVideos &&
    !hasMaterials &&
    !hasExams &&
    !hasQuestions &&
    !hasAssignments
  ) {
    return null
  }

  const accentColor = subjectColor ?? "#1e40af"

  return (
    <div className="mt-8 space-y-8">
      {hasVideos && (
        <ContentSection
          title={t.videos}
          accentColor={accentColor}
          actionHref={`/${lang}/s/${subdomain}/stream/dashboard/${subjectSlug}`}
          actionLabel={t.continueWatching}
        >
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {data.videos.map((video) => (
              <Link
                key={video.id}
                href={`/${lang}/s/${subdomain}/stream/dashboard/${subjectSlug}/${video.catalogLessonId}`}
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

      {hasMaterials && (
        <ContentSection title={t.materials} accentColor={accentColor}>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
            {data.materials.map((material) => (
              <Card key={material.id} className="w-52 shrink-0">
                <CardContent className="flex items-start gap-3 p-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    {material.type === "TEXTBOOK" ? (
                      <BookOpen className="size-5 text-white" />
                    ) : (
                      <FileText className="size-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">
                      {material.title}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {t[material.type as keyof typeof t] ?? material.type}
                    </Badge>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Download className="size-3" />
                      {material.downloadCount} {t.downloads}
                      {material.fileSize && (
                        <span className="text-muted-foreground/60">
                          {" \u00b7 "}
                          {formatFileSize(material.fileSize)}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ContentSection>
      )}

      {hasExams && (
        <ContentSection
          title={t.exams}
          accentColor={accentColor}
          actionHref={`/${lang}/s/${subdomain}/exams/upcoming?catalogSubjectId=${catalogSubjectId}`}
          actionLabel={t.seeAll}
        >
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
            {data.exams.map((exam) => (
              <Card key={exam.id} className="w-56 shrink-0">
                <CardContent className="p-3">
                  <Badge
                    variant="secondary"
                    className="mb-2 text-[10px]"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    {t[exam.examType as keyof typeof t] ?? exam.examType}
                  </Badge>
                  <p className="line-clamp-2 text-sm font-medium">
                    {exam.title}
                  </p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {exam.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {exam.durationMinutes} {t.min}
                      </span>
                    )}
                    {exam.totalMarks && (
                      <span>
                        {exam.totalMarks} {t.marks}
                      </span>
                    )}
                    {exam.totalQuestions && (
                      <span>
                        {exam.totalQuestions} {t.questions}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ContentSection>
      )}

      {hasQuestions && (
        <ContentSection
          title={t.qbank}
          accentColor={accentColor}
          actionHref={`/${lang}/s/${subdomain}/exams/qbank?catalogSubjectId=${catalogSubjectId}`}
          actionLabel={t.seeAll}
        >
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1">
            {data.questionStats.cards.map((card) => {
              const TypeIcon = QUESTION_TYPE_ICONS[card.type] ?? CheckSquare
              return (
                <Card key={card.type} className="w-52 shrink-0">
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="flex size-8 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <TypeIcon className="size-4" />
                      </div>
                      <p className="text-sm font-medium">
                        {t[card.type as keyof typeof t] ?? card.type}
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {card.count.toLocaleString()}{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        {t.questions}
                      </span>
                    </p>
                    {Object.keys(card.byDifficulty).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(card.byDifficulty).map(
                          ([difficulty, count]) => (
                            <Badge
                              key={difficulty}
                              variant="outline"
                              className="gap-1 text-[10px]"
                              style={{
                                borderColor:
                                  difficulty === "EASY"
                                    ? "#22c55e"
                                    : difficulty === "MEDIUM"
                                      ? "#eab308"
                                      : "#ef4444",
                              }}
                            >
                              {t[difficulty as keyof typeof t] ?? difficulty}
                              <span className="text-muted-foreground">
                                {count}
                              </span>
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ContentSection>
      )}

      {hasAssignments && (
        <ContentSection title={t.assignments} accentColor={accentColor}>
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
        </ContentSection>
      )}
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
