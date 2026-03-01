// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface BlankSlotProps {
  theme: PaperTheme
  width?: number
}

export function BlankSlot({ theme, width = 80 }: BlankSlotProps) {
  const styles = StyleSheet.create({
    blank: {
      width,
      borderBottomWidth: 1,
      borderBottomColor: theme.accentColor,
      marginHorizontal: 4,
      height: 16,
    },
  })

  return <View style={styles.blank} />
}
