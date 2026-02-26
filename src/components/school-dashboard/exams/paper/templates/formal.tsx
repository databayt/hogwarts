// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Formal Exam Paper Template
 * Government exam style with double-border frame, diagonal watermark,
 * Roman numeral sections, and strict formal formatting.
 * Production-quality: proper page breaks, binding margins, section dividers
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
// Roman Numerals
// ============================================================================

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const

function getRomanNumeral(index: number): string {
  return ROMAN_NUMERALS[index] || `${index + 1}`
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
      backgroundColor: "#FFFFFF",
    },

    // Double-border frame: outer 2pt, inner 1pt, 4pt gap
    outerFrame: {
      flex: 1,
      borderWidth: 2,
      borderColor: "#1F2937",
      padding: 4, // 4pt gap between outer and inner border
    },
    innerFrame: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#1F2937",
      padding: 12,
    },

    // Diagonal watermark
    watermark: {
      position: "absolute",
      top: "35%",
      left: "10%",
      width: "80%",
      textAlign: "center",
      fontSize: 72,
      color: "#E5E7EB",
      opacity: 0.06,
      fontFamily,
      fontWeight: "bold",
      transform: "rotate(-45deg)",
    },

    // Version code box - prominent, top-right
    versionCodeBox: {
      position: "absolute",
      top: topMargin + 8,
      right: PAGE_MARGINS.right + 8,
      borderWidth: 3,
      borderColor: "#1F2937",
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: "#F9FAFB",
    },
    versionCodeText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
      textAlign: "center",
    },
    versionCodeLabel: {
      fontSize: 7,
      color: "#6B7280",
      fontFamily,
      textAlign: "center",
      marginTop: 2,
    },

    content: {
      flex: 1,
    },

    questionsContainer: {
      marginTop: 18,
    },

    // Each question wrapper with dotted border-bottom separator
    questionWrapper: {
      marginBottom: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomStyle: "dashed",
      borderBottomColor: "#D1D5DB",
    },

    // Section title with Roman numerals
    sectionTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#1F2937",
      marginTop: 22,
      marginBottom: 12,
      paddingBottom: 6,
      letterSpacing: 0.5,
    },

    // Section divider - thicker for formal style
    sectionDivider: {
      borderBottomWidth: 2,
      borderBottomColor: "#1F2937",
      marginBottom: 4,
    },
    sectionDividerThin: {
      borderBottomWidth: 0.75,
      borderBottomColor: "#9CA3AF",
      marginBottom: 10,
    },

    // Disclaimer footer text
    disclaimer: {
      position: "absolute",
      bottom: 45,
      left: 50,
      right: 50,
      textAlign: "center",
      fontSize: 7,
      color: "#9CA3AF",
      fontFamily,
      letterSpacing: 0.3,
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
// Formal Template Component
// ============================================================================

interface FormalTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function FormalTemplate({
  data,
  groupByType = false,
}: FormalTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const locale = metadata.locale
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"
  const styles = createStyles(locale, orientation)
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"
  const isTwoColumn = config.layout === "TWO_COLUMN"
  const isBooklet = config.layout === "BOOKLET"

  // Section labels with Roman numerals
  const sectionLabels: Record<string, { en: string; ar: string }> = {
    MULTIPLE_CHOICE: {
      en: "Section I: Multiple Choice Questions",
      ar: "القسم I: أسئلة الاختيار من متعدد",
    },
    TRUE_FALSE: {
      en: "Section II: True or False",
      ar: "القسم II: صح أو خطأ",
    },
    FILL_BLANK: {
      en: "Section III: Fill in the Blanks",
      ar: "القسم III: أكمل الفراغات",
    },
    SHORT_ANSWER: {
      en: "Section IV: Short Answer Questions",
      ar: "القسم IV: أسئلة الإجابة القصيرة",
    },
    ESSAY: {
      en: "Section V: Essay Questions",
      ar: "القسم V: أسئلة المقال",
    },
    MATCHING: {
      en: "Section VI: Matching Questions",
      ar: "القسم VI: أسئلة المطابقة",
    },
    ORDERING: {
      en: "Section VII: Ordering Questions",
      ar: "القسم VII: أسئلة الترتيب",
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
      let sectionIndex = 0

      return typeOrder
        .filter((type) => grouped[type]?.length > 0)
        .map((type) => {
          const romanNum = getRomanNumeral(sectionIndex++)

          // Build dynamic label with Roman numeral from actual section position
          const dynamicLabel = {
            en: `Section ${romanNum}: ${(sectionLabels[type]?.en || type).replace(/^Section \w+: /, "")}`,
            ar: `القسم ${romanNum}: ${(sectionLabels[type]?.ar || type).replace(/^القسم \w+: /, "")}`,
          }

          const sectionQuestions = grouped[type].map((q) => ({
            ...q,
            order: globalOrder++,
          }))
          const questionElements = sectionQuestions.map(renderQuestion)

          return (
            <View key={type}>
              {/* Section header with double divider */}
              <View style={styles.sectionDivider} />
              <View style={styles.sectionDividerThin} />
              <Text style={styles.sectionTitle}>{dynamicLabel[locale]}</Text>
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

  // Disclaimer text
  const disclaimerText = isRTL
    ? "يُحظر إعادة إنتاج هذه الورقة أو نسخها بأي شكل من الأشكال دون إذن مسبق"
    : "Unauthorized reproduction of this examination paper is strictly prohibited"

  // Shared page props for reuse across all pages
  const pageProps = {
    size: config.pageSize as "A4" | "LETTER",
    orientation: (config.orientation === "landscape"
      ? "landscape"
      : "portrait") as "portrait" | "landscape",
  }

  // Footer element reused across pages
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
      {/* Booklet: Cover Page with formal treatment */}
      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          {/* Diagonal Watermark */}
          <Text style={styles.watermark} fixed>
            {school.name}
          </Text>

          {/* Version Code Box */}
          {metadata.versionCode && (
            <View style={styles.versionCodeBox} fixed>
              <Text style={styles.versionCodeText}>{metadata.versionCode}</Text>
              <Text style={styles.versionCodeLabel}>
                {isRTL ? "رمز النسخة" : "Version"}
              </Text>
            </View>
          )}

          {/* Double-border frame */}
          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
              <BookletCoverPage
                exam={exam}
                school={school}
                metadata={metadata}
                locale={locale}
                fontFamily={fontFamily}
              />
            </View>
          </View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer} fixed>
            {disclaimerText}
          </Text>

          {footerElement}
        </Page>
      )}

      {/* Booklet: Table of Contents with formal treatment */}
      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          {/* Diagonal Watermark */}
          <Text style={styles.watermark} fixed>
            {school.name}
          </Text>

          {/* Version Code Box */}
          {metadata.versionCode && (
            <View style={styles.versionCodeBox} fixed>
              <Text style={styles.versionCodeText}>{metadata.versionCode}</Text>
              <Text style={styles.versionCodeLabel}>
                {isRTL ? "رمز النسخة" : "Version"}
              </Text>
            </View>
          )}

          {/* Double-border frame */}
          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
              <BookletTOC
                questions={questions}
                locale={locale}
                fontFamily={fontFamily}
              />
            </View>
          </View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer} fixed>
            {disclaimerText}
          </Text>

          {footerElement}
        </Page>
      )}

      {/* Main Exam Paper */}
      <Page {...pageProps} style={styles.page} wrap>
        {/* Diagonal Watermark */}
        <Text style={styles.watermark} fixed>
          {school.name}
        </Text>

        {/* Prominent Version Code Box - top right */}
        {metadata.versionCode && (
          <View style={styles.versionCodeBox} fixed>
            <Text style={styles.versionCodeText}>{metadata.versionCode}</Text>
            <Text style={styles.versionCodeLabel}>
              {isRTL ? "رمز النسخة" : "Version"}
            </Text>
          </View>
        )}

        {/* Double-border frame */}
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            {/* Header with School Info (skip in booklet - cover page has it) */}
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

            {/* Student Info Section (skip in booklet - cover page has it) */}
            {!isBooklet && config.showStudentInfo && (
              <StudentInfo locale={locale} fontFamily={fontFamily} />
            )}

            {/* Instructions - rendered with thick left border via wrapper */}
            {config.showInstructions && (
              <View
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: "#1F2937",
                  paddingLeft: 10,
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                <Instructions
                  customInstructions={config.customInstructions ?? undefined}
                  totalMarks={metadata.totalMarks}
                  totalQuestions={metadata.totalQuestions}
                  duration={metadata.duration}
                  locale={locale}
                  fontFamily={fontFamily}
                />
              </View>
            )}

            {/* Questions */}
            <View style={styles.questionsContainer}>{renderQuestions()}</View>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer} fixed>
          {disclaimerText}
        </Text>

        {footerElement}
      </Page>

      {/* Separate Answer Sheet (if enabled) */}
      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
          {/* Watermark on answer sheet too */}
          <Text style={styles.watermark} fixed>
            {school.name}
          </Text>

          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
              <AnswerSheet
                questions={questions}
                isBubbleSheet={isBubbleSheet}
                exam={exam}
                school={school}
                locale={locale}
                fontFamily={fontFamily}
                versionCode={metadata.versionCode}
              />
            </View>
          </View>

          {/* Disclaimer on answer sheet */}
          <Text style={styles.disclaimer} fixed>
            {disclaimerText}
          </Text>

          {footerElement}
        </Page>
      )}
    </Document>
  )
}

export { createStyles }
