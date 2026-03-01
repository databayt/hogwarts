// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Modern Exam Paper Template
 * Clean minimalist design with blue accent bar, card-style containers.
 * Refactored to compose shared sections with PaperTheme.
 */

import React from "react"
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer"

import { OmrAnswerSheet, StandardAnswerSheet } from "./answer-sheet"
import { getThemePreset, PAGE_MARGINS, withLocale } from "./config"
import { StandardCover, TableOfContents } from "./cover"
import { StandardFooter } from "./footer"
import { StandardHeader } from "./header"
import { StandardInstructions } from "./instructions"
import { QuestionGroup } from "./question-group"
import { StandardStudentInfo } from "./student-info"
import type { ExamPaperData } from "./types"

interface ModernTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function ModernTemplate({
  data,
  groupByType = false,
}: ModernTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const baseTheme = getThemePreset("MODERN")
  const theme = withLocale(baseTheme, metadata.locale)

  const bindingMargin = 15
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"

  const styles = StyleSheet.create({
    page: {
      paddingTop:
        orientation === "landscape"
          ? PAGE_MARGINS.top + bindingMargin
          : PAGE_MARGINS.top,
      paddingBottom: PAGE_MARGINS.bottom + 20,
      paddingLeft:
        orientation === "portrait"
          ? PAGE_MARGINS.left + bindingMargin
          : PAGE_MARGINS.left,
      paddingRight: PAGE_MARGINS.right,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize.body,
      lineHeight: 1.5,
      backgroundColor: theme.surfaceColor,
    },
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: theme.accentColor,
    },
  })

  const isBooklet = config.layout === "BOOKLET"
  const needsAnswerSheet = config.answerSheetType !== "NONE"
  const isBubbleSheet = config.answerSheetType === "BUBBLE"

  const pageProps = {
    size: config.pageSize as "A4" | "LETTER",
    orientation: (config.orientation === "landscape"
      ? "landscape"
      : "portrait") as "portrait" | "landscape",
  }

  const footerElement = config.showPageNumbers && (
    <StandardFooter
      theme={theme}
      showTotal={config.showTotalPages}
      customText={config.customFooter ?? undefined}
      versionCode={metadata.versionCode}
    />
  )

  return (
    <Document>
      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          <View style={styles.accentBar} fixed />
          <StandardCover
            exam={exam}
            school={school}
            metadata={metadata}
            theme={theme}
          />
          {footerElement}
        </Page>
      )}

      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          <View style={styles.accentBar} fixed />
          <TableOfContents questions={questions} theme={theme} />
          {footerElement}
        </Page>
      )}

      <Page {...pageProps} style={styles.page} wrap>
        <View style={styles.accentBar} fixed />

        {!isBooklet && (config.showSchoolLogo || config.showExamTitle) && (
          <StandardHeader
            school={school}
            exam={exam}
            theme={theme}
            showLogo={config.showSchoolLogo}
            showTitle={config.showExamTitle}
            versionCode={metadata.versionCode}
          />
        )}

        {!isBooklet && config.showStudentInfo && (
          <StandardStudentInfo theme={theme} />
        )}

        {config.showInstructions && (
          <StandardInstructions
            theme={theme}
            totalMarks={metadata.totalMarks}
            totalQuestions={metadata.totalQuestions}
            duration={metadata.duration}
            customInstructions={config.customInstructions ?? undefined}
          />
        )}

        <QuestionGroup
          questions={questions}
          theme={theme}
          showNumber={config.showQuestionNumbers}
          showPoints={config.showPointsPerQuestion}
          showType={config.showQuestionType ?? false}
          answerLinesShort={config.answerLinesShort}
          answerLinesEssay={config.answerLinesEssay}
          groupByType={groupByType}
        />

        {footerElement}
      </Page>

      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
          <View style={styles.accentBar} fixed />
          {isBubbleSheet ? (
            <OmrAnswerSheet
              questions={questions}
              exam={exam}
              theme={theme}
              versionCode={metadata.versionCode}
            />
          ) : (
            <StandardAnswerSheet
              questions={questions}
              exam={exam}
              theme={theme}
              versionCode={metadata.versionCode}
            />
          )}
          {footerElement}
        </Page>
      )}
    </Document>
  )
}
