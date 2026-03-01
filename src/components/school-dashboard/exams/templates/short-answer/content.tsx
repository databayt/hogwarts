// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { AnswerLine, PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import type { QuestionWithLinesProps } from "../types"

export function ShortAnswerContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
  answerLines,
}: QuestionWithLinesProps) {
  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap },
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
      marginTop: 10,
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
    },
    imageContainer: { marginTop: 8, marginBottom: 8, alignItems: "center" },
    image: { maxWidth: 300, maxHeight: 150, objectFit: "contain" as never },
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
      </View>
    </View>
  )
}
