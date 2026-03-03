// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { CrestBlock } from "../atom"
import type { CertHeaderProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  side: { alignItems: "center", width: 120 },
  center: { flex: 1, alignItems: "center" },
  name: { fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", marginTop: 2 },
})

export function MinistryHeader({
  data,
  theme,
  logoSize = 50,
  ministryName,
  ministryLogoUrl,
}: CertHeaderProps) {
  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.gold }]}>
      <View style={styles.side}>
        <CrestBlock logoUrl={data.schoolLogo} size={logoSize} />
        <Text
          style={[
            styles.name,
            {
              fontSize: 8,
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {theme.isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
        </Text>
      </View>
      <View style={styles.center}>
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
          {ministryName ||
            (theme.isRTL ? "وزارة التربية والتعليم" : "Ministry of Education")}
        </Text>
      </View>
      <View style={styles.side}>
        {ministryLogoUrl ? (
          <Image
            src={ministryLogoUrl}
            style={{ width: logoSize, height: logoSize, objectFit: "contain" }}
          />
        ) : (
          <View style={{ width: logoSize, height: logoSize }} />
        )}
      </View>
    </View>
  )
}
