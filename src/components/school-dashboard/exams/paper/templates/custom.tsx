// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Custom (Brand-Aware) Exam Paper Template
 * Reads school branding colors and applies them throughout the paper.
 * Falls back to Classic colors (#1F2937, #6B7280) when no branding is configured.
 */

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { PAGE_MARGINS } from "../config"
import type { ExamPaperData, QuestionForPaper, SchoolForPaper } from "../types"
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
// Brand Color Extraction
// ============================================================================

function extractBrandColors(school: SchoolForPaper) {
  const primaryColor = school.branding?.primaryColor || "#1F2937"
  const secondaryColor = school.branding?.secondaryColor || "#6B7280"
  return { primaryColor, secondaryColor }
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (
  locale: "en" | "ar" = "en",
  orientation: "portrait" | "landscape" = "portrait",
  primaryColor: string,
  secondaryColor: string
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
    // Brand color header bar: 6pt tall strip across full page width
    headerBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      backgroundColor: primaryColor,
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
      color: primaryColor,
      marginTop: 20,
      marginBottom: 10,
      paddingBottom: 5,
      textTransform: "uppercase",
    },
    // Section divider line between question type groups
    sectionDivider: {
      borderBottomWidth: 1.5,
      borderBottomColor: primaryColor,
      marginBottom: 5,
    },
    sectionDividerThin: {
      borderBottomWidth: 0.5,
      borderBottomColor: secondaryColor,
      marginBottom: 10,
    },
    // Question number badge: rounded square with primary color background
    questionNumberBadge: {
      width: 22,
      height: 22,
      borderRadius: 4,
      backgroundColor: primaryColor,
      justifyContent: "center",
      alignItems: "center",
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    questionNumberText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "bold",
      fontFamily,
    },
    // Instructions box with secondary color border
    instructionsBox: {
      borderWidth: 1,
      borderColor: secondaryColor,
      borderRadius: 4,
      padding: 10,
      marginBottom: 12,
    },
    // Meta text in secondary color
    metaText: {
      fontSize: 9,
      color: secondaryColor,
      fontFamily,
    },
    // Accent line using secondary color
    accentLine: {
      borderBottomWidth: 0.75,
      borderBottomColor: secondaryColor,
      marginVertical: 6,
    },
    // Footer border override using primary color
    footerBorder: {
      borderTopWidth: 1,
      borderTopColor: primaryColor,
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
// Custom Template Component
// ============================================================================

interface CustomTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function CustomTemplate({
  data,
  groupByType = false,
}: CustomTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const locale = metadata.locale
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"

  // Extract brand colors with fallbacks
  const { primaryColor, secondaryColor } = extractBrandColors(school)
  const styles = createStyles(locale, orientation, primaryColor, secondaryColor)

  const isTwoColumn = config.layout === "TWO_COLUMN"
  const isBooklet = config.layout === "BOOKLET"

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
              {/* Section header with brand-colored divider */}
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
          {/* Brand color header bar */}
          <View style={styles.headerBar} fixed />
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
          {/* Brand color header bar */}
          <View style={styles.headerBar} fixed />
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
        {/* Brand color header bar across full page width */}
        <View style={styles.headerBar} fixed />

        {/* Header with School Info (larger logo: 80x80) - skip in booklet mode */}
        {!isBooklet && (config.showSchoolLogo || config.showExamTitle) && (
          <Header
            school={school}
            exam={exam}
            showLogo={config.showSchoolLogo}
            showTitle={config.showExamTitle}
            locale={locale}
            fontFamily={fontFamily}
            versionCode={metadata.versionCode}
            logoSize={80}
          />
        )}

        {/* Student Info Section - skip in booklet mode (cover page has it) */}
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

      {/* Separate Answer Sheet (if enabled) */}
      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
          {/* Brand color header bar on answer sheet too */}
          <View style={styles.headerBar} fixed />

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
