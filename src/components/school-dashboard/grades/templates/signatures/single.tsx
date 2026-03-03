// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import { SignatureLine } from "../atom"
import type { CertSignaturesProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 16 },
})

export function SingleSignature({ data, theme }: CertSignaturesProps) {
  const sig = data.signatures[0]
  if (!sig) return null
  return (
    <View style={styles.container}>
      <SignatureLine
        name={sig.name}
        title={sig.title}
        signatureUrl={sig.signatureUrl}
        color={theme.colors.text}
        fontSize={theme.typography.smallSize}
      />
    </View>
  )
}
