// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Disclaimer Footer — standard footer + legal/confidentiality text
 * Used for national exams, ministry papers, formal assessments
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"
import { StandardFooter } from "./standard"

export interface DisclaimerFooterProps {
  theme: PaperTheme
  showTotal: boolean
  customText?: string
  versionCode?: string
  disclaimerText?: string
}

export function DisclaimerFooter({
  theme,
  showTotal,
  customText,
  versionCode,
  disclaimerText,
}: DisclaimerFooterProps) {
  const styles = StyleSheet.create({
    disclaimer: {
      position: "absolute",
      bottom: 45,
      left: theme.pageMargin,
      right: theme.pageMargin,
      borderTopWidth: 0.5,
      borderTopColor: theme.mutedColor,
      paddingTop: 5,
    },
    text: {
      fontSize: 6,
      color: theme.mutedColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
      lineHeight: 1.3,
    },
  })

  const defaultDisclaimer = theme.isRTL
    ? "هذا الاختبار سري. يُحظر نسخه أو توزيعه بأي شكل. أي مخالفة تعرض صاحبها للمساءلة القانونية."
    : "This examination paper is confidential. Reproduction or distribution in any form is prohibited. Violations are subject to legal action."

  return (
    <>
      <View style={styles.disclaimer} fixed>
        <Text style={styles.text}>{disclaimerText || defaultDisclaimer}</Text>
      </View>
      <StandardFooter
        theme={theme}
        showTotal={showTotal}
        customText={customText}
        versionCode={versionCode}
      />
    </>
  )
}
