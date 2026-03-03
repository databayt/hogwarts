// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Composable Exam Paper Document
 * Single Document component that replaces all 4 hardcoded templates.
 * Reads composition config to dynamically select section variants per slot.
 */

import React from "react"
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer"

import { Watermark } from "./atom"
import { resolveComposition, VARIANT_REGISTRY } from "./composition"
import type { CompositionConfig } from "./composition"
import {
  createSchoolTheme,
  getThemePreset,
  PAGE_MARGINS,
  withLocale,
} from "./config"
import { ensureFontsRegistered } from "./fonts"
import { QuestionGroup } from "./question-group"
import type { ExamPaperData, PaperTheme } from "./types"

interface ComposableDocumentProps {
  data: ExamPaperData
  groupByType?: boolean
}

export function ComposableDocument({
  data,
  groupByType = false,
}: ComposableDocumentProps) {
  ensureFontsRegistered()

  const { exam, school, questions, config, metadata } = data

  // 1. Resolve composition from blockConfig + regionPreset
  const composition = resolveComposition(
    config.blockConfig as unknown,
    config.regionPreset
  )

  // 2. Build theme from template enum + school branding + locale
  const baseTheme = getThemePreset(config.template)
  const themed =
    config.template === "CUSTOM"
      ? createSchoolTheme(baseTheme, school.branding)
      : baseTheme
  const theme = withLocale(themed, metadata.locale)

  // 3. Look up variant components from registry
  const HeaderComponent =
    VARIANT_REGISTRY.header[composition.slots.header]?.component
  const FooterComponent =
    VARIANT_REGISTRY.footer[composition.slots.footer]?.component
  const StudentInfoComponent =
    VARIANT_REGISTRY.studentInfo[composition.slots.studentInfo]?.component
  const InstructionsComponent =
    VARIANT_REGISTRY.instructions[composition.slots.instructions]?.component
  const CoverComponent =
    VARIANT_REGISTRY.cover[composition.slots.cover]?.component
  const TocComponent = VARIANT_REGISTRY.cover["toc"]?.component
  const AnswerSheetComponent =
    VARIANT_REGISTRY.answerSheet[composition.slots.answerSheet]?.component

  // 4. Compute layout properties
  const bindingMargin = 15
  const orientation =
    (config.orientation as "portrait" | "landscape") || "portrait"
  const isBooklet = config.layout === "BOOKLET"
  const needsAnswerSheet = config.answerSheetType !== "NONE"
  const isBubbleSheet = config.answerSheetType === "BUBBLE"

  const pageProps = {
    size: config.pageSize as "A4" | "LETTER",
    orientation: (config.orientation === "landscape"
      ? "landscape"
      : "portrait") as "portrait" | "landscape",
  }

  const styles = buildPageStyles(theme, orientation, bindingMargin, composition)

  // 5. Build footer element
  const footerElement = config.showPageNumbers && FooterComponent && (
    <FooterComponent
      theme={theme}
      showTotal={config.showTotalPages}
      customText={config.customFooter ?? undefined}
      versionCode={metadata.versionCode}
      {...(composition.slotProps.footer || {})}
    />
  )

  // 6. Build decorations
  const accentBar = composition.decorations.accentBar.enabled && (
    <View
      style={{
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        height: composition.decorations.accentBar.height ?? 4,
        backgroundColor:
          composition.decorations.accentBar.colorKey === "primary"
            ? theme.primaryColor
            : theme.accentColor,
      }}
      fixed
    />
  )

  const watermarkElement = composition.decorations.watermark.enabled && (
    <Watermark
      text={composition.decorations.watermark.text || school.name}
      theme={theme}
      opacity={composition.decorations.watermark.opacity}
    />
  )

  const wrapWithFrame = (children: React.ReactNode) => {
    if (!composition.decorations.frame.enabled) return children
    return (
      <View style={styles.outerFrame}>
        <View style={styles.innerFrame}>{children}</View>
      </View>
    )
  }

  // 7. Build header props
  const headerProps = {
    school,
    exam,
    theme,
    showLogo: config.showSchoolLogo,
    showTitle: config.showExamTitle,
    versionCode: metadata.versionCode,
    ...(composition.slotProps.header || {}),
  }

  // 8. Build student info props
  const studentInfoProps = {
    theme,
    ...(composition.slotProps.studentInfo || {}),
  }

  // 9. Build instructions props
  const instructionsProps = {
    theme,
    totalMarks: metadata.totalMarks,
    totalQuestions: metadata.totalQuestions,
    duration: metadata.duration,
    customInstructions: config.customInstructions ?? undefined,
  }

  // Determine which answer sheet component to use
  // If bubble sheet is forced by config, use OMR regardless of composition
  const ActualAnswerSheetComponent = isBubbleSheet
    ? VARIANT_REGISTRY.answerSheet["omr"]?.component
    : AnswerSheetComponent

  return (
    <Document>
      {/* Booklet cover page */}
      {isBooklet && CoverComponent && (
        <Page {...pageProps} style={styles.page}>
          {watermarkElement}
          {accentBar}
          {wrapWithFrame(
            <CoverComponent
              exam={exam}
              school={school}
              metadata={metadata}
              theme={theme}
            />
          )}
          {footerElement}
        </Page>
      )}

      {/* Booklet table of contents */}
      {isBooklet && TocComponent && (
        <Page {...pageProps} style={styles.page}>
          {watermarkElement}
          {accentBar}
          {wrapWithFrame(<TocComponent questions={questions} theme={theme} />)}
          {footerElement}
        </Page>
      )}

      {/* Main exam page(s) */}
      <Page {...pageProps} style={styles.page} wrap>
        {watermarkElement}
        {accentBar}

        {wrapWithFrame(
          <>
            {!isBooklet &&
              (config.showSchoolLogo || config.showExamTitle) &&
              HeaderComponent && <HeaderComponent {...headerProps} />}

            {!isBooklet && config.showStudentInfo && StudentInfoComponent && (
              <StudentInfoComponent {...studentInfoProps} />
            )}

            {config.showInstructions &&
              InstructionsComponent &&
              (composition.slotProps.instructions?.wrapWithAccentBorder ? (
                <View style={styles.instructionsWrapper}>
                  <InstructionsComponent {...instructionsProps} />
                </View>
              ) : (
                <InstructionsComponent {...instructionsProps} />
              ))}

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
          </>
        )}

        {footerElement}
      </Page>

      {/* Answer sheet page */}
      {needsAnswerSheet && ActualAnswerSheetComponent && (
        <Page {...pageProps} style={styles.page}>
          {watermarkElement}
          {accentBar}
          {wrapWithFrame(
            <ActualAnswerSheetComponent
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

function buildPageStyles(
  theme: PaperTheme,
  orientation: "portrait" | "landscape",
  bindingMargin: number,
  composition: CompositionConfig
) {
  const frameOuter = composition.decorations.frame.outerWidth ?? 2
  const frameInner = composition.decorations.frame.innerWidth ?? 1

  return StyleSheet.create({
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
    outerFrame: {
      flex: 1,
      borderWidth: frameOuter,
      borderColor: theme.primaryColor,
      padding: 4,
    },
    innerFrame: {
      flex: 1,
      borderWidth: frameInner,
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
}
