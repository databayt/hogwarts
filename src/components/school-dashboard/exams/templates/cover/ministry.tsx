// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ministry Cover — Ministry of Education official cover format
 * Ministry seal at top, kingdom name, school name, exam metadata in formal table.
 * Used for national/government-administered exams with official formatting requirements.
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { FieldLine } from "../atom"
import type {
  ExamWithDetails,
  PaperMetadata,
  PaperTheme,
  SchoolForPaper,
} from "../types"

export interface MinistryCoverProps {
  exam: ExamWithDetails
  school: SchoolForPaper
  metadata: PaperMetadata
  theme: PaperTheme
  ministryName?: string
  ministryLogoUrl?: string
  kingdomName?: string
}

export function MinistryCover({
  exam,
  school,
  metadata,
  theme,
  ministryName,
  ministryLogoUrl,
  kingdomName,
}: MinistryCoverProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      padding: 50,
    },
    sealContainer: { marginBottom: 15 },
    seal: {
      width: 80,
      height: 80,
      objectFit: "contain" as never,
    },
    sealPlaceholder: {
      width: 80,
      height: 80,
      borderWidth: 2,
      borderColor: theme.primaryColor,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    sealText: {
      fontSize: theme.fontSize.tiny,
      color: theme.primaryColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    kingdomName: {
      fontSize: theme.fontSize.subtitle,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      marginBottom: 5,
      fontFamily: theme.fontFamily,
    },
    ministryName: {
      fontSize: theme.fontSize.heading,
      color: theme.secondaryColor,
      textAlign: "center",
      marginBottom: 5,
      fontFamily: theme.fontFamily,
    },
    schoolName: {
      fontSize: theme.fontSize.heading,
      color: theme.secondaryColor,
      textAlign: "center",
      marginBottom: 20,
      fontFamily: theme.fontFamily,
    },
    doubleDivider: {
      width: 250,
      borderBottomWidth: 3,
      borderBottomColor: theme.primaryColor,
      marginBottom: 4,
    },
    thinDivider: {
      width: 250,
      borderBottomWidth: 1,
      borderBottomColor: theme.primaryColor,
      marginBottom: 25,
    },
    examTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 10,
      fontFamily: theme.fontFamily,
    },
    examSubtitle: {
      fontSize: theme.fontSize.heading,
      color: theme.accentColor,
      textAlign: "center",
      marginBottom: 30,
      fontFamily: theme.fontFamily,
    },
    metaTable: {
      width: "80%",
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: 4,
      marginBottom: 30,
    },
    metaRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
    },
    metaLastRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
    },
    metaLabelCell: {
      width: "40%",
      backgroundColor: theme.backgroundColor,
      padding: 8,
      borderRightWidth: theme.isRTL ? 0 : 1,
      borderLeftWidth: theme.isRTL ? 1 : 0,
      borderRightColor: theme.mutedColor,
      borderLeftColor: theme.mutedColor,
      justifyContent: "center",
    },
    metaValueCell: {
      flex: 1,
      padding: 8,
      justifyContent: "center",
    },
    metaLabel: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    metaValue: {
      fontSize: theme.fontSize.body,
      color: theme.secondaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    studentSection: {
      width: "80%",
      padding: 20,
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: 4,
    },
    studentTitle: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      marginBottom: 12,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    fieldRow: { marginBottom: 10 },
    versionBadge: {
      position: "absolute",
      top: 30,
      right: theme.isRTL ? undefined : 30,
      left: theme.isRTL ? 30 : undefined,
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 4,
    },
    versionText: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.surfaceColor,
      fontFamily: theme.fontFamily,
    },
    confidential: {
      marginTop: 20,
      paddingVertical: 6,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: "#DC2626",
      borderRadius: 3,
    },
    confidentialText: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: "#DC2626",
      textAlign: "center",
      letterSpacing: 3,
      textTransform: "uppercase",
      fontFamily: theme.fontFamily,
    },
  })

  const defaultKingdom = theme.isRTL ? "المملكة" : "The Kingdom"
  const defaultMinistry = theme.isRTL
    ? "وزارة التربية والتعليم"
    : "Ministry of Education"

  const labels = {
    subject: theme.isRTL ? "المادة" : "Subject",
    class: theme.isRTL ? "الصف" : "Class",
    duration: theme.isRTL ? "المدة" : "Duration",
    totalMarks: theme.isRTL ? "إجمالي الدرجات" : "Total Marks",
    questions: theme.isRTL ? "عدد الأسئلة" : "Questions",
    date: theme.isRTL ? "التاريخ" : "Date",
    minutes: theme.isRTL ? "دقيقة" : "min",
    studentInfo: theme.isRTL ? "بيانات الطالب" : "Student Information",
    name: theme.isRTL ? "الاسم:" : "Name:",
    id: theme.isRTL ? "رقم الطالب:" : "Student ID:",
    classField: theme.isRTL ? "الفصل:" : "Class:",
    dateField: theme.isRTL ? "التاريخ:" : "Date:",
    confidential: theme.isRTL ? "سري" : "CONFIDENTIAL",
  }

  const examDate = new Date(exam.examDate).toLocaleDateString(
    theme.locale === "ar" ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )

  type MetaEntry = { label: string; value: string; isLast?: boolean }

  const metaRows: MetaEntry[] = [
    { label: labels.subject, value: exam.subject.subjectName },
    { label: labels.class, value: exam.class.name },
    {
      label: labels.duration,
      value: `${metadata.duration} ${labels.minutes}`,
    },
    { label: labels.totalMarks, value: String(metadata.totalMarks) },
    { label: labels.questions, value: String(metadata.totalQuestions) },
    { label: labels.date, value: examDate, isLast: true },
  ]

  return (
    <View style={styles.container}>
      {metadata.versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {theme.isRTL
              ? `نسخة ${metadata.versionCode}`
              : `Version ${metadata.versionCode}`}
          </Text>
        </View>
      )}

      {/* Ministry seal */}
      <View style={styles.sealContainer}>
        {ministryLogoUrl ? (
          <Image src={ministryLogoUrl} style={styles.seal} />
        ) : (
          <View style={styles.sealPlaceholder}>
            <Text style={styles.sealText}>
              {theme.isRTL ? "الشعار" : "Seal"}
            </Text>
          </View>
        )}
      </View>

      {/* Kingdom and ministry names */}
      <Text style={styles.kingdomName}>{kingdomName || defaultKingdom}</Text>
      <Text style={styles.ministryName}>{ministryName || defaultMinistry}</Text>
      <Text style={styles.schoolName}>{school.name}</Text>

      <View style={styles.doubleDivider} />
      <View style={styles.thinDivider} />

      {/* Exam title */}
      <Text style={styles.examTitle}>{exam.title}</Text>
      <Text style={styles.examSubtitle}>
        {exam.subject.subjectName} - {exam.class.name}
      </Text>

      {/* Formal metadata table */}
      <View style={styles.metaTable}>
        {metaRows.map((row) => (
          <View
            key={row.label}
            style={row.isLast ? styles.metaLastRow : styles.metaRow}
          >
            <View style={styles.metaLabelCell}>
              <Text style={styles.metaLabel}>{row.label}</Text>
            </View>
            <View style={styles.metaValueCell}>
              <Text style={styles.metaValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Student information section */}
      <View style={styles.studentSection}>
        <Text style={styles.studentTitle}>{labels.studentInfo}</Text>
        {[labels.name, labels.id, labels.classField, labels.dateField].map(
          (label) => (
            <View key={label} style={styles.fieldRow}>
              <FieldLine label={label} theme={theme} />
            </View>
          )
        )}
      </View>

      {/* Confidential stamp */}
      <View style={styles.confidential}>
        <Text style={styles.confidentialText}>{labels.confidential}</Text>
      </View>
    </View>
  )
}
