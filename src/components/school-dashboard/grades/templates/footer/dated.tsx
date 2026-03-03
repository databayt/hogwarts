// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { DecorativeLine } from "../atom"
import type { CertFooterProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: "auto", paddingTop: 8 },
  date: { fontWeight: "bold", marginTop: 4 },
})

export function DatedFooter({ data, theme }: CertFooterProps) {
  return (
    <View style={styles.container}>
      <DecorativeLine color={theme.colors.gold} width="30%" />
      <Text
        style={[
          styles.date,
          {
            fontSize: theme.typography.bodySize,
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {data.issuedDate}
      </Text>
    </View>
  )
}
