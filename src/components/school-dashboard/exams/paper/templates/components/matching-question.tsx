// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Matching Question Renderer
 * Two-column layout: numbered items (left), lettered options (right)
 * Students draw lines or write letters to connect matches
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { QuestionForPaper } from "../../types"

interface MatchingQuestionProps {
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
      marginBottom: 20,
    },
    questionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 10,
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
    matchingContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginTop: 10,
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
      gap: 30,
    },
    column: {
      flex: 1,
    },
    columnHeader: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#6B7280",
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
      textTransform: "uppercase",
    },
    itemRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
      minHeight: 20,
    },
    itemNumber: {
      width: 20,
      fontSize: 10,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
    itemText: {
      flex: 1,
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    optionLetter: {
      width: 20,
      fontSize: 10,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
    // Answer blank next to each item for writing the matching letter
    answerBlank: {
      width: 25,
      borderBottomWidth: 1,
      borderBottomColor: "#374151",
      height: 14,
      marginLeft: isRTL ? 0 : 5,
      marginRight: isRTL ? 5 : 0,
    },
    centerDivider: {
      width: 1,
      backgroundColor: "#E5E7EB",
      marginHorizontal: 10,
    },
  })
}

const ITEM_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
const OPTION_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]

export function MatchingQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  locale,
  fontFamily,
}: MatchingQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Parse matching data from options
  // Expected format: options array where each has { text: "item | match" }
  const pairs = (question.options || []).map((opt) => {
    const parts = opt.text.split("|").map((s) => s.trim())
    return { item: parts[0] || opt.text, match: parts[1] || "" }
  })

  // Shuffle the match column for the paper (items stay in order)
  const items = pairs.map((p) => p.item)
  const matches = pairs.map((p) => p.match)

  return (
    <View style={styles.container}>
      {/* Question header */}
      <View style={styles.questionRow}>
        {showNumber && (
          <Text style={styles.questionNumber}>{question.order}.</Text>
        )}
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{question.questionText}</Text>

          {(showPoints || showType) && (
            <View style={styles.metaRow}>
              {showPoints && (
                <Text style={styles.metaText}>
                  [{question.points} {isRTL ? "درجة" : "pts"}]
                </Text>
              )}
              {showType && (
                <Text style={styles.metaText}>
                  {isRTL ? "مطابقة" : "Matching"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Two-column matching layout */}
      <View style={styles.matchingContainer}>
        {/* Items column (left) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>
            {isRTL ? "العبارات" : "Items"}
          </Text>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemNumber}>{ITEM_LABELS[idx]}.</Text>
              <Text style={styles.itemText}>{item}</Text>
              <View style={styles.answerBlank} />
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.centerDivider} />

        {/* Options column (right) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>
            {isRTL ? "الخيارات" : "Options"}
          </Text>
          {matches.map((match, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.optionLetter}>{OPTION_LABELS[idx]}.</Text>
              <Text style={styles.itemText}>{match}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
