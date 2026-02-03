/**
 * Classic Exam Paper Template
 * Traditional academic style with school header and structured layout
 */

import React from "react"
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { PAGE_DIMENSIONS, PAGE_MARGINS } from "../config"
import type { ExamPaperData, QuestionForPaper } from "../types"
import { AnswerSheet } from "./components/answer-sheet"
import { EssayQuestion } from "./components/essay-question"
import { FillBlankQuestion } from "./components/fill-blank"
import { Footer } from "./components/footer"
import { Header } from "./components/header"
import { Instructions } from "./components/instructions"
import { MCQQuestion } from "./components/mcq-question"
import { ShortAnswerQuestion } from "./components/short-answer"
import { StudentInfo } from "./components/student-info"
import { TrueFalseQuestion } from "./components/tf-question"

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

const createStyles = (locale: "en" | "ar" = "en") => {
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"

  return StyleSheet.create({
    page: {
      paddingTop: PAGE_MARGINS.top,
      paddingBottom: PAGE_MARGINS.bottom + 20, // Extra for footer
      paddingLeft: PAGE_MARGINS.left,
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
    questionWrapper: {
      marginBottom: 20,
      breakInside: "avoid",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1F2937",
      marginTop: 20,
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
      textTransform: "uppercase",
    },
    pageBreak: {
      breakBefore: "page",
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

    default:
      return null
  }
}

// ============================================================================
// Group Questions by Type (Optional)
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
  const styles = createStyles(locale)
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
  }

  // Calculate total pages (rough estimate)
  const estimatedPages = Math.ceil(questions.length / 10) + 1

  // Render questions
  const renderQuestions = () => {
    if (groupByType) {
      const grouped = groupQuestionsByType(questions)
      const typeOrder = [
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "FILL_BLANK",
        "SHORT_ANSWER",
        "ESSAY",
      ]
      let globalOrder = 1

      return typeOrder
        .filter((type) => grouped[type]?.length > 0)
        .map((type, sectionIndex) => (
          <View key={type}>
            <Text style={styles.sectionTitle}>
              {sectionLabels[type]?.[locale] || type}
            </Text>
            {grouped[type].map((q) => {
              const orderToShow = globalOrder++
              return (
                <View key={q.id} style={styles.questionWrapper}>
                  <QuestionRenderer
                    question={{ ...q, order: orderToShow }}
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
            })}
          </View>
        ))
    }

    // Sequential order
    return questions.map((q) => (
      <View key={q.id} style={styles.questionWrapper}>
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
    ))
  }

  // Determine if we need a separate answer sheet
  const needsAnswerSheet = config.answerSheetType !== "NONE"
  const isBubbleSheet = config.answerSheetType === "BUBBLE"

  return (
    <Document>
      {/* Main Exam Paper */}
      <Page
        size={config.pageSize as "A4" | "LETTER"}
        orientation={
          config.orientation === "landscape" ? "landscape" : "portrait"
        }
        style={styles.page}
      >
        {/* Header with School Info */}
        {(config.showSchoolLogo || config.showExamTitle) && (
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

        {/* Student Info Section */}
        {config.showStudentInfo && (
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

        {/* Footer */}
        {config.showPageNumbers && (
          <Footer
            currentPage={1}
            totalPages={estimatedPages}
            showTotal={config.showTotalPages}
            customText={config.customFooter ?? undefined}
            versionCode={metadata.versionCode}
            locale={locale}
            fontFamily={fontFamily}
          />
        )}
      </Page>

      {/* Separate Answer Sheet (if enabled) */}
      {needsAnswerSheet && (
        <Page
          size={config.pageSize as "A4" | "LETTER"}
          orientation={
            config.orientation === "landscape" ? "landscape" : "portrait"
          }
          style={styles.page}
        >
          <AnswerSheet
            questions={questions}
            isBubbleSheet={isBubbleSheet}
            exam={exam}
            school={school}
            locale={locale}
            fontFamily={fontFamily}
            versionCode={metadata.versionCode}
          />

          {config.showPageNumbers && (
            <Footer
              currentPage={estimatedPages}
              totalPages={estimatedPages}
              showTotal={config.showTotalPages}
              customText={config.customFooter ?? undefined}
              versionCode={metadata.versionCode}
              locale={locale}
              fontFamily={fontFamily}
            />
          )}
        </Page>
      )}
    </Document>
  )
}

export { createStyles }
