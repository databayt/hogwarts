// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Formal Exam Paper Template
 * Government exam style with double-border frame, diagonal watermark,
 * disclaimer text, and strict formal formatting.
 * Refactored to compose shared sections with PaperTheme.
 * @deprecated Use ComposableDocument instead — this template is kept for backwards compatibility.
 */

import React from "react"
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer"

import { OmrAnswerSheet, StandardAnswerSheet } from "./answer-sheet"
import { Watermark } from "./atom"
import { getThemePreset, PAGE_MARGINS, withLocale } from "./config"
import { StandardCover, TableOfContents } from "./cover"
import { DisclaimerFooter } from "./footer"
import { StandardHeader } from "./header"
import { StandardInstructions } from "./instructions"
import { QuestionGroup } from "./question-group"
import { StandardStudentInfo } from "./student-info"
import type { ExamPaperData } from "./types"

interface FormalTemplateProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function FormalTemplate({
  data,
  groupByType = false,
}: FormalTemplateProps) {
  const { exam, school, questions, config, metadata } = data
  const baseTheme = getThemePreset("FORMAL")
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
    outerFrame: {
      flex: 1,
      borderWidth: 2,
      borderColor: theme.primaryColor,
      padding: 4,
    },
    innerFrame: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.primaryColor,
      padding: 12,
    },
    instructionsWrapper: {
      borderLeftWidth: theme.isRTL ? 0 : 4,
      borderRightWidth: theme.isRTL ? 4 : 0,
      borderLeftColor: theme.primaryColor,
      borderRightColor: theme.primaryColor,
      paddingLeft: theme.isRTL ? 0 : 10,
      paddingRight: theme.isRTL ? 10 : 0,
      marginTop: 10,
      marginBottom: 6,
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
    <DisclaimerFooter
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
          <Watermark text={school.name} theme={theme} />
          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
              <StandardCover
                exam={exam}
                school={school}
                metadata={metadata}
                theme={theme}
              />
            </View>
          </View>
          {footerElement}
        </Page>
      )}

      {isBooklet && (
        <Page {...pageProps} style={styles.page}>
          <Watermark text={school.name} theme={theme} />
          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
              <TableOfContents questions={questions} theme={theme} />
            </View>
          </View>
          {footerElement}
        </Page>
      )}

      <Page {...pageProps} style={styles.page} wrap>
        <Watermark text={school.name} theme={theme} />

        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
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
              <View style={styles.instructionsWrapper}>
                <StandardInstructions
                  theme={theme}
                  totalMarks={metadata.totalMarks}
                  totalQuestions={metadata.totalQuestions}
                  duration={metadata.duration}
                  customInstructions={config.customInstructions ?? undefined}
                />
              </View>
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
          </View>
        </View>

        {footerElement}
      </Page>

      {needsAnswerSheet && (
        <Page {...pageProps} style={styles.page}>
          <Watermark text={school.name} theme={theme} />
          <View style={styles.outerFrame}>
            <View style={styles.innerFrame}>
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
            </View>
          </View>
          {footerElement}
        </Page>
      )}
    </Document>
  )
}
