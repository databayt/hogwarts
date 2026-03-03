// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface GradeBadgeProps {
  grade: string
  size?: number
  color?: string
  textColor?: string
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  text: {
    fontWeight: "bold",
  },
})

export function GradeBadge({
  grade,
  size = 50,
  color = "#C9A962",
  textColor = "#1a1a2e",
}: GradeBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4, color: textColor }]}>
        {grade}
      </Text>
    </View>
  )
}
