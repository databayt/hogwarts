// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

interface SignatureLineProps {
  name: string
  title: string
  signatureUrl?: string
  lineWidth?: number
  color?: string
  fontSize?: number
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 160,
  },
  signatureImage: {
    height: 30,
    marginBottom: 4,
    objectFit: "contain",
  },
  line: {
    height: 1,
    width: "100%",
    marginBottom: 4,
    marginTop: 20,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  title: {
    color: "#6b7280",
  },
})

export function SignatureLine({
  name,
  title,
  signatureUrl,
  lineWidth = 140,
  color = "#1a1a2e",
  fontSize = 9,
}: SignatureLineProps) {
  return (
    <View style={styles.container}>
      {signatureUrl && (
        <Image
          src={signatureUrl}
          style={[styles.signatureImage, { width: lineWidth }]}
        />
      )}
      <View
        style={[styles.line, { width: lineWidth, backgroundColor: color }]}
      />
      <Text style={[styles.name, { fontSize, color }]}>{name}</Text>
      <Text style={[styles.title, { fontSize: fontSize - 1 }]}>{title}</Text>
    </View>
  )
}
