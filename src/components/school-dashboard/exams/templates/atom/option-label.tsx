// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface OptionLabelProps {
  label: string
  theme: PaperTheme
}

export function OptionLabel({ label, theme }: OptionLabelProps) {
  const styles = StyleSheet.create({
    text: {
      flex: 1,
      fontSize: 10,
      color: theme.accentColor,
      lineHeight: 1.4,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
  })

  return <Text style={styles.text}>{label}</Text>
}
