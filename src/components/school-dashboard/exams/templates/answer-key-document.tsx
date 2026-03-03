// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Answer Key PDF Document
 * Renders a printable answer key using @react-pdf/renderer.
 * Follows the same pattern as ComposableDocument.
 */

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { AnswerKeyEntry } from "../paper/types"
import { QUESTION_TYPE_LABELS } from "./config"
import { ensureFontsRegistered } from "./fonts"
import type { ExamWithDetails, PaperTheme } from "./types"

export interface AnswerKeyDocumentProps {
  exam: ExamWithDetails
  answers: AnswerKeyEntry[]
  theme: PaperTheme
  versionCode?: string
}

export function AnswerKeyDocument({
  exam,
  answers,
  theme,
  versionCode,
}: AnswerKeyDocumentProps) {
  ensureFontsRegistered()

  const locale = theme.locale
  const isRTL = theme.isRTL
  const totalMarks = answers.reduce((sum, a) => sum + a.points, 0)

  const styles = StyleSheet.create({
    page: {
      padding: 50,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize.body,
      color: theme.primaryColor,
      direction: isRTL ? "rtl" : "ltr",
    },
    header: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
      paddingBottom: 12,
      marginBottom: 20,
    },
    title: {
      fontSize: theme.fontSize.title,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: theme.fontSize.subtitle,
      fontWeight: 500,
      textAlign: "center",
      color: theme.secondaryColor,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      marginTop: 6,
    },
    confidential: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      textAlign: "center",
      color: "#DC2626",
      marginTop: 8,
      textTransform: "uppercase",
    },
    questionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
      paddingVertical: 8,
      gap: 8,
    },
    questionNumber: {
      width: 30,
      fontWeight: "bold",
      textAlign: "center",
      fontSize: theme.fontSize.body,
    },
    questionBody: {
      flex: 1,
    },
    questionText: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      marginBottom: 3,
    },
    answerLabel: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.accentColor,
    },
    answer: {
      fontSize: theme.fontSize.body,
      fontWeight: 500,
    },
    explanation: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      fontStyle: "italic",
      marginTop: 2,
    },
    pointsBadge: {
      width: 40,
      textAlign: "center",
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
    },
    typeBadge: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      marginBottom: 2,
    },
    summary: {
      marginTop: 20,
      borderTopWidth: 2,
      borderTopColor: theme.primaryColor,
      paddingTop: 12,
    },
    summaryRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      fontSize: theme.fontSize.body,
      marginBottom: 4,
    },
    summaryLabel: {
      fontWeight: "bold",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 50,
      right: 50,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
    },
  })

  const labels = {
    title: locale === "ar" ? "مفتاح الإجابة" : "Answer Key",
    confidential:
      locale === "ar"
        ? "سري — للمعلم فقط"
        : "CONFIDENTIAL — FOR TEACHER USE ONLY",
    subject: locale === "ar" ? "المادة" : "Subject",
    class: locale === "ar" ? "الصف" : "Class",
    totalMarks: locale === "ar" ? "مجموع الدرجات" : "Total Marks",
    questions: locale === "ar" ? "عدد الأسئلة" : "Questions",
    duration: locale === "ar" ? "المدة" : "Duration",
    minutes: locale === "ar" ? "دقيقة" : "min",
    version: locale === "ar" ? "النسخة" : "Version",
    answer: locale === "ar" ? "الإجابة:" : "Answer:",
    accepted: locale === "ar" ? "الإجابات المقبولة:" : "Accepted answers:",
    model: locale === "ar" ? "الإجابة النموذجية:" : "Model answer:",
    explanation: locale === "ar" ? "التفسير:" : "Explanation:",
    pts: locale === "ar" ? "درجة" : "pts",
    page: locale === "ar" ? "صفحة" : "Page",
    summaryTitle:
      locale === "ar" ? "ملخص التوزيع" : "Mark Distribution Summary",
  }

  // Group answers by type for summary
  const typeSummary: Record<string, { count: number; marks: number }> = {}
  for (const a of answers) {
    const key = a.questionType
    if (!typeSummary[key]) typeSummary[key] = { count: 0, marks: 0 }
    typeSummary[key].count++
    typeSummary[key].marks += a.points
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>{exam.title}</Text>
          <View style={styles.metaRow}>
            <Text>
              {labels.subject}: {exam.subject.subjectName}
            </Text>
            <Text>
              {labels.class}: {exam.class.name}
            </Text>
            {versionCode && (
              <Text>
                {labels.version}: {versionCode}
              </Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text>
              {labels.totalMarks}: {totalMarks}
            </Text>
            <Text>
              {labels.questions}: {answers.length}
            </Text>
            <Text>
              {labels.duration}: {exam.duration} {labels.minutes}
            </Text>
          </View>
          <Text style={styles.confidential}>{labels.confidential}</Text>
        </View>

        {/* Answer entries */}
        {answers.map((entry) => (
          <View key={entry.questionId} style={styles.questionRow} wrap={false}>
            <Text style={styles.questionNumber}>{entry.order}</Text>
            <View style={styles.questionBody}>
              <Text style={styles.typeBadge}>
                {QUESTION_TYPE_LABELS[
                  entry.questionType as keyof typeof QUESTION_TYPE_LABELS
                ]?.[locale] ?? entry.questionType}
              </Text>
              <Text style={styles.questionText}>{entry.questionText}</Text>
              {typeof entry.correctAnswer === "string" ? (
                <View>
                  <Text style={styles.answer}>
                    <Text style={styles.answerLabel}>
                      {entry.questionType === "SHORT_ANSWER" ||
                      entry.questionType === "ESSAY"
                        ? labels.model
                        : labels.answer}{" "}
                    </Text>
                    {entry.correctAnswer}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.answerLabel}>{labels.accepted}</Text>
                  <Text style={styles.answer}>
                    {entry.correctAnswer.join(" | ")}
                  </Text>
                </View>
              )}
              {entry.explanation && (
                <Text style={styles.explanation}>
                  {labels.explanation} {entry.explanation}
                </Text>
              )}
            </View>
            <Text style={styles.pointsBadge}>
              {entry.points} {labels.pts}
            </Text>
          </View>
        ))}

        {/* Mark distribution summary */}
        <View style={styles.summary}>
          <Text
            style={{
              fontSize: theme.fontSize.heading,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            {labels.summaryTitle}
          </Text>
          {Object.entries(typeSummary).map(([type, data]) => (
            <View key={type} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {QUESTION_TYPE_LABELS[
                  type as keyof typeof QUESTION_TYPE_LABELS
                ]?.[locale] ?? type}
              </Text>
              <Text>
                {data.count} × {data.marks / data.count} = {data.marks}{" "}
                {labels.pts}
              </Text>
            </View>
          ))}
          <View
            style={[
              styles.summaryRow,
              {
                borderTopWidth: 1,
                borderTopColor: theme.primaryColor,
                paddingTop: 4,
                marginTop: 4,
              },
            ]}
          >
            <Text style={styles.summaryLabel}>{labels.totalMarks}</Text>
            <Text style={{ fontWeight: "bold" }}>
              {totalMarks} {labels.pts}
            </Text>
          </View>
        </View>

        {/* Footer with page number */}
        <View style={styles.footer} fixed>
          <Text>{labels.confidential}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${labels.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
