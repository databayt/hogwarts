// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface ScoreDisplayProps {
  score: number
  maxScore: number
  color?: string
  fontSize?: number
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  score: {
    fontWeight: "bold",
  },
  separator: {
    marginHorizontal: 2,
  },
  maxScore: {},
})

export function ScoreDisplay({
  score,
  maxScore,
  color = "#1a1a2e",
  fontSize = 18,
}: ScoreDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.score, { fontSize, color }]}>{score}</Text>
      <Text style={[styles.separator, { fontSize: fontSize * 0.7, color }]}>
        /
      </Text>
      <Text style={[styles.maxScore, { fontSize: fontSize * 0.7, color }]}>
        {maxScore}
      </Text>
    </View>
  )
}
