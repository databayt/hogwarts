// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertRecipientProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  prefix: { textAlign: "center", marginBottom: 4 },
  nameWrapper: {
    borderBottomWidth: 2,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  name: { fontWeight: "bold", textAlign: "center" },
})

export function UnderlineRecipient({ data, theme }: CertRecipientProps) {
  const name = theme.isRTL
    ? data.studentNameAr || data.studentName
    : data.studentName
  const prefix = theme.isRTL ? "يُمنح هذا إلى" : "This is awarded to"
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.prefix,
          {
            fontSize: theme.typography.bodySize,
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily,
          },
        ]}
      >
        {prefix}
      </Text>
      <View
        style={[styles.nameWrapper, { borderBottomColor: theme.colors.gold }]}
      >
        <Text
          style={[
            styles.name,
            {
              fontSize: theme.typography.subtitleSize + 2,
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {name}
        </Text>
      </View>
    </View>
  )
}
