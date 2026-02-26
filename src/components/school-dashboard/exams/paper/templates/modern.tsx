// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Modern Exam Paper Template
 * Clean minimalist design with blue accents, card-style question containers,
 * numbered circles, dotted answer lines, and wider spacing
 */

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { PAGE_MARGINS } from "../config"
import type { ExamPaperData, QuestionForPaper } from "../types"
import { AnswerSheet } from "./components/answer-sheet"
import { EssayQuestion } from "./components/essay-question"
import { FillBlankQuestion } from "./components/fill-blank"
import { Footer } from "./components/footer"
import { Header } from "./components/header"
import { Instructions } from "./components/instructions"
import { MatchingQuestion } from "./components/matching-question"
import { MCQQuestion } from "./components/mcq-question"
import { OrderingQuestion } from "./components/ordering-question"
import { ShortAnswerQuestion } from "./components/short-answer"
import { StudentInfo } from "./components/student-info"
import { TrueFalseQuestion } from "./components/tf-question"
import { BookletCoverPage, BookletTOC } from "./layouts/booklet"
import { TwoColumnLayout } from "./layouts/two-column"

// ============================================================================
// Colors
// ============================================================================

const MODERN_COLORS = {
  accent: "#3B82F6",
  accentLight: "#DBEAFE",
  cardBg: "#F9FAFB",
  cardBorder: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  white: "#FFFFFF",
  answerLine: "#D1D5DB",
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (
  locale: "en" | "ar" = "en",
  orientation: "portrait" | "landscape" = "portrait"
) => {
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"

  // Binding margin: extra space on the left (portrait) or top (landscape) for stapling
  const bindingMargin = 15
  const leftMargin =
    orientation === "portrait"
      ? PAGE_MARGINS.left + bindingMargin
      : PAGE_MARGINS.left
  const topMargin =
    orientation === "landscape"
      ? PAGE_MARGINS.top + bindingMargin
      : PAGE_MARGINS.top

  return StyleSheet.create({
    page: {
      paddingTop: topMargin,
      paddingBottom: PAGE_MARGINS.bottom + 20, // Extra for footer
      paddingLeft: leftMargin,
      paddingRight: PAGE_MARGINS.right,
      fontFamily,
      fontSize: 11,
      lineHeight: 1.5,
      backgroundColor: MODERN_COLORS.white,
    },
    // Blue accent bar at the very top of the page
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: MODERN_COLORS.accent,
    },
    content: {
      flex: 1,
    },
    questionsContainer: {
      marginTop: 20,
    },
    // Card-style question wrapper with light gray background and rounded corners
    questionCard: {
      marginBottom: 24,
      backgroundColor: MODERN_COLORS.cardBg,
      borderWidth: 1,
      borderColor: MODERN_COLORS.cardBorder,
      borderRadius: 6,
      padding: 14,
    },
    // Question number circle container
    questionNumberRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    // Blue circle with white number
    questionNumberCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: MODERN_COLORS.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    questionNumberText: {
      color: MODERN_COLORS.white,
      fontSize: 9,
      fontWeight: "bold",
      textAlign: "center",
    },
    // Section header with blue accent
    sectionHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 14,
      gap: 8,
    },
    sectionAccentBar: {
      width: 3,
      height: 18,
      backgroundColor: MODERN_COLORS.accent,
      borderRadius: 2,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: MODERN_COLORS.accent,
      textTransform: "uppercase",
    },
    // Thin subtle separator between sections
    sectionSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: MODERN_COLORS.cardBorder,
      borderStyle: "dashed",
      marginBottom: 6,
    },
  })
}

// ============================================================================
// Question Renderer
// ============================================================================

interface QuestionRendererProps {
  question: QuestionForPaper
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  answerLinesShort: number
  answerLinesEssay: number
  locale: "en" | "ar"
  fontFamily: string
}

