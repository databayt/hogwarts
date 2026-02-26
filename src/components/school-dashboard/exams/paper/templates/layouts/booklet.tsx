// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Booklet Layout Components
 * Cover page, table of contents, and content wrapper for booklet-style exams
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type {
  ExamPaperData,
  ExamWithDetails,
  QuestionForPaper,
  SchoolForPaper,
} from "../../types"

// ============================================================================
// Cover Page
// ============================================================================

interface CoverPageProps {
  exam: ExamWithDetails
  school: SchoolForPaper
  metadata: ExamPaperData["metadata"]
  locale: "en" | "ar"
  fontFamily: string
}

const coverStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    },
    logoContainer: {
      marginBottom: 30,
    },
    logo: {
      width: 100,
      height: 100,
      objectFit: "contain",
    },
    schoolName: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      marginBottom: 10,
      fontFamily,
    },
    divider: {
      width: 200,
      borderBottomWidth: 2,
      borderBottomColor: "#1F2937",
      marginVertical: 20,
    },
    examTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 2,
      fontFamily,
    },
    examSubtitle: {
      fontSize: 14,
      color: "#374151",
      textAlign: "center",
      marginBottom: 25,
      fontFamily,
    },
    metaGrid: {
      width: "100%",
      maxWidth: 300,
      marginTop: 20,
    },
    metaRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: "#E5E7EB",
    },
    metaLabel: {
      fontSize: 11,
      color: "#6B7280",
      fontFamily,
    },
    metaValue: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
    studentInfoSection: {
      width: "100%",
      maxWidth: 350,
      marginTop: 40,
      padding: 20,
      borderWidth: 1,
      borderColor: "#1F2937",
      borderRadius: 4,
    },
    studentInfoTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1F2937",
      marginBottom: 12,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    fieldRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 10,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#374151",
      width: 80,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    fieldLine: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#9CA3AF",
      borderStyle: "dotted",
      height: 18,
      marginLeft: isRTL ? 0 : 5,
      marginRight: isRTL ? 5 : 0,
    },
    versionBadge: {
      position: "absolute",
      top: 30,
      right: 30,
      backgroundColor: "#1F2937",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 4,
    },
    versionText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#FFFFFF",
      fontFamily,
    },
  })
}

export function BookletCoverPage({
  exam,
  school,
  metadata,
  locale,
  fontFamily,
}: CoverPageProps) {
  const styles = coverStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const labels = {
    name: isRTL ? "الاسم:" : "Name:",
    id: isRTL ? "رقم الطالب:" : "Student ID:",
    class: isRTL ? "الفصل:" : "Class:",
    date: isRTL ? "التاريخ:" : "Date:",
    duration: isRTL ? "المدة:" : "Duration:",
    totalMarks: isRTL ? "إجمالي الدرجات:" : "Total Marks:",
    questions: isRTL ? "عدد الأسئلة:" : "Questions:",
    minutes: isRTL ? "دقيقة" : "min",
  }

  return (
    <View style={styles.container}>
      {/* Version Badge */}
      {metadata.versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {isRTL
              ? `نسخة ${metadata.versionCode}`
              : `Version ${metadata.versionCode}`}
          </Text>
        </View>
      )}

      {/* School Logo */}
      {school.logoUrl && (
        <View style={styles.logoContainer}>
          <Image src={school.logoUrl} style={styles.logo} />
        </View>
      )}

      {/* School Name */}
      <Text style={styles.schoolName}>{school.name}</Text>

      <View style={styles.divider} />

      {/* Exam Title */}
      <Text style={styles.examTitle}>{exam.title}</Text>
      <Text style={styles.examSubtitle}>
        {exam.subject.subjectName} - {exam.class.name}
      </Text>

      {/* Metadata */}
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

      {/* Student Info */}
      <View style={styles.studentInfoSection}>
        <Text style={styles.studentInfoTitle}>
          {isRTL ? "بيانات الطالب" : "Student Information"}
        </Text>
        {[labels.name, labels.id, labels.class, labels.date].map(
          (label, idx) => (
            <View key={idx} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={styles.fieldLine} />
            </View>
          )
        )}
      </View>
    </View>
  )
}

// ============================================================================
// Table of Contents
// ============================================================================

interface TOCProps {
  questions: QuestionForPaper[]
  locale: "en" | "ar"
  fontFamily: string
}

const tocStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      padding: 20,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      marginBottom: 20,
      textTransform: "uppercase",
      fontFamily,
    },
    sectionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: "#E5E7EB",
    },
    sectionName: {
      fontSize: 11,
      color: "#1F2937",
      fontFamily,
    },
    sectionMeta: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 15,
    },
    metaText: {
      fontSize: 10,
      color: "#6B7280",
      fontFamily,
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      marginTop: 5,
      borderTopWidth: 2,
      borderTopColor: "#1F2937",
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
    totalValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
  })
}

const SECTION_NAMES: Record<string, { en: string; ar: string }> = {
  MULTIPLE_CHOICE: {
    en: "Multiple Choice",
    ar: "اختيار متعدد",
  },
  TRUE_FALSE: { en: "True or False", ar: "صح أو خطأ" },
  FILL_BLANK: { en: "Fill in the Blanks", ar: "أكمل الفراغات" },
  SHORT_ANSWER: { en: "Short Answer", ar: "إجابة قصيرة" },
  ESSAY: { en: "Essay", ar: "مقالي" },
  MATCHING: { en: "Matching", ar: "مطابقة" },
  ORDERING: { en: "Ordering", ar: "ترتيب" },
}

export function BookletTOC({ questions, locale, fontFamily }: TOCProps) {
  const styles = tocStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Group questions by type
  const groups: Record<string, QuestionForPaper[]> = {}
  for (const q of questions) {
    if (!groups[q.questionType]) {
      groups[q.questionType] = []
    }
    groups[q.questionType].push(q)
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRTL ? "محتويات الاختبار" : "EXAM CONTENTS"}
      </Text>

      {Object.entries(groups).map(([type, qs]) => {
        const sectionMarks = qs.reduce((sum, q) => sum + q.points, 0)
        return (
          <View key={type} style={styles.sectionRow}>
            <Text style={styles.sectionName}>
              {SECTION_NAMES[type]?.[locale] || type}
            </Text>
            <View style={styles.sectionMeta}>
              <Text style={styles.metaText}>
                {qs.length} {isRTL ? "سؤال" : "Q"}
              </Text>
              <Text style={styles.metaText}>
                {sectionMarks} {isRTL ? "درجة" : "marks"}
              </Text>
            </View>
          </View>
        )
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{isRTL ? "الإجمالي" : "TOTAL"}</Text>
        <Text style={styles.totalValue}>
          {questions.length} {isRTL ? "سؤال" : "Q"} / {totalMarks}{" "}
          {isRTL ? "درجة" : "marks"}
        </Text>
      </View>
    </View>
  )
}
