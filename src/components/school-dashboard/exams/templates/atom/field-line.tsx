// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface FieldLineProps {
  label: string
  theme: PaperTheme
  width?: string
}

export function FieldLine({ label, theme, width = "100%" }: FieldLineProps) {
  const styles = StyleSheet.create({
    container: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      alignItems: "flex-end",
      width: width as never,
      marginBottom: 8,
    },
    label: {
      fontSize: theme.fontSize.small,
      color: theme.primaryColor,
      fontWeight: "bold",
      fontFamily: theme.fontFamily,
      marginRight: theme.isRTL ? 0 : 6,
      marginLeft: theme.isRTL ? 6 : 0,
    },
    line: {
      flex: 1,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.secondaryColor,
      borderBottomStyle: "dotted" as never,
      height: 14,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.line} />
    </View>
  )
}
