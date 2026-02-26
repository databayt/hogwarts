// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ordering Question Renderer
 * Items displayed in random order with numbered boxes for sequence
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { QuestionForPaper } from "../../types"

interface OrderingQuestionProps {
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
    instructionText: {
      fontSize: 9,
      color: "#6B7280",
      fontStyle: "italic",
      marginBottom: 8,
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    itemsContainer: {
      marginLeft: isRTL ? 0 : 25,
      marginRight: isRTL ? 25 : 0,
    },
    itemRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
    },
    // Empty numbered box for students to write the correct sequence number
    orderBox: {
      width: 22,
      height: 22,
      borderWidth: 1.5,
      borderColor: "#374151",
      marginRight: isRTL ? 0 : 10,
      marginLeft: isRTL ? 10 : 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // Bullet marker to identify the item
    itemBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#9CA3AF",
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    itemText: {
      flex: 1,
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
  })
}

export function OrderingQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  locale,
  fontFamily,
}: OrderingQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Parse ordering items from options
  const items = (question.options || []).map((opt) => opt.text)

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
                  {isRTL ? "ترتيب" : "Ordering"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Instruction */}
      <Text style={styles.instructionText}>
        {isRTL
          ? "رتّب العناصر التالية بكتابة الرقم الصحيح في المربع:"
          : "Put the following items in the correct order by writing the number in the box:"}
      </Text>

      {/* Items with order boxes */}
      <View style={styles.itemsContainer}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.orderBox} />
            <View style={styles.itemBullet} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
