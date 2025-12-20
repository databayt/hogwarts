/**
 * Answer Sheet Component
 * Separate page for answers (regular or bubble/OMR style)
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { MCQ_CONFIG } from "../../config"
import type {
  ExamWithDetails,
  QuestionForPaper,
  SchoolForPaper,
} from "../../types"

interface AnswerSheetProps {
  questions: QuestionForPaper[]
  isBubbleSheet: boolean
  exam: ExamWithDetails
  school: SchoolForPaper
  locale: "en" | "ar"
  fontFamily: string
  versionCode?: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: "#1F2937",
      paddingBottom: 10,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      textTransform: "uppercase",
      fontFamily,
    },
    subtitle: {
      fontSize: 10,
      color: "#6B7280",
      textAlign: "center",
      marginTop: 5,
      fontFamily,
    },
    studentInfoRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginTop: 10,
      gap: 20,
    },
    studentField: {
      flex: 1,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    fieldLabel: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#374151",
      marginRight: isRTL ? 0 : 5,
      marginLeft: isRTL ? 5 : 0,
      fontFamily,
    },
    fieldLine: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#9CA3AF",
      borderStyle: "dotted",
      height: 16,
    },
    instructions: {
      backgroundColor: "#F3F4F6",
      padding: 10,
      borderRadius: 4,
      marginBottom: 15,
    },
    instructionText: {
      fontSize: 8,
      color: "#374151",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    answersGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    // Regular answer sheet styles
    answerRow: {
      width: "25%",
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 5,
    },
    questionNumber: {
      width: 25,
      fontSize: 9,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: isRTL ? "left" : "right",
      marginRight: isRTL ? 0 : 5,
      marginLeft: isRTL ? 5 : 0,
      fontFamily,
    },
    answerLine: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#9CA3AF",
      height: 14,
    },
    // Bubble sheet styles
    bubbleRow: {
      width: "20%",
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 5,
    },
    bubbleNumber: {
      width: 20,
      fontSize: 9,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: isRTL ? "left" : "right",
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
      fontFamily,
    },
    bubblesContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 4,
    },
    bubble: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: "#374151",
    },
    bubbleLabel: {
      fontSize: 7,
      color: "#6B7280",
      textAlign: "center",
      marginTop: 1,
      fontFamily,
    },
    bubbleOption: {
      alignItems: "center",
    },
    // Written answer section
    writtenSection: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#1F2937",
      marginBottom: 10,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    writtenAnswerRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    writtenNumber: {
      width: 25,
      fontSize: 9,
      fontWeight: "bold",
      color: "#1F2937",
      marginRight: isRTL ? 0 : 5,
      marginLeft: isRTL ? 5 : 0,
      fontFamily,
    },
    writtenLines: {
      flex: 1,
    },
    writtenLine: {
      borderBottomWidth: 0.5,
      borderBottomColor: "#D1D5DB",
      height: 18,
    },
  })
}

export function AnswerSheet({
  questions,
  isBubbleSheet,
  exam,
  school,
  locale,
  fontFamily,
  versionCode,
}: AnswerSheetProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Separate MCQ/TF questions from written questions
  const objectiveQuestions = questions.filter(
    (q) =>
      q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE"
  )
  const writtenQuestions = questions.filter(
    (q) =>
      q.questionType === "SHORT_ANSWER" ||
      q.questionType === "ESSAY" ||
      q.questionType === "FILL_BLANK"
  )

  const labels = {
    title: isRTL ? "ورقة الإجابة" : "ANSWER SHEET",
    subtitle: isRTL
      ? `${exam.title} - ${exam.subject.subjectName}`
      : `${exam.title} - ${exam.subject.subjectName}`,
    name: isRTL ? "الاسم:" : "Name:",
    id: isRTL ? "الرقم:" : "ID:",
    class: isRTL ? "الفصل:" : "Class:",
    instructions: isBubbleSheet
      ? isRTL
        ? "املأ الفقاعة بالكامل. استخدم قلم رصاص داكن فقط."
        : "Fill the bubble completely. Use dark pencil only."
      : isRTL
        ? "اكتب إجابتك بوضوح في المساحة المخصصة."
        : "Write your answer clearly in the space provided.",
    writtenAnswers: isRTL ? "الإجابات الكتابية" : "Written Answers",
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.subtitle}>
          {labels.subtitle}
          {versionCode && ` - ${isRTL ? "نسخة" : "Version"} ${versionCode}`}
        </Text>

        {/* Student Info Fields */}
        <View style={styles.studentInfoRow}>
          <View style={styles.studentField}>
            <Text style={styles.fieldLabel}>{labels.name}</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.studentField}>
            <Text style={styles.fieldLabel}>{labels.id}</Text>
            <View style={styles.fieldLine} />
          </View>
          <View style={styles.studentField}>
            <Text style={styles.fieldLabel}>{labels.class}</Text>
            <View style={styles.fieldLine} />
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>{labels.instructions}</Text>
      </View>

      {/* Objective Questions */}
      {objectiveQuestions.length > 0 && (
        <View style={styles.answersGrid}>
          {isBubbleSheet
            ? // Bubble Sheet Style
              objectiveQuestions.map((q) => (
                <View key={q.id} style={styles.bubbleRow}>
                  <Text style={styles.bubbleNumber}>{q.order}</Text>
                  <View style={styles.bubblesContainer}>
                    {(q.questionType === "MULTIPLE_CHOICE"
                      ? MCQ_CONFIG.optionLabels.slice(0, q.options?.length || 4)
                      : [isRTL ? "ص" : "T", isRTL ? "خ" : "F"]
                    ).map((label, idx) => (
                      <View key={idx} style={styles.bubbleOption}>
                        <View style={styles.bubble} />
                        <Text style={styles.bubbleLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            : // Regular Answer Lines
              objectiveQuestions.map((q) => (
                <View key={q.id} style={styles.answerRow}>
                  <Text style={styles.questionNumber}>{q.order}.</Text>
                  <View style={styles.answerLine} />
                </View>
              ))}
        </View>
      )}

      {/* Written Questions Section */}
      {writtenQuestions.length > 0 && (
        <View style={styles.writtenSection}>
          <Text style={styles.sectionTitle}>{labels.writtenAnswers}</Text>
          {writtenQuestions.map((q) => {
            const lineCount =
              q.questionType === "ESSAY"
                ? 8
                : q.questionType === "SHORT_ANSWER"
                  ? 3
                  : 2

            return (
              <View key={q.id} style={styles.writtenAnswerRow}>
                <Text style={styles.writtenNumber}>{q.order}.</Text>
                <View style={styles.writtenLines}>
                  {Array.from({ length: lineCount }).map((_, idx) => (
                    <View key={idx} style={styles.writtenLine} />
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
