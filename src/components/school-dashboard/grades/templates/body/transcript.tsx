// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertBodyProps } from "../types"

const styles = StyleSheet.create({
  container: { marginVertical: 8, paddingHorizontal: 10 },
  text: { textAlign: "center", lineHeight: 1.5 },
})

export function TranscriptBody({ data, theme }: CertBodyProps) {
  const text = theme.isRTL
    ? data.bodyTextAr || "يشهد هذا الكشف بالسجل الأكاديمي للطالب المذكور أعلاه"
    : data.bodyText ||
      "This transcript certifies the academic record of the above-named student"
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            fontSize: theme.typography.bodySize,
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
