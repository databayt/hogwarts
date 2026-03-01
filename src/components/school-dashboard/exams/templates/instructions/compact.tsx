// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Compact Instructions — single-line metadata for quizzes
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { InstructionsSectionProps } from "../types"

export function CompactInstructions({
  theme,
  totalMarks,
  totalQuestions,
  duration,
}: InstructionsSectionProps) {
  const styles = StyleSheet.create({
    container: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.backgroundColor,
      borderRadius: 3,
    },
    text: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    bold: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {theme.isRTL ? "الأسئلة: " : "Questions: "}
        <Text style={styles.bold}>{totalQuestions}</Text>
      </Text>
      <Text style={styles.text}>
        {theme.isRTL ? "الدرجات: " : "Marks: "}
        <Text style={styles.bold}>{totalMarks}</Text>
      </Text>
      <Text style={styles.text}>
        {theme.isRTL ? "المدة: " : "Time: "}
        <Text style={styles.bold}>
          {duration} {theme.isRTL ? "دقيقة" : "min"}
        </Text>
      </Text>
    </View>
  )
}
