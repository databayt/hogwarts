// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sectioned Instructions — per-section instructions grouped by question type
 * MCQ rules, essay rules, etc. each in their own block. Useful for exams with
 * multiple question formats where each format has specific answering guidelines.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { QUESTION_TYPE_LABELS } from "../config"
import type { InstructionsSectionProps } from "../types"

export interface SectionedInstructionsProps extends InstructionsSectionProps {
  questionTypes?: string[]
}

/** Per-question-type instructions */
const SECTION_INSTRUCTIONS: Record<string, { en: string[]; ar: string[] }> = {
  MULTIPLE_CHOICE: {
    en: [
      "Select the ONE best answer for each question.",
      "Circle or shade the correct letter clearly.",
      "If you change your answer, erase completely.",
    ],
    ar: [
      "اختر الإجابة الأفضل لكل سؤال.",
      "ظلل أو ضع دائرة حول الحرف الصحيح بوضوح.",
      "إذا غيرت إجابتك، امسح بالكامل.",
    ],
  },
  TRUE_FALSE: {
    en: [
      "Write T for True or F for False.",
      "No marks for unanswered questions.",
    ],
    ar: ["اكتب ص للصحيح أو خ للخطأ.", "لا درجات للأسئلة غير المجابة."],
  },
  SHORT_ANSWER: {
    en: [
      "Answer briefly and to the point.",
      "Write your answer in the space provided.",
    ],
    ar: ["أجب بإيجاز وبشكل مباشر.", "اكتب إجابتك في المساحة المخصصة."],
  },
  ESSAY: {
    en: [
      "Plan your answer before writing.",
      "Structure with introduction, body, and conclusion.",
      "Marks are allocated for content, organization, and language.",
    ],
    ar: [
      "خطط لإجابتك قبل الكتابة.",
      "نظم إجابتك بمقدمة وعرض وخاتمة.",
      "تُمنح الدرجات على المحتوى والتنظيم واللغة.",
    ],
  },
  FILL_BLANK: {
    en: [
      "Write the correct word or phrase in the blank.",
      "Spelling must be correct for full marks.",
    ],
    ar: [
      "اكتب الكلمة أو العبارة الصحيحة في الفراغ.",
      "يجب أن يكون الإملاء صحيحاً للحصول على الدرجة الكاملة.",
    ],
  },
  MATCHING: {
    en: [
      "Match each item in Column A with the correct item in Column B.",
      "Each item may be used only once.",
    ],
    ar: [
      "طابق كل عنصر في العمود أ مع العنصر الصحيح في العمود ب.",
      "يُستخدم كل عنصر مرة واحدة فقط.",
    ],
  },
  ORDERING: {
    en: [
      "Arrange the items in the correct order.",
      "Number each item from 1 to N.",
    ],
    ar: ["رتب العناصر بالترتيب الصحيح.", "رقم كل عنصر من 1 إلى N."],
  },
}

export function SectionedInstructions({
  theme,
  totalMarks,
  totalQuestions,
  duration,
  customInstructions,
  questionTypes,
}: SectionedInstructionsProps) {
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
    section: {
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
    },
    lastSection: {
      marginBottom: 0,
    },
    sectionHeader: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 5,
    },
    sectionBadge: {
      backgroundColor: theme.primaryColor,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 3,
      marginRight: theme.isRTL ? 0 : 8,
      marginLeft: theme.isRTL ? 8 : 0,
    },
    sectionBadgeText: {
      fontSize: theme.fontSize.tiny,
      fontWeight: "bold",
      color: theme.surfaceColor,
      fontFamily: theme.fontFamily,
    },
    sectionTitle: {
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
      marginBottom: 3,
    },
    bullet: {
      width: 12,
      fontSize: theme.fontSize.small,
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
    instructions: theme.isRTL ? "تعليمات حسب القسم" : "SECTION INSTRUCTIONS",
    time: theme.isRTL ? "الوقت:" : "Time:",
    marks: theme.isRTL ? "الدرجات:" : "Marks:",
    questions: theme.isRTL ? "الأسئلة:" : "Questions:",
    minutes: theme.isRTL ? "دقيقة" : "min",
    special: theme.isRTL ? "تعليمات خاصة:" : "Special Instructions:",
  }

  // Default to common question types if none specified
  const types = questionTypes?.length
    ? questionTypes
    : ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"]

  const sections = types.filter((type) => SECTION_INSTRUCTIONS[type])

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

      {sections.map((type, idx) => {
        const typeLabel =
          QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS]?.[
            theme.locale
          ] || type
        const instructions = SECTION_INSTRUCTIONS[type]?.[theme.locale] || []

        return (
          <View
            key={type}
            style={
              idx < sections.length - 1 ? styles.section : styles.lastSection
            }
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>{typeLabel}</Text>
            </View>
            <View style={styles.list}>
              {instructions.map((instruction, iIdx) => (
                <View key={iIdx} style={styles.item}>
                  <Text style={styles.bullet}>-</Text>
                  <Text style={styles.text}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        )
      })}

      {customInstructions && (
        <View style={styles.customSection}>
          <Text style={styles.customLabel}>{labels.special}</Text>
          <Text style={styles.customText}>{customInstructions}</Text>
        </View>
      )}
    </View>
  )
}
