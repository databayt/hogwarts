// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { DecorativeLine } from "../atom"
import type { CertTitleProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 8 },
  title: { fontWeight: "bold", textAlign: "center", letterSpacing: 2 },
})

export function ElegantTitle({ data, theme }: CertTitleProps) {
  const title = theme.isRTL ? data.titleAr || data.title : data.title
  return (
    <View style={styles.container}>
      <DecorativeLine color={theme.colors.gold} width="40%" />
      <Text
        style={[
          styles.title,
          {
            fontSize: theme.typography.titleSize,
            color: theme.colors.gold,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {title}
      </Text>
      <DecorativeLine color={theme.colors.gold} width="40%" />
    </View>
  )
}
