// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { DecorativeLine } from "../atom"
import type { CertTitleProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  title: { fontWeight: "bold", textAlign: "center", fontFamily: "Rubik" },
  subtitle: { textAlign: "center", marginTop: 4 },
})

export function ArabicCalligraphyTitle({ data, theme }: CertTitleProps) {
  return (
    <View style={styles.container}>
      <DecorativeLine color={theme.colors.gold} width="30%" thickness={2} />
      <Text
        style={[
          styles.title,
          {
            fontSize: theme.typography.titleSize + 2,
            color: theme.colors.gold,
          },
        ]}
      >
        {data.titleAr || data.title}
      </Text>
      {data.titleAr && data.title && data.titleAr !== data.title && (
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: theme.typography.bodySize,
              color: theme.colors.textLight,
              fontFamily: "Inter",
            },
          ]}
        >
          {data.title}
        </Text>
      )}
      <DecorativeLine color={theme.colors.gold} width="30%" thickness={2} />
    </View>
  )
}
