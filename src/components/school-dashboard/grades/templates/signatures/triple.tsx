// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import { SignatureLine } from "../atom"
import type { CertSignaturesProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    paddingHorizontal: 20,
  },
})

export function TripleSignatures({ data, theme }: CertSignaturesProps) {
  const sigs = data.signatures.slice(0, 3)
  if (sigs.length === 0) return null
  return (
    <View
      style={[
        styles.container,
        { flexDirection: theme.isRTL ? "row-reverse" : "row" },
      ]}
    >
      {sigs.map((sig, i) => (
        <SignatureLine
          key={i}
          name={sig.name}
          title={sig.title}
          signatureUrl={sig.signatureUrl}
          color={theme.colors.text}
          fontSize={theme.typography.smallSize}
        />
      ))}
    </View>
  )
}
