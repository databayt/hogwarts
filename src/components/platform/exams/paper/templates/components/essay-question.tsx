/**
 * Essay Question Renderer
 * Displays essay question with extended lined answer space
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { ANSWER_LINE_CONFIG } from "../../config"
import type { QuestionForPaper } from "../../types"

interface EssayQuestionProps {
  question: QuestionForPaper
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  answerLines: number
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    questionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
    },
    questionNumber: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1F2937",
      width: 25,
      fontFamily,
    },
    questionContent: {
      flex: 1,
    },
    questionText: {
      fontSize: 11,
      color: "#1F2937",
      lineHeight: 1.5,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    metaRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginTop: 3,
      gap: 10,
    },
    metaText: {
      fontSize: 8,
      color: "#6B7280",
      fontFamily,
    },
    answerArea: {
      marginTop: 12,
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 4,
      padding: 10,
      backgroundColor: "#FAFAFA",
    },
    answerLine: {
      borderBottomWidth: ANSWER_LINE_CONFIG.lineWidth,
      borderBottomColor: ANSWER_LINE_CONFIG.lineColor,
      height: ANSWER_LINE_CONFIG.lineHeight,
    },
    wordCount: {
      fontSize: 8,
      color: "#9CA3AF",
      textAlign: isRTL ? "left" : "right",
      marginTop: 5,
      fontFamily,
    },
    imageContainer: {
      marginTop: 8,
      marginBottom: 8,
      alignItems: "center",
    },
    rubricHint: {
      marginTop: 8,
      padding: 8,
      backgroundColor: "#FEF3C7",
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: "#F59E0B",
    },
    rubricText: {
      fontSize: 8,
      color: "#92400E",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
  })
}

export function EssayQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  answerLines,
  locale,
  fontFamily,
}: EssayQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Estimate word count suggestion based on answer lines
  const estimatedWords = answerLines * 8 // ~8 words per line

  return (
    <View style={styles.container}>
      {/* Question */}
      <View style={styles.questionRow}>
        {showNumber && (
          <Text style={styles.questionNumber}>{question.order}.</Text>
        )}
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{question.questionText}</Text>

          {/* Meta info */}
          {(showPoints || showType) && (
            <View style={styles.metaRow}>
              {showPoints && (
                <Text style={styles.metaText}>
                  [{question.points} {isRTL ? "درجة" : "pts"}]
                </Text>
              )}
              {showType && (
                <Text style={styles.metaText}>{isRTL ? "مقالي" : "Essay"}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Question Image (if any) */}
      {question.imageUrl && <View style={styles.imageContainer} />}

      {/* Answer Area */}
      <View style={styles.answerArea}>
        {Array.from({ length: answerLines }).map((_, index) => (
          <View key={index} style={styles.answerLine} />
        ))}
        <Text style={styles.wordCount}>
          {isRTL
            ? `(حوالي ${estimatedWords} كلمة)`
            : `(approx. ${estimatedWords} words)`}
        </Text>
      </View>

      {/* Optional grading rubric hint */}
      {question.gradingRubric && (
        <View style={styles.rubricHint}>
          <Text style={styles.rubricText}>
            {isRTL ? "معايير التقييم: " : "Grading Focus: "}
            {question.gradingRubric}
          </Text>
        </View>
      )}
    </View>
  )
}
