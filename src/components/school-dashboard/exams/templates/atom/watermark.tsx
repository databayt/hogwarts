// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface WatermarkProps {
  text: string
  theme: PaperTheme
  opacity?: number
  rotation?: number
  fontSize?: number
}

export function Watermark({
  text,
  theme,
  opacity = 0.06,
  rotation = -45,
  fontSize = 72,
}: WatermarkProps) {
  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      fontSize,
      color: theme.secondaryColor,
      opacity,
      transform: `rotate(${rotation}deg)`,
      fontWeight: "bold",
      fontFamily: theme.fontFamily,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}
