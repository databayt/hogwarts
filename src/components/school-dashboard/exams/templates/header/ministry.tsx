// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ministry Header — dual-logo layout for national/government exams
 * Ministry of Education logo on one side, school logo on the other
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { ExamWithDetails, PaperTheme, SchoolForPaper } from "../types"

export interface MinistryHeaderProps {
  school: SchoolForPaper
  exam: ExamWithDetails
  theme: PaperTheme
  ministryName?: string
  ministryLogoUrl?: string
  versionCode?: string
}

export function MinistryHeader({
  school,
  exam,
  theme,
  ministryName,
  ministryLogoUrl,
  versionCode,
}: MinistryHeaderProps) {
  const logoSize = 50

  const styles = StyleSheet.create({
    header: { marginBottom: 20, paddingBottom: 10 },
    topRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logoSection: { alignItems: "center", width: 100 },
    logo: {
      width: logoSize,
      height: logoSize,
      objectFit: "contain" as never,
    },
    logoLabel: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      marginTop: 3,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    centerSection: { flex: 1, alignItems: "center" },
    title: {
      fontSize: theme.fontSize.subtitle,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    subtitle: {
      fontSize: theme.fontSize.heading,
      color: theme.accentColor,
      textAlign: "center",
      marginTop: 4,
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
    examRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      marginTop: 10,
      gap: 30,
    },
    examMeta: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    versionBadge: {
      position: "absolute",
      top: 0,
      right: theme.isRTL ? undefined : 0,
      left: theme.isRTL ? 0 : undefined,
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 3,
    },
    versionText: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.surfaceColor,
      fontFamily: theme.fontFamily,
    },
  })

  const defaultMinistry = theme.isRTL
    ? "وزارة التربية والتعليم"
    : "Ministry of Education"

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
        {/* Ministry logo */}
        <View style={styles.logoSection}>
          {ministryLogoUrl && (
            <Image src={ministryLogoUrl} style={styles.logo} />
          )}
          <Text style={styles.logoLabel}>
            {ministryName || defaultMinistry}
          </Text>
        </View>

        {/* Center: exam title */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{exam.title}</Text>
          <Text style={styles.subtitle}>
            {exam.subject.subjectName} - {exam.class.name}
          </Text>
        </View>

        {/* School logo */}
        <View style={styles.logoSection}>
          {school.logoUrl && <Image src={school.logoUrl} style={styles.logo} />}
          <Text style={styles.logoLabel}>{school.name}</Text>
        </View>
      </View>

      <View style={styles.borderDouble} />
      <View style={styles.borderThin} />

      <View style={styles.examRow}>
        <Text style={styles.examMeta}>
          {theme.isRTL
            ? `المدة: ${exam.duration} دقيقة`
            : `Duration: ${exam.duration} min`}
        </Text>
        <Text style={styles.examMeta}>
          {theme.isRTL
            ? `الدرجات: ${exam.totalMarks}`
            : `Marks: ${exam.totalMarks}`}
        </Text>
      </View>
    </View>
  )
}
