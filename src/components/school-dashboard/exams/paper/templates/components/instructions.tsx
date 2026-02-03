/**
 * Exam Instructions Section
 * Standard and custom instructions for the exam
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { DEFAULT_INSTRUCTIONS } from "../../config"

interface InstructionsProps {
  customInstructions?: string
  totalMarks: number
  totalQuestions: number
  duration: number // minutes
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: "#1F2937",
      borderRadius: 4,
      padding: 12,
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    title: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1F2937",
      textTransform: "uppercase",
      fontFamily,
    },
    metaContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 15,
    },
    metaItem: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    metaLabel: {
      fontSize: 9,
      color: "#6B7280",
      marginRight: isRTL ? 0 : 3,
      marginLeft: isRTL ? 3 : 0,
      fontFamily,
    },
    metaValue: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#1F2937",
      fontFamily,
    },
    instructionsList: {
      paddingLeft: isRTL ? 0 : 10,
      paddingRight: isRTL ? 10 : 0,
    },
    instructionItem: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 4,
    },
    bullet: {
      width: 15,
      fontSize: 10,
      color: "#374151",
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    instructionText: {
      flex: 1,
      fontSize: 9,
      color: "#374151",
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    customSection: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    customLabel: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#6B7280",
      marginBottom: 5,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    customText: {
      fontSize: 9,
      color: "#374151",
      lineHeight: 1.5,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
  })
}

export function Instructions({
  customInstructions,
  totalMarks,
  totalQuestions,
  duration,
  locale,
  fontFamily,
}: InstructionsProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const labels = {
    instructions: isRTL ? "تعليمات" : "INSTRUCTIONS",
    time: isRTL ? "الوقت:" : "Time:",
    marks: isRTL ? "الدرجات:" : "Marks:",
    questions: isRTL ? "الأسئلة:" : "Questions:",
    minutes: isRTL ? "دقيقة" : "min",
    special: isRTL ? "تعليمات خاصة:" : "Special Instructions:",
  }

  const instructions = isRTL ? DEFAULT_INSTRUCTIONS.ar : DEFAULT_INSTRUCTIONS.en

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

      <View style={styles.instructionsList}>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <Text style={styles.bullet}>{index + 1}.</Text>
            <Text style={styles.instructionText}>{instruction}</Text>
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
