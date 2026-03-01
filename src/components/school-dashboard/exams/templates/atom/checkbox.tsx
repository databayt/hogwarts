// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface CheckboxProps {
  theme: PaperTheme
  size?: number
}

export function Checkbox({ theme, size = 14 }: CheckboxProps) {
  const styles = StyleSheet.create({
    checkbox: {
      width: size,
      height: size,
      borderWidth: 1.5,
      borderColor: theme.accentColor,
    },
  })

  return <View style={styles.checkbox} />
}
