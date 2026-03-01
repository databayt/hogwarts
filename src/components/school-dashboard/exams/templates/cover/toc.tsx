// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Table of Contents — section-by-section breakdown with question counts and marks
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { QUESTION_TYPE_LABELS } from "../config"
import type { PaperTheme, QuestionForPaper } from "../types"

export interface TableOfContentsProps {
  questions: QuestionForPaper[]
  theme: PaperTheme
}

export function TableOfContents({ questions, theme }: TableOfContentsProps) {
  const styles = StyleSheet.create({
    container: { padding: 20 },
    title: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      marginBottom: 20,
      textTransform: "uppercase",
      fontFamily: theme.fontFamily,
    },
    row: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
    },
    sectionName: {
      fontSize: theme.fontSize.body,
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    metaContainer: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      gap: 15,
    },
    metaText: {
      fontSize: theme.fontSize.small + 1,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
    totalRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      marginTop: 5,
      borderTopWidth: 2,
      borderTopColor: theme.primaryColor,
    },
    totalLabel: {
      fontSize: theme.fontSize.heading - 2,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    totalValue: {
      fontSize: theme.fontSize.heading - 2,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  // Group by type
  const groups: Record<string, QuestionForPaper[]> = {}
  for (const q of questions) {
    if (!groups[q.questionType]) groups[q.questionType] = []
    groups[q.questionType].push(q)
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {theme.isRTL ? "محتويات الاختبار" : "EXAM CONTENTS"}
      </Text>

      {Object.entries(groups).map(([type, qs]) => {
        const sectionMarks = qs.reduce((sum, q) => sum + q.points, 0)
        const label =
          QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS]?.[
            theme.locale
          ] || type

        return (
          <View key={type} style={styles.row}>
            <Text style={styles.sectionName}>{label}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>
                {qs.length} {theme.isRTL ? "سؤال" : "Q"}
              </Text>
              <Text style={styles.metaText}>
                {sectionMarks} {theme.isRTL ? "درجة" : "marks"}
              </Text>
            </View>
          </View>
        )
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {theme.isRTL ? "الإجمالي" : "TOTAL"}
        </Text>
        <Text style={styles.totalValue}>
          {questions.length} {theme.isRTL ? "سؤال" : "Q"} / {totalMarks}{" "}
          {theme.isRTL ? "درجة" : "marks"}
        </Text>
      </View>
    </View>
  )
}
