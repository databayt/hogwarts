// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { Checkbox, PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import { TF_LABELS } from "../config"
import type { QuestionSectionProps } from "../types"

export function TrueFalseContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
}: QuestionSectionProps) {
  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap - 5 },
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
    options: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
      marginTop: 8,
      gap: 30,
    },
    option: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 6,
    },
    label: {
      fontSize: 10,
      color: theme.accentColor,
      fontWeight: "bold",
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
      <View style={styles.options}>
        <View style={styles.option}>
          <Checkbox theme={theme} />
          <Text style={styles.label}>{TF_LABELS.true[theme.locale]}</Text>
        </View>
        <View style={styles.option}>
          <Checkbox theme={theme} />
          <Text style={styles.label}>{TF_LABELS.false[theme.locale]}</Text>
        </View>
      </View>
    </View>
  )
}
