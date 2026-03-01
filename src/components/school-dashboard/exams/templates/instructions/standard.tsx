// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Instructions — numbered list + duration/marks/questions metadata
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { DEFAULT_INSTRUCTIONS } from "../config"
import type { InstructionsSectionProps } from "../types"

export function StandardInstructions({
  theme,
  totalMarks,
  totalQuestions,
  duration,
  customInstructions,
}: InstructionsSectionProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: 4,
      padding: 12,
    },
    header: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
    },
    title: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      textTransform: "uppercase",
      fontFamily: theme.fontFamily,
    },
    metaContainer: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      gap: 15,
    },
    metaItem: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    metaLabel: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      marginRight: theme.isRTL ? 0 : 3,
      marginLeft: theme.isRTL ? 3 : 0,
      fontFamily: theme.fontFamily,
    },
    metaValue: {
      fontSize: theme.fontSize.small + 1,
      fontWeight: "bold",
      color: theme.primaryColor,
      fontFamily: theme.fontFamily,
    },
    list: {
      paddingLeft: theme.isRTL ? 0 : 10,
      paddingRight: theme.isRTL ? 10 : 0,
    },
    item: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 4,
    },
    bullet: {
      width: 15,
      fontSize: theme.fontSize.small + 1,
      color: theme.accentColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    text: {
      flex: 1,
      fontSize: theme.fontSize.small,
      color: theme.accentColor,
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    customSection: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.mutedColor,
    },
    customLabel: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.secondaryColor,
      marginBottom: 5,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    customText: {
      fontSize: theme.fontSize.small,
      color: theme.accentColor,
      lineHeight: 1.5,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
  })

  const labels = {
    instructions: theme.isRTL ? "تعليمات" : "INSTRUCTIONS",
    time: theme.isRTL ? "الوقت:" : "Time:",
    marks: theme.isRTL ? "الدرجات:" : "Marks:",
    questions: theme.isRTL ? "الأسئلة:" : "Questions:",
    minutes: theme.isRTL ? "دقيقة" : "min",
    special: theme.isRTL ? "تعليمات خاصة:" : "Special Instructions:",
  }

  const instructions = DEFAULT_INSTRUCTIONS[theme.locale]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{labels.instructions}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{labels.time}</Text>
            <Text style={styles.metaValue}>
              {duration} {labels.minutes}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{labels.marks}</Text>
            <Text style={styles.metaValue}>{totalMarks}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{labels.questions}</Text>
            <Text style={styles.metaValue}>{totalQuestions}</Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.bullet}>{index + 1}.</Text>
            <Text style={styles.text}>{instruction}</Text>
          </View>
        ))}
      </View>

      {customInstructions && (
        <View style={styles.customSection}>
          <Text style={styles.customLabel}>{labels.special}</Text>
          <Text style={styles.customText}>{customInstructions}</Text>
        </View>
      )}
    </View>
  )
}
