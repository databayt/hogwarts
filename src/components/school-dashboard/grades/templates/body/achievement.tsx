// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertBodyProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 8, paddingHorizontal: 40 },
  text: { textAlign: "center", lineHeight: 1.6 },
})

export function AchievementBody({ data, theme }: CertBodyProps) {
  const text = theme.isRTL
    ? data.bodyTextAr ||
      `تقديراً للتفوق في مادة ${data.subjectAr || data.subject || ""} في ${data.examTitle || data.title}`
    : data.bodyText ||
      `In recognition of outstanding achievement in ${data.subject || ""} for ${data.examTitle || data.title}`
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            fontSize: theme.typography.bodySize + 1,
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}
