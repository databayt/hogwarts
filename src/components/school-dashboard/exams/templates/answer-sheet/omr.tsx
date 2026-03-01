// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * OMR Answer Sheet — bubble sheet with alignment markers
 * For automated optical mark recognition scanning
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { AlignmentMarker, Bubble, FieldLine, TimingMark } from "../atom"
import { MCQ_OPTION_LABELS } from "../config"
import type { ExamWithDetails, PaperTheme, QuestionForPaper } from "../types"

export interface OmrAnswerSheetProps {
  questions: QuestionForPaper[]
  exam: ExamWithDetails
  theme: PaperTheme
  versionCode?: string
}

export function OmrAnswerSheet({
  questions,
  exam,
  theme,
  versionCode,
}: OmrAnswerSheetProps) {
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
    instructions: {
      backgroundColor: theme.backgroundColor,
      padding: 10,
      borderRadius: 4,
      marginBottom: 15,
    },
    instructionText: {
      fontSize: theme.fontSize.tiny,
      color: theme.accentColor,
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    bubbleRow: {
      width: "20%",
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 5,
    },
    qNumber: {
      width: 20,
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "left" : "right",
      marginRight: theme.isRTL ? 0 : 8,
      marginLeft: theme.isRTL ? 8 : 0,
      fontFamily: theme.fontFamily,
    },
    bubblesContainer: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      gap: 4,
    },
    bubbleOption: { alignItems: "center" },
    bubbleLabel: {
      fontSize: 7,
      color: theme.secondaryColor,
      textAlign: "center",
      marginTop: 1,
      fontFamily: theme.fontFamily,
    },
    guideLine: {
      width: "100%",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
      marginBottom: 5,
    },
    cornerMarkers: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  })

  const objective = questions.filter(
    (q) =>
      q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE"
  )

  return (
    <View style={styles.container}>
      {/* OMR corner markers */}
      <View style={styles.cornerMarkers}>
        <AlignmentMarker theme={theme} position="top-left" />
        <AlignmentMarker theme={theme} position="top-right" />
        <AlignmentMarker theme={theme} position="bottom-left" />
        <AlignmentMarker theme={theme} position="bottom-right" />
      </View>

      {/* Timing marks */}
      {objective.map((_, idx) => (
        <TimingMark key={idx} theme={theme} top={40 + idx * 22} />
      ))}

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

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {theme.isRTL
            ? "املأ الفقاعة بالكامل. استخدم قلم رصاص داكن فقط."
            : "Fill the bubble completely. Use dark pencil only."}
        </Text>
      </View>

      <View style={styles.grid}>
        {objective.map((q, idx) => (
          <React.Fragment key={q.id}>
            <View style={styles.bubbleRow}>
              <Text style={styles.qNumber}>{q.order}</Text>
              <View style={styles.bubblesContainer}>
                {(q.questionType === "MULTIPLE_CHOICE"
                  ? MCQ_OPTION_LABELS.slice(0, q.options?.length || 4)
                  : [theme.isRTL ? "ص" : "T", theme.isRTL ? "خ" : "F"]
                ).map((label, labelIdx) => (
                  <View key={labelIdx} style={styles.bubbleOption}>
                    <Bubble label="" theme={theme} size={12} />
                    <Text style={styles.bubbleLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
            {(idx + 1) % 5 === 0 && idx < objective.length - 1 && (
              <View style={styles.guideLine} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}
