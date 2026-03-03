// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { CrestBlock, SignatureLine } from "../atom"
import type { CertSignaturesProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginVertical: 16,
    paddingHorizontal: 30,
  },
  stampSection: { alignItems: "center" },
  stampLabel: { marginTop: 4, textAlign: "center" },
})

export function StampsSignatures({ data, theme }: CertSignaturesProps) {
  const sigs = data.signatures.slice(0, 2)
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
      <View style={styles.stampSection}>
        <CrestBlock logoUrl={data.schoolLogo} size={40} />
        <Text
          style={[
            styles.stampLabel,
            {
              fontSize: 7,
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {theme.isRTL ? "ختم المدرسة" : "School Seal"}
        </Text>
      </View>
    </View>
  )
}