function QuestionRenderer({
  question,
  showNumber,
  showPoints,
  showType,
  answerLinesShort,
  answerLinesEssay,
  locale,
  fontFamily,
}: QuestionRendererProps) {
  const commonProps = {
    question,
    showNumber,
    showPoints,
    showType,
    locale,
    fontFamily,
  }

  switch (question.questionType) {
    case "MULTIPLE_CHOICE":
      return <MCQQuestion {...commonProps} />

    case "TRUE_FALSE":
      return <TrueFalseQuestion {...commonProps} />

    case "FILL_BLANK":
      return <FillBlankQuestion {...commonProps} />

    case "SHORT_ANSWER":
      return (
        <ShortAnswerQuestion {...commonProps} answerLines={answerLinesShort} />
      )

    case "ESSAY":
      return <EssayQuestion {...commonProps} answerLines={answerLinesEssay} />

    case "MATCHING":
      return <MatchingQuestion {...commonProps} />

    case "ORDERING":
      return <OrderingQuestion {...commonProps} />

    default:
      return null
  }
}

// ============================================================================
// Group Questions by Type
// ============================================================================

function groupQuestionsByType(questions: QuestionForPaper[]) {
  const groups: Record<string, QuestionForPaper[]> = {}

  for (const q of questions) {
    if (!groups[q.questionType]) {
      groups[q.questionType] = []
    }
    groups[q.questionType].push(q)
  }

  return groups
}

// ============================================================================
// Modern Template Component
// ============================================================================

