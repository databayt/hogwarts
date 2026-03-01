// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Header — school logo + exam info
 * Used by most schools (private/public, all regions)
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

function getAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`
}

export function StandardHeader({
  school,
  exam,
  theme,
  showLogo,
  showTitle,
  versionCode,
  logoSize = 60,
}: HeaderSectionProps) {
  const styles = StyleSheet.create({
    header: { marginBottom: 20, paddingBottom: 10 },
    borderThick: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
    },
    borderThin: {
      borderBottomWidth: 1,
      borderBottomColor: theme.primaryColor,
      marginTop: 3,
    },
    headerContent: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    logoContainer: {
      width: logoSize + 10,
      marginRight: theme.isRTL ? 0 : 15,
      marginLeft: theme.isRTL ? 15 : 0,
    },
    logo: {
      width: logoSize,
      height: logoSize,
      objectFit: "contain" as never,
    },
    schoolInfo: {
      flex: 1,
      alignItems: theme.isRTL ? "flex-end" : "flex-start",
    },
    schoolName: {
      fontSize: theme.fontSize.subtitle,
      fontWeight: "bold",
      color: theme.primaryColor,
      marginBottom: 3,
      fontFamily: theme.fontFamily,
      textAlign: theme.isRTL ? "right" : "left",
    },
    schoolDetails: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      marginBottom: 2,
      fontFamily: theme.fontFamily,
      textAlign: theme.isRTL ? "right" : "left",
    },
    titleSection: { marginTop: 15, alignItems: "center" },
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
      marginTop: 5,
      fontFamily: theme.fontFamily,
    },
    examMeta: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      gap: 20,
    },
    metaItem: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    metaDivider: {
      fontSize: theme.fontSize.small,
      color: theme.mutedColor,
      fontFamily: theme.fontFamily,
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
  const academicYear = getAcademicYear()

  return (
    <View style={styles.header}>
      {versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {theme.isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        </View>
      )}

      <View style={styles.headerContent}>
        {showLogo && school.logoUrl && (
          <View style={styles.logoContainer}>
            <Image src={school.logoUrl} style={styles.logo} />
          </View>
        )}
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{school.name}</Text>
          {school.address && (
            <Text style={styles.schoolDetails}>{school.address}</Text>
          )}
          {school.phoneNumber && (
            <Text style={styles.schoolDetails}>
              {theme.isRTL
                ? `هاتف: ${school.phoneNumber}`
                : `Tel: ${school.phoneNumber}`}
            </Text>
          )}
          {school.email && (
            <Text style={styles.schoolDetails}>
              {theme.isRTL ? `بريد: ${school.email}` : `Email: ${school.email}`}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.borderThick} />
      <View style={styles.borderThin} />

      {showTitle && (
        <View style={styles.titleSection}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <Text style={styles.examSubtitle}>
            {exam.subject.subjectName} - {exam.class.name}
          </Text>
          <View style={styles.examMeta}>
            {examDate && <Text style={styles.metaItem}>{examDate}</Text>}
            {examDate && academicYear && (
              <Text style={styles.metaDivider}>|</Text>
            )}
            <Text style={styles.metaItem}>
              {theme.isRTL
                ? `العام الأكاديمي ${academicYear}`
                : `Academic Year ${academicYear}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
