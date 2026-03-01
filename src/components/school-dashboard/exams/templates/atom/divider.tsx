// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface DividerProps {
  theme: PaperTheme
  variant?: "solid" | "dashed" | "double"
  color?: string
  thickness?: number
}

export function Divider({
  theme,
  variant,
  color,
  thickness = 1,
}: DividerProps) {
  const style = variant || theme.borderStyle
  const borderColor = color || theme.mutedColor

  if (style === "double") {
    const styles = StyleSheet.create({
      thick: { borderBottomWidth: 2, borderBottomColor: borderColor },
      thin: {
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        marginTop: 3,
      },
    })
    return (
      <View>
        <View style={styles.thick} />
        <View style={styles.thin} />
      </View>
    )
  }

  const styles = StyleSheet.create({
    line: {
      borderBottomWidth: thickness,
      borderBottomColor: borderColor,
      borderBottomStyle: style === "dashed" ? "dashed" : undefined,
    },
  })

  return <View style={styles.line} />
}
