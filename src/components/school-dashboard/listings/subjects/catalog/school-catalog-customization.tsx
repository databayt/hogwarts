"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { ChevronDown, ChevronRight, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { LessonContributionDialog } from "./lesson-contributions"
import { TopicOverrides } from "./topic-overrides"

interface Lesson {
  id: string
  name: string
  isHidden: boolean
  videoCount?: number
}

interface Chapter {
  id: string
  name: string
  isHidden: boolean
  lessons: Lesson[]
}

interface Props {
  chapters: Chapter[]
  catalogSubjectId: string
  lang: Locale
}

export function SchoolCatalogCustomization({
  chapters,
  catalogSubjectId,
  lang,
}: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined
  const [open, setOpen] = useState(false)

  // Contribution dialog state
  const [contributeOpen, setContributeOpen] = useState(false)
  const [contributeLessonId, setContributeLessonId] = useState("")
  const [contributeChapterId, setContributeChapterId] = useState<
    string | undefined
  >()
  const [contributeLessonName, setContributeLessonName] = useState("")

  function handleContribute(
    lessonId: string,
    lessonName: string,
    chapterId?: string
  ) {
    setContributeLessonId(lessonId)
    setContributeLessonName(lessonName)
    setContributeChapterId(chapterId)
    setContributeOpen(true)
  }

  if (chapters.length === 0) return null

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4 rtl:rotate-180" />
            )}
            {cat?.customizeContent || "Customize Content"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          <TopicOverrides chapters={chapters} lang={lang} />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const firstLesson = chapters[0]?.lessons[0]
                if (firstLesson) {
                  handleContribute(
                    firstLesson.id,
                    firstLesson.name,
                    chapters[0].id
                  )
                }
              }}
              disabled={!chapters.some((ch) => ch.lessons.length > 0)}
            >
              <PlusCircle className="me-2 size-4" />
              {cat?.contribute || "Contribute"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {contributeOpen && (
        <LessonContributionDialog
          open={contributeOpen}
          onOpenChange={setContributeOpen}
          catalogSubjectId={catalogSubjectId}
          catalogChapterId={contributeChapterId}
          catalogLessonId={contributeLessonId}
          lessonName={contributeLessonName}
        />
      )}
    </>
  )
}
