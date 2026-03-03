// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertFooterProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
  },
})

export function NumberedFooter({ data, theme }: CertFooterProps) {
  return (
    <View
      style={[
        styles.container,
        { flexDirection: theme.isRTL ? "row-reverse" : "row" },
      ]}
    >
      <Text
        style={{
          fontSize: theme.typography.smallSize,
          color: theme.colors.textLight,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {data.issuedDate}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.smallSize,
          fontWeight: "bold",
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {data.certificateNumber || ""}
      </Text>
    </View>
  )
}
