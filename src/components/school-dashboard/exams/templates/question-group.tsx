// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Group questions by type with section labels and dividers.
 * Handles automatic section lettering (A/أ, B/ب, …) and renumbering.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { Divider } from "./atom"
import { QUESTION_TYPE_LABELS, SECTION_LABELS } from "./config"
import { QuestionRenderer } from "./question-renderer"
import type { PaperTheme, QuestionForPaper, QuestionType } from "./types"

const TYPE_ORDER: QuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "ESSAY",
  "MATCHING",
  "ORDERING",
]

export interface QuestionGroupProps {
  questions: QuestionForPaper[]
  theme: PaperTheme
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  answerLinesShort?: number
  answerLinesEssay?: number
  groupByType?: boolean
}

/** Group questions by their questionType, preserving order within each group */
function groupByQuestionType(questions: QuestionForPaper[]) {
  const groups: Partial<Record<QuestionType, QuestionForPaper[]>> = {}
  for (const q of questions) {
    if (!groups[q.questionType]) groups[q.questionType] = []
    groups[q.questionType]!.push(q)
  }
  return groups
}

export function QuestionGroup({
  questions,
  theme,
  showNumber,
  showPoints,
  showType,
  answerLinesShort = 3,
  answerLinesEssay = 10,
  groupByType = false,
}: QuestionGroupProps) {
  const styles = StyleSheet.create({
    wrapper: { marginTop: 15 },
    sectionHeader: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginTop: theme.sectionGap,
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
      textTransform: "uppercase",
    },
    questionWrapper: { marginBottom: theme.questionGap },
  })

  const renderQuestion = (q: QuestionForPaper) => (
    <View key={q.id} style={styles.questionWrapper} wrap={false}>
      <QuestionRenderer
        question={q}
        theme={theme}
        showNumber={showNumber}
        showPoints={showPoints}
        showType={showType}
        answerLinesShort={answerLinesShort}
        answerLinesEssay={answerLinesEssay}
      />
    </View>
  )

  if (!groupByType) {
    return <View style={styles.wrapper}>{questions.map(renderQuestion)}</View>
  }

  // Grouped mode: section dividers + labels + renumbered questions
  const grouped = groupByQuestionType(questions)
  const sectionLetters = SECTION_LABELS[theme.locale]
  let sectionIdx = 0
  let globalOrder = 1

  return (
    <View style={styles.wrapper}>
      {TYPE_ORDER.filter((type) => grouped[type]?.length).map((type) => {
        const letter = sectionLetters[sectionIdx] || String(sectionIdx + 1)
        sectionIdx++

        const label =
          (QUESTION_TYPE_LABELS as Record<string, Record<string, string>>)[
            type
          ]?.[theme.locale] || type
        const sectionTitle = theme.isRTL
          ? `القسم ${letter}: ${label}`
          : `Section ${letter}: ${label}`

        const sectionQuestions = grouped[type]!.map((q) => ({
          ...q,
          order: globalOrder++,
        }))

        return (
          <View key={type}>
            <Divider theme={theme} />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{sectionTitle}</Text>
            </View>
            {sectionQuestions.map(renderQuestion)}
          </View>
        )
      })}
    </View>
  )
}
