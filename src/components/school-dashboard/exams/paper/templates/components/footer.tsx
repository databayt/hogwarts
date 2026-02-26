// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Footer Component
 * Dynamic page numbers via render prop, version code, security code, and "END OF PAPER" marker
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface FooterProps {
  showTotal: boolean
  customText?: string
  versionCode?: string
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    footer: {
      position: "absolute",
      bottom: 25,
      left: 50,
      right: 50,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 10,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pageNumber: {
      fontSize: 9,
      color: "#6B7280",
      fontFamily,
    },
    customText: {
      fontSize: 8,
      color: "#9CA3AF",
      textAlign: "center",
      flex: 1,
      fontFamily,
    },
    securityCode: {
      fontSize: 7,
      color: "#9CA3AF",
      fontFamily,
    },
    versionCode: {
      fontSize: 9,
      color: "#6B7280",
      fontWeight: "bold",
      fontFamily,
    },
    endOfPaper: {
      position: "absolute",
      bottom: 8,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 9,
      fontWeight: "bold",
      color: "#374151",
      letterSpacing: 2,
      fontFamily,
    },
  })
}

function generateSecurityHash(versionCode?: string): string {
  const ts = Date.now().toString(36).slice(-4).toUpperCase()
  const vc = versionCode || "X"
  return `PAPER-${vc}-${ts}`
}

export function Footer({
  showTotal,
  customText,
  versionCode,
  locale,
  fontFamily,
}: FooterProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"
  const securityCode = generateSecurityHash(versionCode)

  return (
    <>
      <View style={styles.footer} fixed>
        {/* Dynamic page number via render prop */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            showTotal
              ? isRTL
                ? `صفحة ${pageNumber} من ${totalPages}`
                : `Page ${pageNumber} of ${totalPages}`
              : isRTL
                ? `صفحة ${pageNumber}`
                : `Page ${pageNumber}`
          }
          fixed
        />

        {customText && <Text style={styles.customText}>{customText}</Text>}

        {versionCode && (
          <Text style={styles.versionCode}>
            {isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        )}
      </View>

      {/* Security code - bottom left */}
      <Text
        style={{
          position: "absolute",
          bottom: 12,
          left: 50,
          fontSize: 6,
          color: "#D1D5DB",
          fontFamily,
        }}
        fixed
      >
        {securityCode}
      </Text>

      {/* "END OF PAPER" marker on last page only */}
      <Text
        style={styles.endOfPaper}
        render={({ pageNumber, totalPages }) =>
          pageNumber === totalPages
            ? isRTL
              ? "— نهاية الاختبار —"
              : "— END OF PAPER —"
            : ""
        }
        fixed
      />
    </>
  )
}
