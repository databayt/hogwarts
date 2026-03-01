// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text } from "@react-pdf/renderer"

import { POINTS_LABEL } from "../config"
import type { PaperTheme } from "../types"

interface PointsBadgeProps {
  points: number
  theme: PaperTheme
}

export function PointsBadge({ points, theme }: PointsBadgeProps) {
  const styles = StyleSheet.create({
    text: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  const label = POINTS_LABEL[theme.locale]
  return (
    <Text style={styles.text}>
      [{points} {label}]
    </Text>
  )
}
