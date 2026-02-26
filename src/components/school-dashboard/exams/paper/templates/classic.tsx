// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Classic Exam Paper Template
 * Traditional academic style with school header and structured layout
 * Production-quality: proper page breaks, binding margins, section dividers
 */

import React from "react"
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

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
// Font Registration
// ============================================================================

Font.register({
  family: "Rubik",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UE80V4bVkA.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFUk80V4bVkA.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4hAVU80V4bVkA.ttf",
      fontWeight: "bold",
    },
  ],
})

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "bold",
    },
  ],
})

// Disable hyphenation for cleaner text
Font.registerHyphenationCallback((word) => [word])

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
      lineHeight: 1.4,
      backgroundColor: "#FFFFFF",
    },
    content: {
      flex: 1,
    },
    questionsContainer: {
      marginTop: 15,
    },
    // wrap={false} prevents splitting a question across pages
    questionWrapper: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1F2937",
      marginTop: 20,
      marginBottom: 10,
      paddingBottom: 5,
      textTransform: "uppercase",
    },
    // Section divider line between question type groups
    sectionDivider: {
      borderBottomWidth: 1.5,
      borderBottomColor: "#9CA3AF",
      marginBottom: 5,
    },
    sectionDividerThin: {
      borderBottomWidth: 0.5,
      borderBottomColor: "#D1D5DB",
      marginBottom: 10,
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
// Classic Template Component
// ============================================================================

interface ClassicTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function ClassicTemplate({
  data,
  groupByType = false,
}: ClassicTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const locale = metadata.locale
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"
  const styles = createStyles(locale, orientation)
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"

  // Section labels
  const sectionLabels: Record<string, { en: string; ar: string }> = {
    MULTIPLE_CHOICE: {
      en: "Section A: Multiple Choice Questions",
      ar: "القسم أ: أسئلة الاختيار من متعدد",
    },
    TRUE_FALSE: { en: "Section B: True or False", ar: "القسم ب: صح أو خطأ" },
    FILL_BLANK: {
      en: "Section C: Fill in the Blanks",
      ar: "القسم ج: أكمل الفراغات",
    },
    SHORT_ANSWER: {
      en: "Section D: Short Answer Questions",
      ar: "القسم د: أسئلة الإجابة القصيرة",
    },
    ESSAY: { en: "Section E: Essay Questions", ar: "القسم هـ: أسئلة المقال" },
    MATCHING: {
      en: "Section F: Matching Questions",
      ar: "القسم و: أسئلة المطابقة",
    },
    ORDERING: {
      en: "Section G: Ordering Questions",
      ar: "القسم ز: أسئلة الترتيب",
    },
  }

  const isTwoColumn = config.layout === "TWO_COLUMN"
  const isBooklet = config.layout === "BOOKLET"

  // Render a single question element
  const renderQuestion = (q: QuestionForPaper) => (
    <View key={q.id} style={styles.questionWrapper} wrap={false}>
      <QuestionRenderer
        question={q}
        showNumber={config.showQuestionNumbers}
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
          const questionElements = sectionQuestions.map(renderQuestion)

          return (
            <View key={type}>
              <View style={styles.sectionDivider} />
              <View style={styles.sectionDividerThin} />
              <Text style={styles.sectionTitle}>
                {sectionLabels[type]?.[locale] || type}
              </Text>
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
    const questionElements = questions.map(renderQuestion)

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
        {/* Header (skip in booklet mode - cover page has it) */}
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

        {/* Student Info (skip in booklet mode - cover page has it) */}
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

        {footerElement}
      </Page>

      {/* Answer Sheet */}
      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
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
