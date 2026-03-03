// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, View } from "@react-pdf/renderer"

interface SealProps {
  logoUrl?: string
  position?: "bottom-right" | "center" | "background"
  size?: number
  opacity?: number
}

const styles = StyleSheet.create({
  "bottom-right": {
    position: "absolute",
    bottom: 60,
    right: 60,
  },
  center: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  background: {
    position: "absolute",
    top: "30%",
    left: "25%",
  },
})

export function Seal({
  logoUrl,
  position = "bottom-right",
  size = 80,
  opacity = 0.15,
}: SealProps) {
  if (!logoUrl) return null

  return (
    <View style={styles[position]}>
      <Image src={logoUrl} style={{ width: size, height: size, opacity }} />
    </View>
  )
}
