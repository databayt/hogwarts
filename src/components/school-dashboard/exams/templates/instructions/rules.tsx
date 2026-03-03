// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Rules Instructions — exam rules emphasis with prohibited items and warning text
 * Bold "EXAM RULES" title, lists prohibited items (phones, calculators), warning text.
 * Used for high-stakes exams where rule compliance is critical.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { InstructionsSectionProps } from "../types"

export function RulesInstructions({
  theme,
  totalMarks,
  totalQuestions,
  duration,
  customInstructions,
}: InstructionsSectionProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 2,
      borderColor: theme.primaryColor,
      borderRadius: 4,
      padding: 12,
    },
    header: {
      backgroundColor: theme.primaryColor,
      marginHorizontal: -12,
      marginTop: -12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    title: {
      fontSize: theme.fontSize.heading,
      fontWeight: "bold",
      color: theme.surfaceColor,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 2,
      fontFamily: theme.fontFamily,
    },
    metaRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      gap: 20,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
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
    sectionTitle: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      marginBottom: 6,
      marginTop: 8,
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
    prohibitedItem: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 4,
    },
    prohibitedBullet: {
      width: 15,
      fontSize: theme.fontSize.small + 1,
      color: "#DC2626",
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    prohibitedText: {
      flex: 1,
      fontSize: theme.fontSize.small,
      color: "#DC2626",
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    warningBox: {
      marginTop: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#FECACA",
      borderRadius: 3,
    },
    warningText: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: "#DC2626",
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    customSection: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.mutedColor,
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
    title: theme.isRTL ? "قواعد الاختبار" : "EXAM RULES",
    time: theme.isRTL ? "الوقت:" : "Time:",
    marks: theme.isRTL ? "الدرجات:" : "Marks:",
    questions: theme.isRTL ? "الأسئلة:" : "Questions:",
    minutes: theme.isRTL ? "دقيقة" : "min",
    generalRules: theme.isRTL ? "التعليمات العامة:" : "General Instructions:",
    prohibited: theme.isRTL ? "الممنوعات:" : "Prohibited Items:",
  }

  const generalRules = theme.isRTL
    ? [
        "أجب على جميع الأسئلة في المساحات المخصصة.",
        "اكتب بوضوح باستخدام الحبر الأسود أو الأزرق.",
        "أظهر جميع خطوات الحل للأسئلة الحسابية.",
        "راجع إجاباتك قبل التسليم.",
      ]
    : [
        "Answer all questions in the spaces provided.",
        "Write clearly using black or blue ink.",
        "Show all working for calculation questions.",
        "Check your answers before submitting.",
      ]

  const prohibitedItems = theme.isRTL
    ? [
        "الهواتف المحمولة والأجهزة الإلكترونية.",
        "الآلات الحاسبة (إلا إذا سُمح بها).",
        "الملاحظات والكتب والمراجع.",
        "التواصل مع الطلاب الآخرين.",
      ]
    : [
        "Mobile phones and electronic devices.",
        "Calculators (unless explicitly permitted).",
        "Notes, books, and reference materials.",
        "Communication with other students.",
      ]

  const warningMessage = theme.isRTL
    ? "تحذير: أي مخالفة للقواعد أعلاه قد تؤدي إلى إلغاء الاختبار."
    : "WARNING: Any violation of the above rules may result in exam cancellation."

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{labels.title}</Text>
      </View>

      <View style={styles.metaRow}>
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

      {/* General rules */}
      <Text style={styles.sectionTitle}>{labels.generalRules}</Text>
      <View style={styles.list}>
        {generalRules.map((rule, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.bullet}>{index + 1}.</Text>
            <Text style={styles.text}>{rule}</Text>
          </View>
        ))}
      </View>

      {/* Prohibited items */}
      <Text style={styles.sectionTitle}>{labels.prohibited}</Text>
      <View style={styles.list}>
        {prohibitedItems.map((item, index) => (
          <View key={index} style={styles.prohibitedItem}>
            <Text style={styles.prohibitedBullet}>✕</Text>
            <Text style={styles.prohibitedText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Warning box */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>{warningMessage}</Text>
      </View>

      {customInstructions && (
        <View style={styles.customSection}>
          <Text style={styles.customText}>{customInstructions}</Text>
        </View>
      )}
    </View>
  )
}
