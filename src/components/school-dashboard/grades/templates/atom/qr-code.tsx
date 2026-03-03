// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface QrCodeProps {
  code: string
  size?: number
  label?: string
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  code: {
    fontSize: 6,
    fontFamily: "Courier",
    textAlign: "center",
  },
  label: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 2,
  },
})

export function QrCode({ code, size = 50, label }: QrCodeProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.box, { width: size, height: size }]}>
        <Text style={styles.code}>{code}</Text>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  )
}