interface ModernTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function ModernTemplate({
  data,
  groupByType = false,
}: ModernTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const locale = metadata.locale
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"
  const styles = createStyles(locale, orientation)
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"
  const isTwoColumn = config.layout === "TWO_COLUMN"
  const isBooklet = config.layout === "BOOKLET"

  // Section labels
  const sectionLabels: Record<string, { en: string; ar: string }> = {
    MULTIPLE_CHOICE: {
      en: "Section A: Multiple Choice Questions",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u0623: \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F",
    },
    TRUE_FALSE: {
      en: "Section B: True or False",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u0628: \u0635\u062D \u0623\u0648 \u062E\u0637\u0623",
    },
    FILL_BLANK: {
      en: "Section C: Fill in the Blanks",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u062C: \u0623\u0643\u0645\u0644 \u0627\u0644\u0641\u0631\u0627\u063A\u0627\u062A",
    },
    SHORT_ANSWER: {
      en: "Section D: Short Answer Questions",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u062F: \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0642\u0635\u064A\u0631\u0629",
    },
    ESSAY: {
      en: "Section E: Essay Questions",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u0647\u0640: \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0642\u0627\u0644",
    },
    MATCHING: {
      en: "Section F: Matching Questions",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u0648: \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629",
    },
    ORDERING: {
      en: "Section G: Ordering Questions",
      ar: "\u0627\u0644\u0642\u0633\u0645 \u0632: \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u062A\u0631\u062A\u064A\u0628",
    },
  }

  // Render questions inside card-style containers with number circles
  const renderQuestionCard = (q: QuestionForPaper) => (
    <View key={q.id} style={styles.questionCard} wrap={false}>
      {/* Question number circle */}
      {config.showQuestionNumbers && (
        <View style={styles.questionNumberRow}>
          <View style={styles.questionNumberCircle}>
            <Text style={styles.questionNumberText}>{q.order}</Text>
          </View>
        </View>
      )}
      <QuestionRenderer
        question={q}
        showNumber={false}
        showPoints={config.showPointsPerQuestion}
        showType={config.showQuestionType ?? false}
        answerLinesShort={config.answerLinesShort}
        answerLinesEssay={config.answerLinesEssay}
        locale={locale}
        fontFamily={fontFamily}
      />
    </View>
  )

  // Render questions with layout awareness
  const renderQuestions = () => {
    if (groupByType) {
      const grouped = groupQuestionsByType(questions)
      const typeOrder = [
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "FILL_BLANK",
        "SHORT_ANSWER",
        "ESSAY",
        "MATCHING",
        "ORDERING",
      ]
      let globalOrder = 1

      return typeOrder
        .filter((type) => grouped[type]?.length > 0)
        .map((type) => {
          const sectionQuestions = grouped[type].map((q) => ({
            ...q,
            order: globalOrder++,
          }))
          const questionElements = sectionQuestions.map(renderQuestionCard)

          return (
            <View key={type}>
              {/* Section separator */}
              <View style={styles.sectionSeparator} />
              {/* Section header with blue accent bar */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccentBar} />
                <Text style={styles.sectionTitle}>
                  {sectionLabels[type]?.[locale] || type}
                </Text>
              </View>
              {isTwoColumn ? (
                <TwoColumnLayout questions={sectionQuestions} locale={locale}>
                  {questionElements}
                </TwoColumnLayout>
              ) : (
                questionElements
              )}
            </View>
          )
        })
    }

    // Sequential order
    const questionElements = questions.map(renderQuestionCard)

    if (isTwoColumn) {
      return (
        <TwoColumnLayout questions={questions} locale={locale}>
          {questionElements}
        </TwoColumnLayout>
      )
    }

    return questionElements
  }

  // Determine if we need a separate answer sheet
  const needsAnswerSheet = config.answerSheetType !== "NONE"
  const isBubbleSheet = config.answerSheetType === "BUBBLE"

  const pageProps = {
    size: config.pageSize as "A4" | "LETTER",
    orientation: (config.orientation === "landscape"
      ? "landscape"
      : "portrait") as "portrait" | "landscape",
  }

  const footerElement = config.showPageNumbers && (
    <Footer
      showTotal={config.showTotalPages}
      customText={config.customFooter ?? undefined}
      versionCode={metadata.versionCode}
      locale={locale}
      fontFamily={fontFamily}
    />
  )

  return (
    <Document>
      {/* Booklet: Cover Page */}
      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          {/* Blue accent bar */}
          <View style={styles.accentBar} fixed />
          <BookletCoverPage
            exam={exam}
            school={school}
            metadata={metadata}
            locale={locale}
            fontFamily={fontFamily}
          />
          {footerElement}
        </Page>
      )}

      {/* Booklet: Table of Contents */}
      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          {/* Blue accent bar */}
          <View style={styles.accentBar} fixed />
          <BookletTOC
            questions={questions}
            locale={locale}
            fontFamily={fontFamily}
          />
          {footerElement}
        </Page>
      )}

      {/* Main Exam Paper */}
      <Page {...pageProps} style={styles.page} wrap>
        {/* Blue accent bar at the top of every page */}
        <View style={styles.accentBar} fixed />

        {/* Header with School Info (skip in booklet mode - cover page has it) */}
        {!isBooklet && (config.showSchoolLogo || config.showExamTitle) && (
          <Header
            school={school}
            exam={exam}
            showLogo={config.showSchoolLogo}
            showTitle={config.showExamTitle}
            locale={locale}
            fontFamily={fontFamily}
            versionCode={metadata.versionCode}
          />
        )}

        {/* Student Info Section (skip in booklet mode - cover page has it) */}
        {!isBooklet && config.showStudentInfo && (
          <StudentInfo locale={locale} fontFamily={fontFamily} />
        )}

        {/* Instructions */}
        {config.showInstructions && (
          <Instructions
            customInstructions={config.customInstructions ?? undefined}
            totalMarks={metadata.totalMarks}
            totalQuestions={metadata.totalQuestions}
            duration={metadata.duration}
            locale={locale}
            fontFamily={fontFamily}
          />
        )}

        {/* Questions */}
        <View style={styles.questionsContainer}>{renderQuestions()}</View>

        {/* Footer with dynamic page numbers */}
        {footerElement}
      </Page>

      {/* Separate Answer Sheet (if enabled) */}
      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
          {/* Blue accent bar on answer sheet too */}
          <View style={styles.accentBar} fixed />

          <AnswerSheet
            questions={questions}
            isBubbleSheet={isBubbleSheet}
            exam={exam}
            school={school}
            locale={locale}
            fontFamily={fontFamily}
            versionCode={metadata.versionCode}
          />

          {footerElement}
        </Page>
      )}
    </Document>
  )
}

export { createStyles }
