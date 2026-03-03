// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

interface DecorativeLineProps {
  color?: string
  width?: string | number
  thickness?: number
  style?: "solid" | "dashed" | "dotted"
  marginVertical?: number
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
})

export function DecorativeLine({
  color = "#C9A962",
  width = "60%",
  thickness = 1,
  style = "solid",
  marginVertical = 8,
}: DecorativeLineProps) {
  return (
    <View style={styles.container}>
      <View
        style={{
          width,
          height: thickness,
          backgroundColor: style === "solid" ? color : "transparent",
          borderBottomWidth: style !== "solid" ? thickness : 0,
          borderBottomColor: color,
          borderStyle: style,
          marginVertical,
        }}
      />
    </View>
  )
}
