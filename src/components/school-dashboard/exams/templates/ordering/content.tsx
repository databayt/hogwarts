// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { PointsBadge, QuestionNumber, TypeLabel } from "../atom"
import type { QuestionSectionProps } from "../types"

export function OrderingContent({
  question,
  theme,
  showNumber,
  showPoints,
  showType,
}: QuestionSectionProps) {
  const styles = StyleSheet.create({
    container: { marginBottom: theme.questionGap + 5 },
    headerRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    content: { flex: 1 },
    text: {
      fontSize: theme.fontSize.body,
      color: theme.primaryColor,
      lineHeight: 1.5,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    meta: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginTop: 3,
      gap: 10,
    },
    instruction: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      fontStyle: "italic",
      marginBottom: 8,
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    items: {
      marginLeft: theme.isRTL ? 0 : 25,
      marginRight: theme.isRTL ? 25 : 0,
    },
    itemRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginBottom: 8,
    },
    orderBox: {
      width: 22,
      height: 22,
      borderWidth: 1.5,
      borderColor: theme.accentColor,
      marginRight: theme.isRTL ? 0 : 10,
      marginLeft: theme.isRTL ? 10 : 0,
      alignItems: "center",
      justifyContent: "center",
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.secondaryColor,
      marginRight: theme.isRTL ? 0 : 8,
      marginLeft: theme.isRTL ? 8 : 0,
    },
    itemText: {
      flex: 1,
      fontSize: 10,
      color: theme.accentColor,
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
  })

  const items = (question.options || []).map((opt) => opt.text)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {showNumber && <QuestionNumber number={question.order} theme={theme} />}
        <View style={styles.content}>
          <Text style={styles.text}>{question.questionText}</Text>
          {(showPoints || showType) && (
            <View style={styles.meta}>
              {showPoints && (
                <PointsBadge points={question.points} theme={theme} />
              )}
              {showType && (
                <TypeLabel type={question.questionType} theme={theme} />
              )}
            </View>
          )}
        </View>
      </View>

      <Text style={styles.instruction}>
        {theme.isRTL
          ? "رتّب العناصر التالية بكتابة الرقم الصحيح في المربع:"
          : "Put the following items in the correct order by writing the number in the box:"}
      </Text>

      <View style={styles.items}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.orderBox} />
            <View style={styles.bullet} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
