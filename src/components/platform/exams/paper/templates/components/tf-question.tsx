/**
 * True/False Question Renderer
 * Displays T/F question with checkboxes
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { QuestionForPaper } from "../../types"

interface TrueFalseQuestionProps {
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
      marginBottom: 12,
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
    optionsRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
      marginTop: 8,
      gap: 30,
    },
    option: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    checkbox: {
      width: 14,
      height: 14,
      borderWidth: 1.5,
      borderColor: "#374151",
      marginRight: isRTL ? 0 : 6,
      marginLeft: isRTL ? 6 : 0,
    },
    optionLabel: {
      fontSize: 10,
      color: "#374151",
      fontWeight: "bold",
      fontFamily,
    },
  })
}

export function TrueFalseQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  locale,
  fontFamily,
}: TrueFalseQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const labels = {
    true: isRTL ? "صح" : "True",
    false: isRTL ? "خطأ" : "False",
  }

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
                  {isRTL ? "صح/خطأ" : "True/False"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* True/False Options */}
      <View style={styles.optionsRow}>
        <View style={styles.option}>
          <View style={styles.checkbox} />
          <Text style={styles.optionLabel}>{labels.true}</Text>
        </View>
        <View style={styles.option}>
          <View style={styles.checkbox} />
          <Text style={styles.optionLabel}>{labels.false}</Text>
        </View>
      </View>
    </View>
  )
}
