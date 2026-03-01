// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Single question dispatcher — replaces 4× duplicated QuestionRenderer
 * across classic.tsx, modern.tsx, formal.tsx, custom.tsx
 */

import React from "react"

import { EssayContent } from "./essay"
import { FillBlankContent } from "./fill-blank"
import { MatchingContent } from "./matching"
import { MultipleChoiceContent } from "./multiple-choice"
import { OrderingContent } from "./ordering"
import { ShortAnswerContent } from "./short-answer"
import { TrueFalseContent } from "./true-false"
import type { PaperTheme, QuestionForPaper } from "./types"

export interface QuestionRendererProps {
  question: QuestionForPaper
  theme: PaperTheme
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  answerLinesShort?: number
  answerLinesEssay?: number
}

export function QuestionRenderer({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
  answerLinesShort = 3,
  answerLinesEssay = 10,
}: QuestionRendererProps) {
  const common = { question, theme, showNumber, showPoints, showType }

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceContent {...common} />
    case "TRUE_FALSE":
      return <TrueFalseContent {...common} />
    case "FILL_BLANK":
      return <FillBlankContent {...common} />
    case "SHORT_ANSWER":
      return <ShortAnswerContent {...common} answerLines={answerLinesShort} />
    case "ESSAY":
      return <EssayContent {...common} answerLines={answerLinesEssay} />
    case "MATCHING":
      return <MatchingContent {...common} />
    case "ORDERING":
      return <OrderingContent {...common} />
    default:
      return null
  }
}
