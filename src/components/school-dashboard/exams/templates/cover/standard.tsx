// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Cover Page — booklet cover with logo, title, metadata, student fields
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

export interface StandardCoverProps {
  exam: ExamWithDetails
  school: SchoolForPaper
  metadata: PaperMetadata
  theme: PaperTheme
}

export function StandardCover({
  exam,
  school,
  metadata,
  theme,
}: StandardCoverProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    },
    logoContainer: { marginBottom: 30 },
    logo: { width: 100, height: 100, objectFit: "contain" as never },
    schoolName: {
      fontSize: theme.fontSize.title,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      marginBottom: 10,
      fontFamily: theme.fontFamily,
    },
    divider: {
      width: 200,
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
      marginVertical: 20,
    },
    examTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 2,
      fontFamily: theme.fontFamily,
    },
    examSubtitle: {
      fontSize: theme.fontSize.heading,
      color: theme.accentColor,
      textAlign: "center",
      marginBottom: 25,
      fontFamily: theme.fontFamily,
    },
    metaGrid: { width: "100%", maxWidth: 300, marginTop: 20 },
    metaRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
    },
    metaLabel: {
      fontSize: theme.fontSize.body,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    metaValue: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    studentSection: {
      width: "100%",
      maxWidth: 350,
      marginTop: 40,
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
      right: 30,
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
  })

  const labels = {
    duration: theme.isRTL ? "المدة:" : "Duration:",
    totalMarks: theme.isRTL ? "إجمالي الدرجات:" : "Total Marks:",
    questions: theme.isRTL ? "عدد الأسئلة:" : "Questions:",
    minutes: theme.isRTL ? "دقيقة" : "min",
    studentInfo: theme.isRTL ? "بيانات الطالب" : "Student Information",
    name: theme.isRTL ? "الاسم:" : "Name:",
    id: theme.isRTL ? "رقم الطالب:" : "Student ID:",
    class: theme.isRTL ? "الفصل:" : "Class:",
    date: theme.isRTL ? "التاريخ:" : "Date:",
  }

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

      {school.logoUrl && (
        <View style={styles.logoContainer}>
          <Image src={school.logoUrl} style={styles.logo} />
        </View>
      )}

      <Text style={styles.schoolName}>{school.name}</Text>
      <View style={styles.divider} />

      <Text style={styles.examTitle}>{exam.title}</Text>
      <Text style={styles.examSubtitle}>
        {exam.subject.subjectName} - {exam.class.name}
      </Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{labels.duration}</Text>
          <Text style={styles.metaValue}>
            {metadata.duration} {labels.minutes}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{labels.totalMarks}</Text>
          <Text style={styles.metaValue}>{metadata.totalMarks}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{labels.questions}</Text>
          <Text style={styles.metaValue}>{metadata.totalQuestions}</Text>
        </View>
      </View>

      <View style={styles.studentSection}>
        <Text style={styles.studentTitle}>{labels.studentInfo}</Text>
        {[labels.name, labels.id, labels.class, labels.date].map((label) => (
          <View key={label} style={styles.fieldRow}>
            <FieldLine label={label} theme={theme} />
          </View>
        ))}
      </View>
    </View>
  )
}
