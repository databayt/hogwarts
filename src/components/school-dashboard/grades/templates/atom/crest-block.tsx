// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, View } from "@react-pdf/renderer"

interface CrestBlockProps {
  logoUrl?: string
  size?: number
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  placeholder: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
})

export function CrestBlock({ logoUrl, size = 60 }: CrestBlockProps) {
  if (!logoUrl) {
    return (
      <View style={styles.container}>
        <View style={[styles.placeholder, { width: size, height: size }]} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image
        src={logoUrl}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </View>
  )
}
