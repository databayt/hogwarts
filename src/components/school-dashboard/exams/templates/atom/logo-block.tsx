// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface LogoBlockProps {
  src: string
  theme: PaperTheme
  size?: number
  placement?: "start" | "center" | "end"
}

export function LogoBlock({
  src,
  theme,
  size = 60,
  placement = "start",
}: LogoBlockProps) {
  const alignMap = {
    start: theme.isRTL ? "flex-end" : "flex-start",
    center: "center",
    end: theme.isRTL ? "flex-start" : "flex-end",
  } as const

  const styles = StyleSheet.create({
    container: {
      alignItems: alignMap[placement] as never,
    },
    image: {
      width: size,
      height: size,
      objectFit: "contain" as never,
    },
  })

  return (
    <View style={styles.container}>
      <Image src={src} style={styles.image} />
    </View>
  )
}
