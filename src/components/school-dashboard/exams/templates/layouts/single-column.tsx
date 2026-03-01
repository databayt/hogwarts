// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Single Column Layout — default flow
 * Questions render sequentially in one column
 */

import React from "react"
import { View } from "@react-pdf/renderer"

export interface SingleColumnLayoutProps {
  children: React.ReactNode
}

export function SingleColumnLayout({ children }: SingleColumnLayoutProps) {
  return <View>{children}</View>
}
