// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

interface GoldBorderProps {
  color?: string
  width?: number
  children: React.ReactNode
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 3,
    borderColor: "#C9A962",
    borderStyle: "solid",
  },
  inner: {
    position: "absolute",
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 1,
    borderColor: "#C9A962",
    borderStyle: "solid",
  },
  content: {
    flex: 1,
    marginTop: 30,
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 30,
  },
})

export function GoldBorder({
  color = "#C9A962",
  width = 3,
  children,
}: GoldBorderProps) {
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View
        style={[styles.outer, { borderColor: color, borderWidth: width }]}
      />
      <View style={[styles.inner, { borderColor: color }]} />
      <View style={styles.content}>{children}</View>
    </View>
  )
}
