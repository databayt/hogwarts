// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertHeaderProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 10 },
  name: { fontWeight: "bold", textAlign: "center" },
})

export function MinimalHeader({ data, theme }: CertHeaderProps) {
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.name,
          {
            fontSize: theme.typography.subtitleSize - 2,
            color: theme.colors.primary,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {theme.isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
      </Text>
    </View>
  )
}
