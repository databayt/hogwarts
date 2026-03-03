// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertTitleProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  title: { fontWeight: "bold", textAlign: "center" },
})

export function ClassicTitle({ data, theme }: CertTitleProps) {
  const title = theme.isRTL ? data.titleAr || data.title : data.title
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            fontSize: theme.typography.titleSize,
            color: theme.colors.primary,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  )
}
