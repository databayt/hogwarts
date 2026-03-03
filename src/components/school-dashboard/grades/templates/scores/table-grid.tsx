// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertScoresProps } from "../types"

const styles = StyleSheet.create({
  container: { marginVertical: 8, alignItems: "center" },
  table: { borderWidth: 1, borderColor: "#d1d5db" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerRow: { backgroundColor: "#f9fafb" },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    width: 90,
    textAlign: "center",
  },
  headerCell: { fontWeight: "bold" },
})

export function TableGridScores({ data, theme }: CertScoresProps) {
  if (!data.score && !data.grade) return null
  const headers = theme.isRTL
    ? ["التقدير", "الدرجة", "النسبة", "الترتيب"]
    : ["Grade", "Score", "%", "Rank"]
  const values = [
    data.grade || "-",
    data.score != null && data.maxScore != null
      ? `${data.score}/${data.maxScore}`
      : "-",
    data.percentage != null ? `${Math.round(data.percentage)}%` : "-",
    data.rank
      ? `${data.rank}${data.totalStudents ? `/${data.totalStudents}` : ""}`
      : "-",
  ]
  return (
    <View style={styles.container}>
      <View style={styles.table}>
        <View
          style={[
            styles.row,
            styles.headerRow,
            { flexDirection: theme.isRTL ? "row-reverse" : "row" },
          ]}
        >
          {headers.map((h, i) => (
            <Text
              key={i}
              style={[
                styles.cell,
                styles.headerCell,
                {
                  fontSize: theme.typography.smallSize,
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily,
                },
              ]}
            >
              {h}
            </Text>
          ))}
        </View>
        <View
          style={[
            styles.row,
            { flexDirection: theme.isRTL ? "row-reverse" : "row" },
          ]}
        >
          {values.map((v, i) => (
            <Text
              key={i}
              style={[
                styles.cell,
                {
                  fontSize: theme.typography.bodySize,
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily,
                },
              ]}
            >
              {v}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}
