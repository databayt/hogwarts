// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import type { QuestionSectionProps } from "../types"

const ITEM_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
const OPTION_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]

export function MatchingContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
}: QuestionSectionProps) {
  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap + 5 },
    headerRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 10,
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
    matchingContainer: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginTop: 10,
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
      gap: 30,
    },
    column: { flex: 1 },
    columnHeader: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.secondaryColor,
      marginBottom: 8,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
      textTransform: "uppercase",
    },
    itemRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
      minHeight: 20,
    },
    itemNumber: {
      width: 20,
      fontSize: 10,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    itemText: {
      flex: 1,
      fontSize: 10,
      color: theme.accentColor,
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    answerBlank: {
      width: 25,
      borderBottomWidth: 1,
      borderBottomColor: theme.accentColor,
      height: 14,
      marginLeft: theme.isRTL ? 0 : 5,
      marginRight: theme.isRTL ? 5 : 0,
    },
    divider: {
      width: 1,
      backgroundColor: theme.mutedColor,
      marginHorizontal: 10,
    },
  })

  // Parse options: "item | match" format
  const pairs = (question.options || []).map((opt) => {
    const parts = opt.text.split("|").map((s) => s.trim())
    return { item: parts[0] || opt.text, match: parts[1] || "" }
  })

  const items = pairs.map((p) => p.item)
  const matches = pairs.map((p) => p.match)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
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

      <View style={styles.matchingContainer}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>
            {theme.isRTL ? "العبارات" : "Items"}
          </Text>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemNumber}>{ITEM_LABELS[idx]}.</Text>
              <Text style={styles.itemText}>{item}</Text>
              <View style={styles.answerBlank} />
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.column}>
          <Text style={styles.columnHeader}>
            {theme.isRTL ? "الخيارات" : "Options"}
          </Text>
          {matches.map((match, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemNumber}>{OPTION_LABELS[idx]}.</Text>
              <Text style={styles.itemText}>{match}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
