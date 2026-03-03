// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertScoresProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  gaugeOuter: {
    width: 200,
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 7,
    overflow: "hidden",
  },
  gaugeInner: { height: 14, borderRadius: 7 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginTop: 4,
  },
  label: { textAlign: "center" },
})

export function GaugeScores({ data, theme }: CertScoresProps) {
  const pct =
    data.percentage ??
    (data.score && data.maxScore ? (data.score / data.maxScore) * 100 : 0)
  if (!pct) return null
  const barColor =
    pct >= 90
      ? "#16a34a"
      : pct >= 70
        ? "#2563eb"
        : pct >= 50
          ? "#eab308"
          : "#dc2626"
  return (
    <View style={styles.container}>
      <View style={styles.gaugeOuter}>
        <View
          style={[
            styles.gaugeInner,
            { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text
          style={[
            styles.label,
            {
              fontSize: theme.typography.smallSize,
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {data.grade || ""}
        </Text>
        <Text
          style={[
            styles.label,
            {
              fontSize: theme.typography.smallSize,
              fontWeight: "bold",
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {Math.round(pct)}%
        </Text>
      </View>
    </View>
  )
}
