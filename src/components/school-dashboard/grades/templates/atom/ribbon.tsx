// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface RibbonProps {
  text?: string
  color?: string
  textColor?: string
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 30,
    right: -30,
    width: 180,
    transform: "rotate(45deg)",
    transformOrigin: "center",
  },
  ribbon: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  text: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
})

export function Ribbon({
  text = "CERTIFIED",
  color = "#C9A962",
  textColor = "#ffffff",
}: RibbonProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.ribbon, { backgroundColor: color }]}>
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      </View>
    </View>
  )
}
