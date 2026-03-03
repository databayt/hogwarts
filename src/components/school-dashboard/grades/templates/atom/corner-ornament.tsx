// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Circle, Path, Svg, View } from "@react-pdf/renderer"

interface CornerOrnamentProps {
  position: "tl" | "tr" | "bl" | "br"
  color?: string
  size?: number
  pageWidth?: number
  pageHeight?: number
}

export function CornerOrnament({
  position,
  color = "#C9A962",
  size = 60,
  pageWidth = 842,
  pageHeight = 595,
}: CornerOrnamentProps) {
  const rotation =
    position === "tl"
      ? 0
      : position === "tr"
        ? 90
        : position === "bl"
          ? 270
          : 180
  const x = position === "tl" || position === "bl" ? 20 : pageWidth - 20 - size
  const y = position === "tl" || position === "tr" ? 20 : pageHeight - 20 - size

  return (
    <View style={{ position: "absolute", left: x, top: y }}>
      <Svg width={size} height={size}>
        <Path
          d="M 0 50 Q 0 0 50 0"
          stroke={color}
          strokeWidth="2"
          fill="none"
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        />
        <Circle cx="10" cy="10" r="3" fill={color} />
      </Svg>
    </View>
  )
}
