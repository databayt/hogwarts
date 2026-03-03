// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertTitleProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  underline: { height: 2, marginTop: 6 },
})

export function ModernTitle({ data, theme }: CertTitleProps) {
  const title = theme.isRTL ? data.titleAr || data.title : data.title
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            fontSize: theme.typography.titleSize - 2,
            color: theme.colors.primary,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.underline,
          { width: 80, backgroundColor: theme.colors.accent },
        ]}
      />
    </View>
  )
}
