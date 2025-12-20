/**
 * Multiple Choice Question Renderer
 * Displays MCQ with options A-D and optional bubble markers
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { MCQ_CONFIG } from "../../config"
import type { QuestionForPaper } from "../../types"

interface MCQQuestionProps {
  question: QuestionForPaper
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    questionHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 8,
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
    optionsContainer: {
      marginTop: 8,
      paddingLeft: isRTL ? 0 : 25,
      paddingRight: isRTL ? 25 : 0,
    },
    optionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    optionBubble: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: "#374151",
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
      marginTop: 1,
    },
    optionLabel: {
      width: 20,
      fontSize: 10,
      fontWeight: "bold",
      color: "#374151",
      fontFamily,
    },
    optionText: {
      flex: 1,
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    imageContainer: {
      marginTop: 8,
      marginBottom: 8,
      alignItems: "center",
    },
    questionImage: {
      maxWidth: 300,
      maxHeight: 150,
      objectFit: "contain",
    },
  })
}

export function MCQQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  locale,
  fontFamily,
}: MCQQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const options = question.options || []
  const labels = MCQ_CONFIG.optionLabels

  return (
    <View style={styles.container}>
      {/* Question Header */}
      <View style={styles.questionHeader}>
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
                  {isRTL ? "اختيار متعدد" : "Multiple Choice"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Question Image (if any) */}
      {question.imageUrl && (
        <View style={styles.imageContainer}>
          {/* Note: Images would be rendered here in actual implementation */}
        </View>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <View style={styles.optionBubble} />
            <Text style={styles.optionLabel}>{labels[index]}.</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
