// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { CrestBlock } from "../atom"
import type { CertHeaderProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  side: { width: "35%", alignItems: "center" },
  center: { width: "30%", alignItems: "center" },
  name: { fontWeight: "bold", textAlign: "center" },
})

export function BilingualHeader({
  data,
  theme,
  logoSize = 60,
}: CertHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <Text
          style={[
            styles.name,
            { fontSize: 11, color: theme.colors.primary, fontFamily: "Rubik" },
          ]}
        >
          {data.schoolNameAr || data.schoolName}
        </Text>
      </View>
      <View style={styles.center}>
        <CrestBlock logoUrl={data.schoolLogo} size={logoSize} />
      </View>
      <View style={styles.side}>
        <Text
          style={[
            styles.name,
            { fontSize: 11, color: theme.colors.primary, fontFamily: "Inter" },
          ]}
        >
          {data.schoolName}
        </Text>
      </View>
    </View>
  )
}
