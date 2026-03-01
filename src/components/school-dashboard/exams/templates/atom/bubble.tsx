// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface BubbleProps {
  label: string
  theme: PaperTheme
  size?: number
}

export function Bubble({ label, theme, size = 14 }: BubbleProps) {
  const styles = StyleSheet.create({
    bubble: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: theme.accentColor,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: size - 6,
      fontWeight: "bold",
      color: theme.accentColor,
      fontFamily: theme.fontFamily,
      textAlign: "center",
    },
  })

  return (
    <View style={styles.bubble}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}
