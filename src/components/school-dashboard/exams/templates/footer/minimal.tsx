// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Minimal Footer — page number only, no version/hash/end-of-paper marker
 * Clean footer for quizzes or informal assessments where less chrome is preferred.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { FooterSectionProps } from "../types"

export function MinimalFooter({ theme, showTotal }: FooterSectionProps) {
  const styles = StyleSheet.create({
    footer: {
      position: "absolute",
      bottom: 25,
      left: theme.pageMargin,
      right: theme.pageMargin,
      alignItems: "center",
    },
    pageNumber: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  return (
    <View style={styles.footer} fixed>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          showTotal
            ? theme.isRTL
              ? `صفحة ${pageNumber} من ${totalPages}`
              : `Page ${pageNumber} of ${totalPages}`
            : theme.isRTL
              ? `صفحة ${pageNumber}`
              : `Page ${pageNumber}`
        }
        fixed
      />
    </View>
  )
}
