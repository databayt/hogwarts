// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { BlankSlot, PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import type { PaperTheme, QuestionSectionProps } from "../types"

/** Parse question text and replace blank patterns with BlankSlot atoms */
function parseBlankText(text: string, theme: PaperTheme): React.ReactNode[] {
  const blankPattern = /(___|___+|\[blank\]|\{blank\})/gi
  const parts = text.split(blankPattern)

  return parts.map((part, index) => {
    if (blankPattern.test(part)) {
      return <BlankSlot key={index} theme={theme} />
    }
    return (
      <Text
        key={index}
        style={{
          fontSize: theme.fontSize.body,
          color: theme.primaryColor,
          lineHeight: 1.8,
          fontFamily: theme.fontFamily,
        }}
      >
        {part}
      </Text>
    )
  })
}

export function FillBlankContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
}: QuestionSectionProps) {
  const hasEmbeddedBlanks = /___|___+|\[blank\]|\{blank\}/i.test(
    question.questionText
  )

  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap },
    row: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
    },
    content: { flex: 1 },
    textContainer: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      flexWrap: "wrap",
      alignItems: "baseline",
    },
    text: {
      fontSize: theme.fontSize.body,
      color: theme.primaryColor,
      lineHeight: 1.8,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    meta: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginTop: 5,
      gap: 10,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showNumber && <QuestionNumber number={question.order} theme={theme} />}
        <View style={styles.content}>
          {hasEmbeddedBlanks ? (
            <View style={styles.textContainer}>
              {parseBlankText(question.questionText, theme)}
            </View>
          ) : (
            <>
              <Text style={styles.text}>{question.questionText}</Text>
              <BlankSlot theme={theme} />
            </>
          )}
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
    </View>
  )
}
