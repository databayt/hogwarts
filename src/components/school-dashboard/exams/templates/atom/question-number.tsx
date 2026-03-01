// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { PaperTheme } from "../types"

interface QuestionNumberProps {
  number: number
  theme: PaperTheme
}

export function QuestionNumber({ number, theme }: QuestionNumberProps) {
  if (theme.numberStyle === "circle") {
    const styles = StyleSheet.create({
      circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.accentColor,
        alignItems: "center",
        justifyContent: "center",
      },
      text: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF",
        fontFamily: theme.fontFamily,
      },
    })
    return (
      <View style={styles.circle}>
        <Text style={styles.text}>{number}</Text>
      </View>
    )
  }

  if (theme.numberStyle === "square") {
    const styles = StyleSheet.create({
      square: {
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: theme.accentColor,
        alignItems: "center",
        justifyContent: "center",
      },
      text: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#FFFFFF",
        fontFamily: theme.fontFamily,
      },
    })
    return (
      <View style={styles.square}>
        <Text style={styles.text}>{number}</Text>
      </View>
    )
  }

  // plain
  const styles = StyleSheet.create({
    text: {
      fontSize: theme.fontSize.body,
      fontWeight: "bold",
      color: theme.primaryColor,
      width: 25,
      fontFamily: theme.fontFamily,
    },
  })
  return <Text style={styles.text}>{number}.</Text>
}
