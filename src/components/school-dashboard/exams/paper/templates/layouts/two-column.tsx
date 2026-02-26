// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Two-Column Layout Wrapper
 * Renders questions in a side-by-side two-column grid
 * Long questions (essay) auto-expand to full width
 */

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import type { QuestionForPaper } from "../../types"

interface TwoColumnLayoutProps {
  children: React.ReactNode
  questions: QuestionForPaper[]
  locale: "en" | "ar"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  halfWidth: {
    width: "48%",
  },
  fullWidth: {
    width: "100%",
  },
})

// Question types that should always be full-width
const FULL_WIDTH_TYPES = new Set(["ESSAY", "MATCHING", "ORDERING"])

/**
 * Determines if a question should span full width based on type and content length
 */
function shouldBeFullWidth(question: QuestionForPaper): boolean {
  if (FULL_WIDTH_TYPES.has(question.questionType)) return true
  // Long short-answer questions also go full width
  if (
    question.questionType === "SHORT_ANSWER" &&
    question.questionText.length > 200
  )
    return true
  return false
}

/**
 * Wraps each child element in a half-width or full-width container
 * based on the corresponding question type
 */
export function TwoColumnLayout({
  children,
  questions,
  locale,
}: TwoColumnLayoutProps) {
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
