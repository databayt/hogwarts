/**
 * Exam Paper Footer Component
 * Page numbers, version code, and custom text
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface FooterProps {
  currentPage: number
  totalPages: number
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
    versionCode: {
      fontSize: 9,
      color: "#6B7280",
      fontWeight: "bold",
      fontFamily,
    },
  })
}

export function Footer({
  currentPage,
  totalPages,
  showTotal,
  customText,
  versionCode,
  locale,
  fontFamily,
}: FooterProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const pageText = showTotal
    ? isRTL
      ? `صفحة ${currentPage} من ${totalPages}`
      : `Page ${currentPage} of ${totalPages}`
    : isRTL
      ? `صفحة ${currentPage}`
      : `Page ${currentPage}`

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.pageNumber}>{pageText}</Text>

      {customText && <Text style={styles.customText}>{customText}</Text>}

      {versionCode && (
        <Text style={styles.versionCode}>
          {isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
        </Text>
      )}
    </View>
  )
}
