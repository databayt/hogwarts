// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text } from "@react-pdf/renderer"

import { QUESTION_TYPE_LABELS } from "../config"
import type { PaperTheme, QuestionType } from "../types"

interface TypeLabelProps {
  type: QuestionType
  theme: PaperTheme
}

export function TypeLabel({ type, theme }: TypeLabelProps) {
  const styles = StyleSheet.create({
    text: {
      fontSize: theme.fontSize.tiny,
      color: theme.secondaryColor,
      fontFamily: theme.fontFamily,
    },
  })

  const labels = QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS]
  const label = labels ? labels[theme.locale] : type

  return <Text style={styles.text}>{label}</Text>
}
