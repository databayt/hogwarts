// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Grading Footer — grading rubric summary + examiner/moderator signature lines
 * Used for formal exams that require examiner sign-off and grading scale display.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { FooterSectionProps } from "../types"

export interface GradingFooterProps extends FooterSectionProps {
  gradingScale?: string
}

export function GradingFooter({
  theme,
  showTotal,
  customText,
  versionCode,
  gradingScale,
}: GradingFooterProps) {
  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 20,
      left: theme.pageMargin,
      right: theme.pageMargin,
    },
    gradingSection: {
      borderTopWidth: 1,
      borderTopColor: theme.mutedColor,
      paddingTop: 8,
      marginBottom: 8,
    },
    gradingTitle: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      marginBottom: 4,
      fontFamily: theme.fontFamily,
    },
    gradingText: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      lineHeight: 1.4,
      fontFamily: theme.fontFamily,
    },
    signatureRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginTop: 10,
      gap: 30,
    },
    signatureBlock: {
      flex: 1,
      alignItems: "center",
    },
    signatureLabel: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      marginBottom: 15,
      fontFamily: theme.fontFamily,
    },
    signatureLine: {
      width: "100%",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.secondaryColor,
    },
    signatureName: {
      fontSize: theme.fontSize.tiny,
      color: theme.mutedColor,
      marginTop: 3,
      fontFamily: theme.fontFamily,
    },
    footerRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 5,
      borderTopWidth: 0.5,
      borderTopColor: theme.mutedColor,
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
  })

  const defaultScale = theme.isRTL
    ? "ممتاز (90-100) | جيد جداً (80-89) | جيد (70-79) | مقبول (60-69) | راسب (أقل من 60)"
    : "A (90-100) | B (80-89) | C (70-79) | D (60-69) | F (below 60)"

  const labels = {
    gradingScale: theme.isRTL ? "مقياس التقدير:" : "Grading Scale:",
    examiner: theme.isRTL ? "المصحح" : "Examiner",
    moderator: theme.isRTL ? "المراجع" : "Moderator",
    hod: theme.isRTL ? "رئيس القسم" : "Head of Dept.",
    signature: theme.isRTL ? "التوقيع" : "Signature",
    date: theme.isRTL ? "التاريخ" : "Date",
  }

  return (
    <View style={styles.container} fixed>
      <View style={styles.gradingSection}>
        <Text style={styles.gradingTitle}>{labels.gradingScale}</Text>
        <Text style={styles.gradingText}>{gradingScale || defaultScale}</Text>
      </View>

      <View style={styles.signatureRow}>
        {[labels.examiner, labels.moderator, labels.hod].map((role) => (
          <View key={role} style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>{role}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{labels.signature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
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
    </View>
  )
}
