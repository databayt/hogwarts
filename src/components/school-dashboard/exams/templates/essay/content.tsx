// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { AnswerLine, PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import type { QuestionWithLinesProps } from "../types"

export function EssayContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
  answerLines,
}: QuestionWithLinesProps) {
  const estimatedWords = answerLines * 8

  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap + 5 },
    row: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
    },
    content: { flex: 1 },
    text: {
      fontSize: theme.fontSize.body,
      color: theme.primaryColor,
      lineHeight: 1.5,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    meta: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginTop: 3,
      gap: 10,
    },
    answerArea: {
      marginTop: 12,
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
      borderWidth: 1,
      borderColor: theme.mutedColor,
      borderRadius: 4,
      padding: 10,
      backgroundColor: theme.surfaceColor,
    },
    wordCount: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      textAlign: theme.isRTL ? "left" : "right",
      marginTop: 5,
      fontFamily: theme.fontFamily,
    },
    imageContainer: { marginTop: 8, marginBottom: 8, alignItems: "center" },
    image: { maxWidth: 300, maxHeight: 150, objectFit: "contain" as never },
    rubricHint: {
      marginTop: 8,
      padding: 8,
      backgroundColor: "#FEF3C7",
      borderRadius: 4,
      borderLeftWidth: theme.isRTL ? 0 : 3,
      borderRightWidth: theme.isRTL ? 3 : 0,
      borderLeftColor: "#F59E0B",
      borderRightColor: "#F59E0B",
    },
    rubricText: {
      fontSize: theme.fontSize.tiny,
      color: "#92400E",
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showNumber && <QuestionNumber number={question.order} theme={theme} />}
        <View style={styles.content}>
          <Text style={styles.text}>{question.questionText}</Text>
          {(showPoints || showType) && (
            <View style={styles.meta}>
              {showPoints && (
                <PointsBadge points={question.points} theme={theme} />
              )}
              {showType && (
                <TypeLabel type={question.questionType} theme={theme} />
              )}
            </View>
          )}
        </View>
      </View>

      {question.imageUrl && (
        <View style={styles.imageContainer}>
          <Image src={question.imageUrl} style={styles.image} />
        </View>
      )}

      <View style={styles.answerArea}>
        {Array.from({ length: answerLines }).map((_, i) => (
          <AnswerLine key={i} theme={theme} />
        ))}
        <Text style={styles.wordCount}>
          {theme.isRTL
            ? `(حوالي ${estimatedWords} كلمة)`
            : `(approx. ${estimatedWords} words)`}
        </Text>
      </View>

      {question.gradingRubric && (
        <View style={styles.rubricHint}>
          <Text style={styles.rubricText}>
            {theme.isRTL ? "معايير التقييم: " : "Grading Focus: "}
            {question.gradingRubric}
          </Text>
        </View>
      )}
    </View>
  )
}
