// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import {
  Bubble,
  OptionLabel,
  PointsBadge,
  QuestionNumber,
  TypeLabel,
} from "../atom"
import { MCQ_OPTION_LABELS } from "../config"
import type { QuestionSectionProps } from "../types"

export function MultipleChoiceContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
}: QuestionSectionProps) {
  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap },
    header: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 8,
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
    options: {
      marginTop: 8,
      paddingLeft: theme.isRTL ? 0 : 25,
      paddingRight: theme.isRTL ? 25 : 0,
    },
    optionRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    imageContainer: { marginTop: 8, marginBottom: 8, alignItems: "center" },
    image: { maxWidth: 300, maxHeight: 150, objectFit: "contain" as never },
  })

  const options = question.options || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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

      <View style={styles.options}>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <Bubble label={MCQ_OPTION_LABELS[index]} theme={theme} />
            <OptionLabel label={option.text} theme={theme} />
          </View>
        ))}
      </View>
    </View>
  )
}
