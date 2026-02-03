/**
 * Short Answer Question Renderer
 * Displays question with lined answer space
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { ANSWER_LINE_CONFIG } from "../../config"
import type { QuestionForPaper } from "../../types"

interface ShortAnswerQuestionProps {
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
      marginBottom: 15,
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
      marginTop: 10,
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
    },
    answerLine: {
      borderBottomWidth: ANSWER_LINE_CONFIG.lineWidth,
      borderBottomColor: ANSWER_LINE_CONFIG.lineColor,
      height: ANSWER_LINE_CONFIG.lineHeight,
    },
    imageContainer: {
      marginTop: 8,
      marginBottom: 8,
      alignItems: "center",
    },
  })
}

export function ShortAnswerQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  answerLines,
  locale,
  fontFamily,
}: ShortAnswerQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

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
                <Text style={styles.metaText}>
                  {isRTL ? "إجابة قصيرة" : "Short Answer"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Question Image (if any) */}
      {question.imageUrl && <View style={styles.imageContainer} />}

      {/* Answer Lines */}
      <View style={styles.answerArea}>
        {Array.from({ length: answerLines }).map((_, index) => (
          <View key={index} style={styles.answerLine} />
        ))}
      </View>
    </View>
  )
}
