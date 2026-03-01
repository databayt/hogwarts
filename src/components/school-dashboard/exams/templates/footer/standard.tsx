// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Footer — page numbers + version + security hash + end-of-paper marker
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { FooterSectionProps } from "../types"

function generateSecurityHash(versionCode?: string): string {
  const ts = Date.now().toString(36).slice(-4).toUpperCase()
  return `PAPER-${versionCode || "X"}-${ts}`
}

export function StandardFooter({
  theme,
  showTotal,
  customText,
  versionCode,
}: FooterSectionProps) {
  const styles = StyleSheet.create({
    footer: {
      position: "absolute",
      bottom: 25,
      left: theme.pageMargin,
      right: theme.pageMargin,
      borderTopWidth: 1,
      borderTopColor: theme.mutedColor,
      paddingTop: 10,
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pageNumber: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    customText: {
      fontSize: theme.fontSize.tiny,
      color: theme.mutedColor,
      textAlign: "center",
      flex: 1,
      fontFamily: theme.fontFamily,
    },
    versionCode: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontWeight: "bold",
      fontFamily: theme.fontFamily,
    },
    securityCode: {
      position: "absolute",
      bottom: 12,
      left: theme.pageMargin,
      fontSize: 6,
      color: theme.mutedColor,
      fontFamily: theme.fontFamily,
    },
    endOfPaper: {
      position: "absolute",
      bottom: 8,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.accentColor,
      letterSpacing: 2,
      fontFamily: theme.fontFamily,
    },
  })

  const securityCode = generateSecurityHash(versionCode)

  return (
    <>
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
        {customText && <Text style={styles.customText}>{customText}</Text>}
        {versionCode && (
          <Text style={styles.versionCode}>
            {theme.isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        )}
      </View>

      <Text style={styles.securityCode} fixed>
        {securityCode}
      </Text>

      <Text
        style={styles.endOfPaper}
        render={({ pageNumber, totalPages }) =>
          pageNumber === totalPages
            ? theme.isRTL
              ? "— نهاية الاختبار —"
              : "— END OF PAPER —"
            : ""
        }
        fixed
      />
    </>
  )
}
