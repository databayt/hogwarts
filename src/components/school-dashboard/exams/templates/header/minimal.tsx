// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Minimal Header — title-only for quizzes and pop quizzes
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { ExamWithDetails, PaperTheme } from "../types"

export interface MinimalHeaderProps {
  exam: ExamWithDetails
  theme: PaperTheme
}

export function MinimalHeader({ exam, theme }: MinimalHeaderProps) {
  const styles = StyleSheet.create({
    header: {
      marginBottom: 15,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
    },
    title: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    meta: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      marginTop: 4,
      gap: 15,
    },
    metaText: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{exam.title}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {exam.subject.subjectName} - {exam.class.name}
        </Text>
        <Text style={styles.metaText}>
          {theme.isRTL ? `${exam.duration} دقيقة` : `${exam.duration} min`}
        </Text>
      </View>
    </View>
  )
}
