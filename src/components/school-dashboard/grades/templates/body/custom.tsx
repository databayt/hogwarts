// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertBodyProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 8, paddingHorizontal: 30 },
  text: { textAlign: "center", lineHeight: 1.6 },
})

export function CustomBody({ data, theme }: CertBodyProps) {
  const text = theme.isRTL
    ? data.bodyTextAr || data.bodyText || ""
    : data.bodyText || ""
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            fontSize: theme.typography.bodySize + 1,
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}
