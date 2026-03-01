// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Two Column Layout — side-by-side questions, RTL-aware
 * Essay/Matching/Ordering questions auto-expand to full width
 */

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { PaperTheme, QuestionForPaper } from "../types"

export interface TwoColumnLayoutProps {
  children: React.ReactNode
  questions: QuestionForPaper[]
  theme: PaperTheme
}

const FULL_WIDTH_TYPES = new Set(["ESSAY", "MATCHING", "ORDERING"])

function shouldBeFullWidth(question: QuestionForPaper): boolean {
  if (FULL_WIDTH_TYPES.has(question.questionType)) return true
  if (
    question.questionType === "SHORT_ANSWER" &&
    question.questionText.length > 200
  )
    return true
  return false
}

export function TwoColumnLayout({
  children,
  questions,
  theme,
}: TwoColumnLayoutProps) {
  const styles = StyleSheet.create({
    container: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      flexWrap: "wrap",
      gap: 10,
    },
    halfWidth: { width: "48%" },
    fullWidth: { width: "100%" },
  })

  const childArray = React.Children.toArray(children)

  return (
    <View style={styles.container}>
      {childArray.map((child, idx) => {
        const question = questions[idx]
        const isFullWidth = question ? shouldBeFullWidth(question) : false

        return (
          <View
            key={idx}
            style={isFullWidth ? styles.fullWidth : styles.halfWidth}
            wrap={false}
          >
            {child}
          </View>
        )
      })}
    </View>
  )
}
