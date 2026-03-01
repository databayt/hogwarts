// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Booklet Layout — cover + TOC + content pages
 * Convenience wrapper that composes cover and TOC sections
 * with the main content in a booklet format
 */

import React from "react"
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer"

import { PAGE_MARGINS } from "../config"
import { StandardCover, TableOfContents } from "../cover"
import { StandardFooter } from "../footer"
import type {
  ExamWithDetails,
  PaperMetadata,
  PaperTheme,
  QuestionForPaper,
  SchoolForPaper,
} from "../types"

export interface BookletLayoutProps {
  exam: ExamWithDetails
  school: SchoolForPaper
  metadata: PaperMetadata
  questions: QuestionForPaper[]
  theme: PaperTheme
  pageSize: "A4" | "LETTER"
  orientation: "portrait" | "landscape"
  showPageNumbers: boolean
  showTotalPages: boolean
  customFooter?: string
  children: React.ReactNode
}

export function BookletLayout({
  exam,
  school,
  metadata,
  questions,
  theme,
  pageSize,
  orientation,
  showPageNumbers,
  showTotalPages,
  customFooter,
  children,
}: BookletLayoutProps) {
  const bindingMargin = 15
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

  const pageProps = { size: pageSize, orientation }

  const footerElement = showPageNumbers && (
    <StandardFooter
      theme={theme}
      showTotal={showTotalPages}
      customText={customFooter}
      versionCode={metadata.versionCode}
    />
  )

  return (
    <Document>
      {/* Cover Page */}
      <Page {...pageProps} style={styles.page}>
        <StandardCover
          exam={exam}
          school={school}
          metadata={metadata}
          theme={theme}
        />
        {footerElement}
      </Page>

      {/* Table of Contents */}
      <Page {...pageProps} style={styles.page}>
        <TableOfContents questions={questions} theme={theme} />
        {footerElement}
      </Page>

      {/* Content Pages */}
      <Page {...pageProps} style={styles.page} wrap>
        <View>{children}</View>
        {footerElement}
      </Page>
    </Document>
  )
}
