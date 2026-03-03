// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Grid Answer Sheet — graph paper grid for math/graph questions
 * Provides a grid-based answer area with numbered cells, suitable for
 * plotting, graphing, geometry, and calculation-heavy exams.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { FieldLine } from "../atom"
import type { ExamWithDetails, PaperTheme, QuestionForPaper } from "../types"

export interface GridAnswerSheetProps {
  questions: QuestionForPaper[]
  exam: ExamWithDetails
  theme: PaperTheme
  versionCode?: string
}

export function GridAnswerSheet({
  questions,
  exam,
  theme,
  versionCode,
}: GridAnswerSheetProps) {
  const cellSize = 12
  const gridCols = 20
  const gridRows = 15

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
    questionBlock: {
      marginBottom: 20,
    },
    questionHeader: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    questionNumber: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    questionPoints: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    gridContainer: {
      borderWidth: 1,
      borderColor: theme.mutedColor,
      alignSelf: "center",
    },
    gridRow: {
      flexDirection: "row",
    },
    gridCell: {
      width: cellSize,
      height: cellSize,
      borderRightWidth: 0.5,
      borderBottomWidth: 0.5,
      borderRightColor: theme.mutedColor,
      borderBottomColor: theme.mutedColor,
    },
    gridCellAccent: {
      width: cellSize,
      height: cellSize,
      borderRightWidth: 0.5,
      borderBottomWidth: 0.5,
      borderRightColor: theme.mutedColor,
      borderBottomColor: theme.mutedColor,
      backgroundColor: theme.backgroundColor,
    },
    answerLabel: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      marginTop: 4,
      fontStyle: "italic",
      fontFamily: theme.fontFamily,
    },
    workingArea: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.mutedColor,
      borderStyle: "dashed" as never,
      padding: 10,
      minHeight: 60,
    },
    workingLabel: {
      fontSize: theme.fontSize.tiny,
      color: theme.mutedColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
  })

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

      {questions.map((q) => (
        <View key={q.id} style={styles.questionBlock}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              {theme.isRTL ? `سؤال ${q.order}` : `Question ${q.order}`}
            </Text>
            <Text style={styles.questionPoints}>
              [{q.points} {theme.isRTL ? "درجة" : "marks"}]
            </Text>
          </View>

          {/* Graph paper grid */}
          <View style={styles.gridContainer}>
            {Array.from({ length: gridRows }).map((_, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {Array.from({ length: gridCols }).map((_, colIdx) => (
                  <View
                    key={colIdx}
                    style={
                      rowIdx % 5 === 0 || colIdx % 5 === 0
                        ? styles.gridCellAccent
                        : styles.gridCell
                    }
                  />
                ))}
              </View>
            ))}
          </View>

          <Text style={styles.answerLabel}>
            {theme.isRTL
              ? "ارسم أو اكتب إجابتك في الشبكة أعلاه."
              : "Plot or write your answer in the grid above."}
          </Text>

          {/* Working area */}
          <View style={styles.workingArea}>
            <Text style={styles.workingLabel}>
              {theme.isRTL ? "مساحة العمل:" : "Working space:"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
