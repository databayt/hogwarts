// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

/** OMR corner alignment marker (black square) */
export function AlignmentMarker({
  size = 10,
  theme,
  position,
}: {
  size?: number
  theme?: PaperTheme
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}) {
  const offset = -15
  const posStyle =
    position === "top-left"
      ? { top: offset, left: offset }
      : position === "top-right"
        ? { top: offset, right: offset }
        : position === "bottom-left"
          ? { bottom: offset, left: offset }
          : position === "bottom-right"
            ? { bottom: offset, right: offset }
            : {}

  const styles = StyleSheet.create({
    marker: {
      width: size,
      height: size,
      backgroundColor: theme?.primaryColor || "#000000",
      position: position ? "absolute" : ("relative" as never),
      ...posStyle,
    },
  })

  return <View style={styles.marker} />
}

/** OMR edge timing mark (thin rectangle) */
export function TimingMark({
  width = 6,
  height = 2,
  theme,
  top,
}: {
  width?: number
  height?: number
  theme?: PaperTheme
  top?: number
}) {
  const styles = StyleSheet.create({
    mark: {
      width,
      height,
      backgroundColor: theme?.primaryColor || "#000000",
      position: top != null ? "absolute" : ("relative" as never),
      left: top != null ? -20 : undefined,
      top: top ?? undefined,
    },
  })

  return <View style={styles.mark} />
}
