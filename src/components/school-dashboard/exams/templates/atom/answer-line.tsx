// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface AnswerLineProps {
  theme: PaperTheme
  height?: number
}

export function AnswerLine({ theme, height = 20 }: AnswerLineProps) {
  const styles = StyleSheet.create({
    line: {
      height,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.mutedColor,
    },
  })

  return <View style={styles.line} />
}
