// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertFooterProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: "auto", paddingTop: 8 },
})

export function MinimalFooter({ data, theme }: CertFooterProps) {
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize: theme.typography.smallSize,
          color: theme.colors.textLight,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {data.issuedDate}
      </Text>
    </View>
  )
}
