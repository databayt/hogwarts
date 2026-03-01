// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Answer Sheet — answer lines in a grid
 * Separate objective (line) and written (multi-line) sections
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { AnswerLine, FieldLine } from "../atom"
import type { ExamWithDetails, PaperTheme, QuestionForPaper } from "../types"

export interface StandardAnswerSheetProps {
  questions: QuestionForPaper[]
  exam: ExamWithDetails
  theme: PaperTheme
  versionCode?: string
}

export function StandardAnswerSheet({
  questions,
  exam,
  theme,
  versionCode,
}: StandardAnswerSheetProps) {
  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      marginBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryColor,
      paddingBottom: 10,
    },
    title: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      textTransform: "uppercase",
      fontFamily: theme.fontFamily,
    },
    subtitle: {
      fontSize: theme.fontSize.small + 1,
      color: theme.secondaryColor,
      textAlign: "center",
      marginTop: 5,
      fontFamily: theme.fontFamily,
    },
    studentRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginTop: 10,
      gap: 20,
    },
    studentField: { flex: 1 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    answerRow: {
      width: "25%",
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 5,
    },
    qNumber: {
      width: 25,
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "left" : "right",
      marginRight: theme.isRTL ? 0 : 5,
      marginLeft: theme.isRTL ? 5 : 0,
      fontFamily: theme.fontFamily,
    },
    writtenSection: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.mutedColor,
    },
    sectionTitle: {
      fontSize: theme.fontSize.small + 1,
      fontWeight: "bold",
      color: theme.primaryColor,
      marginBottom: 10,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    writtenRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    writtenNumber: {
      width: 25,
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      marginRight: theme.isRTL ? 0 : 5,
      marginLeft: theme.isRTL ? 5 : 0,
      fontFamily: theme.fontFamily,
    },
    writtenLines: { flex: 1 },
  })

  const objective = questions.filter(
    (q) =>
      q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE"
  )
  const written = questions.filter(
    (q) =>
      q.questionType === "SHORT_ANSWER" ||
      q.questionType === "ESSAY" ||
      q.questionType === "FILL_BLANK"
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {theme.isRTL ? "ورقة الإجابة" : "ANSWER SHEET"}
        </Text>
        <Text style={styles.subtitle}>
          {exam.title} - {exam.subject.subjectName}
          {versionCode &&
            ` - ${theme.isRTL ? "نسخة" : "Version"} ${versionCode}`}
        </Text>
        <View style={styles.studentRow}>
          <View style={styles.studentField}>
            <FieldLine label={theme.isRTL ? "الاسم:" : "Name:"} theme={theme} />
          </View>
          <View style={styles.studentField}>
            <FieldLine label={theme.isRTL ? "الرقم:" : "ID:"} theme={theme} />
          </View>
          <View style={styles.studentField}>
            <FieldLine
              label={theme.isRTL ? "الفصل:" : "Class:"}
              theme={theme}
            />
          </View>
        </View>
      </View>

      {objective.length > 0 && (
        <View style={styles.grid}>
          {objective.map((q) => (
            <View key={q.id} style={styles.answerRow}>
              <Text style={styles.qNumber}>{q.order}.</Text>
              <AnswerLine theme={theme} />
            </View>
          ))}
        </View>
      )}

      {written.length > 0 && (
        <View style={styles.writtenSection}>
          <Text style={styles.sectionTitle}>
            {theme.isRTL ? "الإجابات الكتابية" : "Written Answers"}
          </Text>
          {written.map((q) => {
            const lineCount =
              q.questionType === "ESSAY"
                ? 8
                : q.questionType === "SHORT_ANSWER"
                  ? 3
                  : 2
            return (
              <View key={q.id} style={styles.writtenRow}>
                <Text style={styles.writtenNumber}>{q.order}.</Text>
                <View style={styles.writtenLines}>
                  {Array.from({ length: lineCount }).map((_, idx) => (
                    <AnswerLine key={idx} theme={theme} />
                  ))}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
