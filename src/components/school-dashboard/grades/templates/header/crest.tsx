// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { CrestBlock } from "../atom"
import type { CertHeaderProps } from "../types"

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: 12 },
  schoolName: { fontWeight: "bold", marginTop: 8, textAlign: "center" },
})

export function CrestHeader({ data, theme, logoSize = 70 }: CertHeaderProps) {
  return (
    <View style={styles.container}>
      <CrestBlock logoUrl={data.schoolLogo} size={logoSize} />
      <Text
        style={[
          styles.schoolName,
          {
            fontSize: theme.typography.subtitleSize,
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
