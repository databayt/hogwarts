// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Classic Exam Paper Template
 * Traditional academic style with school header and structured layout.
 * Refactored to compose shared sections with PaperTheme.
 */

import React from "react"
import { Document, Font, Page, StyleSheet, View } from "@react-pdf/renderer"

import { OmrAnswerSheet, StandardAnswerSheet } from "./answer-sheet"
import { getThemePreset, PAGE_MARGINS, withLocale } from "./config"
import { StandardCover, TableOfContents } from "./cover"
import { StandardFooter } from "./footer"
import { StandardHeader } from "./header"
import { StandardInstructions } from "./instructions"
import { QuestionGroup } from "./question-group"
import { StandardStudentInfo } from "./student-info"
import type { ExamPaperData } from "./types"

// Font Registration (shared across templates)
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

Font.registerHyphenationCallback((word) => [word])

interface ClassicTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function ClassicTemplate({
  data,
  groupByType = false,
}: ClassicTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const baseTheme = getThemePreset("CLASSIC")
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
      lineHeight: 1.4,
      backgroundColor: theme.surfaceColor,
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
          <TableOfContents questions={questions} theme={theme} />
          {footerElement}
        </Page>
      )}

      <Page {...pageProps} style={styles.page} wrap>
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
