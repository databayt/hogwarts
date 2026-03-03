// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertBodyProps } from "../types"

const styles = StyleSheet.create({
  container: { marginVertical: 8, paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
  },
  label: { width: "50%", fontWeight: "bold" },
  value: { width: "50%", textAlign: "right" },
})

export function ReportSummaryBody({ data, theme }: CertBodyProps) {
  const items = [
    { label: theme.isRTL ? "المادة" : "Subject", value: data.subject || "-" },
    { label: theme.isRTL ? "الفصل" : "Class", value: data.className || "-" },
    {
      label: theme.isRTL ? "الامتحان" : "Assessment",
      value: data.examTitle || data.title,
    },
    {
      label: theme.isRTL ? "التاريخ" : "Date",
      value: data.examDate || data.issuedDate,
    },
  ]
  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[
            styles.row,
            { flexDirection: theme.isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                fontSize: theme.typography.bodySize,
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily,
                textAlign: theme.isRTL ? "right" : "left",
              },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              styles.value,
              {
                fontSize: theme.typography.bodySize,
                color: theme.colors.textLight,
                fontFamily: theme.typography.fontFamily,
                textAlign: theme.isRTL ? "left" : "right",
              },
            ]}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  )
}
