// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bilingual Header — Arabic school name on right, English on left, dual logos
 * Exam info centered between both languages. Ideal for bilingual school papers.
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { HeaderSectionProps } from "../types"

function formatExamDate(date: Date, locale: "en" | "ar"): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function BilingualHeader({
  school,
  exam,
  theme,
  showLogo,
  showTitle,
  versionCode,
  logoSize = 50,
}: HeaderSectionProps) {
  const styles = StyleSheet.create({
    header: { marginBottom: 20, paddingBottom: 10 },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sideSection: {
      width: 160,
      alignItems: "center",
    },
    logoContainer: { marginBottom: 4 },
    logo: {
      width: logoSize,
      height: logoSize,
      objectFit: "contain" as never,
    },
    arabicName: {
      fontSize: theme.fontSize.subtitle - 2,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    englishName: {
      fontSize: theme.fontSize.subtitle - 2,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    centerSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    examTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontFamily: theme.fontFamily,
    },
    examSubtitle: {
      fontSize: theme.fontSize.heading,
      color: theme.accentColor,
      textAlign: "center",
      marginTop: 4,
      fontFamily: theme.fontFamily,
    },
    examMeta: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 6,
      gap: 15,
    },
    metaItem: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    borderDouble: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
      marginTop: 12,
    },
    borderThin: {
      borderBottomWidth: 1,
      borderBottomColor: theme.primaryColor,
      marginTop: 3,
    },
    versionBadge: {
      position: "absolute",
      top: 0,
      right: theme.isRTL ? undefined : 0,
      left: theme.isRTL ? 0 : undefined,
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 3,
    },
    versionText: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.surfaceColor,
      fontFamily: theme.fontFamily,
    },
  })

  const examDate = formatExamDate(exam.examDate, theme.locale)

  return (
    <View style={styles.header}>
      {versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {theme.isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        </View>
      )}

      <View style={styles.topRow}>
        {/* Right side: Arabic name + logo */}
        <View style={styles.sideSection}>
          {showLogo && school.logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={school.logoUrl} style={styles.logo} />
            </View>
          )}
          <Text style={styles.arabicName}>{school.name}</Text>
        </View>

        {/* Center: exam info */}
        {showTitle && (
          <View style={styles.centerSection}>
            <Text style={styles.examTitle}>{exam.title}</Text>
            <Text style={styles.examSubtitle}>
              {exam.subject.subjectName} - {exam.class.name}
            </Text>
            <View style={styles.examMeta}>
              {examDate && <Text style={styles.metaItem}>{examDate}</Text>}
              <Text style={styles.metaItem}>
                {theme.isRTL
                  ? `${exam.duration} دقيقة`
                  : `${exam.duration} min`}
              </Text>
              <Text style={styles.metaItem}>
                {theme.isRTL
                  ? `${exam.totalMarks} درجة`
                  : `${exam.totalMarks} marks`}
              </Text>
            </View>
          </View>
        )}

        {/* Left side: English name + logo */}
        <View style={styles.sideSection}>
          {showLogo && school.logoUrl && (
            <View style={styles.logoContainer}>
              <Image src={school.logoUrl} style={styles.logo} />
            </View>
          )}
          <Text style={styles.englishName}>{school.name}</Text>
        </View>
      </View>

      <View style={styles.borderDouble} />
      <View style={styles.borderThin} />
    </View>
  )
}
