// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bubble ID Student Info — OMR-scannable student ID bubbles
 * For automated grading systems that read student IDs via optical marks
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { Bubble, FieldLine } from "../atom"
import type { PaperTheme } from "../types"

export interface BubbleIdStudentInfoProps {
  theme: PaperTheme
  idDigits?: number
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

export function BubbleIdStudentInfo({
  theme,
  idDigits = 6,
}: BubbleIdStudentInfoProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.mutedColor,
      borderRadius: 4,
      padding: 12,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      marginBottom: 10,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    nameRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 12,
      gap: 20,
    },
    nameField: { flex: 1 },
    bubbleGrid: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      gap: 4,
    },
    digitColumn: { alignItems: "center", gap: 3 },
    digitHeader: {
      fontSize: theme.fontSize.tiny,
      fontWeight: "bold",
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
      marginBottom: 2,
    },
    instruction: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      marginTop: 8,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
      fontStyle: "italic",
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {theme.isRTL ? "بيانات الطالب" : "Student Information"}
      </Text>

      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <FieldLine label={theme.isRTL ? "الاسم:" : "Name:"} theme={theme} />
        </View>
        <View style={styles.nameField}>
          <FieldLine label={theme.isRTL ? "الفصل:" : "Class:"} theme={theme} />
        </View>
      </View>

      <View style={styles.bubbleGrid}>
        {Array.from({ length: idDigits }).map((_, colIdx) => (
          <View key={colIdx} style={styles.digitColumn}>
            <Text style={styles.digitHeader}>{colIdx + 1}</Text>
            {DIGITS.map((digit) => (
              <Bubble key={digit} label={digit} theme={theme} size={12} />
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.instruction}>
        {theme.isRTL
          ? "املأ الفقاعة المقابلة لكل رقم في رقم الطالب الخاص بك."
          : "Fill in the bubble corresponding to each digit of your student ID."}
      </Text>
    </View>
  )
}
