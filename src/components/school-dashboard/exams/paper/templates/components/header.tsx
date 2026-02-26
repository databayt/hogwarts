// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Header Component
 * School logo, name, exam title, date, academic year, and double-line border
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { ExamWithDetails, SchoolForPaper } from "../../types"

interface HeaderProps {
  school: SchoolForPaper
  exam: ExamWithDetails
  showLogo: boolean
  showTitle: boolean
  locale: "en" | "ar"
  fontFamily: string
  versionCode?: string
  logoSize?: number
}

const createStyles = (
  locale: "en" | "ar",
  fontFamily: string,
  logoSize: number = 60
) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    header: {
      marginBottom: 20,
      paddingBottom: 10,
    },
    // Double-line border: 2pt + 1pt with 3pt gap
    borderThick: {
      borderBottomWidth: 2,
      borderBottomColor: "#1F2937",
    },
    borderThin: {
      borderBottomWidth: 1,
      borderBottomColor: "#1F2937",
      marginTop: 3,
    },
    headerContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    logoContainer: {
      width: logoSize + 10,
      marginRight: isRTL ? 0 : 15,
      marginLeft: isRTL ? 15 : 0,
    },
    logo: {
      width: logoSize,
      height: logoSize,
      objectFit: "contain",
    },
    schoolInfo: {
      flex: 1,
      alignItems: isRTL ? "flex-end" : "flex-start",
    },
    schoolName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1F2937",
      marginBottom: 3,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    schoolDetails: {
      fontSize: 9,
      color: "#6B7280",
      marginBottom: 2,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    titleSection: {
      marginTop: 15,
      alignItems: "center",
    },
    examTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontFamily,
    },
    examSubtitle: {
      fontSize: 12,
      color: "#374151",
      textAlign: "center",
      marginTop: 5,
      fontFamily,
    },
    examMeta: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      gap: 20,
    },
    metaItem: {
      fontSize: 9,
      color: "#6B7280",
      fontFamily,
    },
    metaDivider: {
      fontSize: 9,
      color: "#D1D5DB",
      fontFamily,
    },
    versionBadge: {
      position: "absolute",
      top: 0,
      right: isRTL ? undefined : 0,
      left: isRTL ? 0 : undefined,
      backgroundColor: "#1F2937",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 3,
    },
    versionText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#FFFFFF",
      fontFamily,
    },
  })
}

function formatExamDate(exam: ExamWithDetails, locale: "en" | "ar"): string {
  const date = exam.examDate
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
  const month = now.getMonth()
  // Academic year starts in September
  if (month >= 8) {
    return `${year}/${year + 1}`
  }
  return `${year - 1}/${year}`
}

export function Header({
  school,
  exam,
  showLogo,
  showTitle,
  locale,
  fontFamily,
  versionCode,
  logoSize,
}: HeaderProps) {
  const styles = createStyles(locale, fontFamily, logoSize)
  const isRTL = locale === "ar"

  const schoolName = school.name
  const subjectName = exam.subject.subjectName
  const className = exam.class.name
  const examDate = formatExamDate(exam, locale)
  const academicYear = getAcademicYear()

  return (
    <View style={styles.header}>
      {/* Version Badge */}
      {versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        </View>
      )}

      {/* School Header */}
      <View style={styles.headerContent}>
        {showLogo && school.logoUrl && (
          <View style={styles.logoContainer}>
            <Image src={school.logoUrl} style={styles.logo} />
          </View>
        )}

        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {school.address && (
            <Text style={styles.schoolDetails}>{school.address}</Text>
          )}
          {school.phoneNumber && (
            <Text style={styles.schoolDetails}>
              {isRTL
                ? `هاتف: ${school.phoneNumber}`
                : `Tel: ${school.phoneNumber}`}
            </Text>
          )}
          {school.email && (
            <Text style={styles.schoolDetails}>
              {isRTL ? `بريد: ${school.email}` : `Email: ${school.email}`}
            </Text>
          )}
        </View>
      </View>

      {/* Double-line border separator */}
      <View style={styles.borderThick} />
      <View style={styles.borderThin} />

      {/* Exam Title */}
      {showTitle && (
        <View style={styles.titleSection}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <Text style={styles.examSubtitle}>
            {isRTL
              ? `${subjectName} - ${className}`
              : `${subjectName} - ${className}`}
          </Text>

          {/* Exam metadata: date + academic year */}
          <View style={styles.examMeta}>
            {examDate && <Text style={styles.metaItem}>{examDate}</Text>}
            {examDate && academicYear && (
              <Text style={styles.metaDivider}>|</Text>
            )}
            <Text style={styles.metaItem}>
              {isRTL
                ? `العام الأكاديمي ${academicYear}`
                : `Academic Year ${academicYear}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
