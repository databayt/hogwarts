// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { GradeBadge, ScoreDisplay } from "../atom"
import type { CertScoresProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    gap: 20,
  },
  item: { alignItems: "center" },
  label: { marginTop: 4 },
})

export function BadgeRowScores({ data, theme }: CertScoresProps) {
  if (!data.score && !data.grade) return null
  return (
    <View style={styles.container}>
      {data.grade && (
        <View style={styles.item}>
          <GradeBadge
            grade={data.grade}
            color={theme.colors.gold}
            textColor={theme.colors.primary}
          />
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
            {theme.isRTL ? "التقدير" : "Grade"}
          </Text>
        </View>
      )}
      {data.score != null && data.maxScore != null && (
        <View style={styles.item}>
          <ScoreDisplay
            score={data.score}
            maxScore={data.maxScore}
            color={theme.colors.primary}
          />
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
            {theme.isRTL ? "الدرجة" : "Score"}
          </Text>
        </View>
      )}
      {data.percentage != null && (
        <View style={styles.item}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            {Math.round(data.percentage)}%
          </Text>
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
            {theme.isRTL ? "النسبة" : "Percentage"}
          </Text>
        </View>
      )}
    </View>
  )
}
