"use client"

import { useState, useTransition } from "react"
import { BookOpen, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Locale } from "@/components/internationalization/config"

import { toggleContentOverride } from "./actions"

interface Lesson {
  id: string
  name: string
  isHidden: boolean
}

interface Chapter {
  id: string
  name: string
  isHidden: boolean
  lessons: Lesson[]
}

interface Props {
  chapters: Chapter[]
  lang: Locale
}

export function TopicOverrides({ chapters, lang }: Props) {
  const isRTL = lang === "ar"
  const [isPending, startTransition] = useTransition()

  const t = {
    hide: isRTL ? "إخفاء" : "Hide",
    show: isRTL ? "إظهار" : "Show",
    hidden: isRTL ? "مخفي" : "Hidden",
    lessons: isRTL ? "دروس" : "lessons",
    noChapters: isRTL ? "لا توجد فصول" : "No chapters available",
  }

  function handleToggleChapter(chapterId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await toggleContentOverride({
        catalogChapterId: chapterId,
        isHidden: !currentlyHidden,
      })
    })
  }

  function handleToggleLesson(lessonId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await toggleContentOverride({
        catalogLessonId: lessonId,
        isHidden: !currentlyHidden,
      })
    })
  }

  if (chapters.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t.noChapters}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {chapters.map((chapter) => (
        <ChapterRow
          key={chapter.id}
          chapter={chapter}
          t={t}
          onToggleChapter={handleToggleChapter}
          onToggleLesson={handleToggleLesson}
          isPending={isPending}
        />
      ))}
    </div>
  )
}

function ChapterRow({
  chapter,
  t,
  onToggleChapter,
  onToggleLesson,
  isPending,
}: {
  chapter: Chapter
  t: Record<string, string>
  onToggleChapter: (id: string, hidden: boolean) => void
  onToggleLesson: (id: string, hidden: boolean) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-sm">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span
            className={cn(
              "font-medium",
              chapter.isHidden && "line-through opacity-50"
            )}
          >
            {chapter.name}
          </span>
          <Badge variant="outline" className="ml-auto text-xs">
            {chapter.lessons.length} {t.lessons}
          </Badge>
          {chapter.isHidden && (
            <Badge variant="secondary" className="text-xs">
              {t.hidden}
            </Badge>
          )}
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={isPending}
          onClick={() => onToggleChapter(chapter.id, chapter.isHidden)}
        >
          {chapter.isHidden ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>
      <CollapsibleContent>
        <div className="ml-6 space-y-0.5 border-l py-1 pl-4">
          {chapter.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center gap-2 py-1 text-sm"
            >
              <BookOpen className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span
                className={cn(
                  "text-muted-foreground flex-1",
                  lesson.isHidden && "line-through opacity-50"
                )}
              >
                {lesson.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={isPending}
                onClick={() => onToggleLesson(lesson.id, lesson.isHidden)}
              >
                {lesson.isHidden ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
          {chapter.lessons.length === 0 && (
            <p className="text-muted-foreground py-2 text-xs">No lessons yet</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
