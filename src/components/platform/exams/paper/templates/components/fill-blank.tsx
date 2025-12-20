/**
 * Fill in the Blank Question Renderer
 * Displays question text with underlined blanks
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { QuestionForPaper } from "../../types"

interface FillBlankQuestionProps {
  question: QuestionForPaper
  showNumber: boolean
  showPoints: boolean
  showType: boolean
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    questionRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
    },
    questionNumber: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1F2937",
      width: 25,
      fontFamily,
    },
    questionContent: {
      flex: 1,
    },
    questionTextContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      flexWrap: "wrap",
      alignItems: "baseline",
    },
    textSegment: {
      fontSize: 11,
      color: "#1F2937",
      lineHeight: 1.8,
      textAlign: isRTL ? "right" : "left",
      fontFamily,
    },
    blankLine: {
      width: 80,
      borderBottomWidth: 1,
      borderBottomColor: "#374151",
      marginHorizontal: 5,
      height: 14,
    },
    metaRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginTop: 5,
      gap: 10,
    },
    metaText: {
      fontSize: 8,
      color: "#6B7280",
      fontFamily,
    },
  })
}

/**
 * Parse question text and replace blanks with underlines
 * Blanks are indicated by ___ or [blank] or {blank}
 */
function parseBlankText(
  text: string,
  styles: ReturnType<typeof createStyles>
): React.ReactNode[] {
  // Match various blank patterns
  const blankPattern = /(___|___+|\[blank\]|\{blank\})/gi
  const parts = text.split(blankPattern)

  return parts.map((part, index) => {
    if (blankPattern.test(part)) {
      return <View key={index} style={styles.blankLine} />
    }
    return (
      <Text key={index} style={styles.textSegment}>
        {part}
      </Text>
    )
  })
}

export function FillBlankQuestion({
  question,
  showNumber,
  showPoints,
  showType,
  locale,
  fontFamily,
}: FillBlankQuestionProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  // Check if question has blanks embedded, otherwise render with single blank
  const hasEmbeddedBlanks = /___|___+|\[blank\]|\{blank\}/i.test(
    question.questionText
  )

  return (
    <View style={styles.container}>
      <View style={styles.questionRow}>
        {showNumber && (
          <Text style={styles.questionNumber}>{question.order}.</Text>
        )}
        <View style={styles.questionContent}>
          {hasEmbeddedBlanks ? (
            <View style={styles.questionTextContainer}>
              {parseBlankText(question.questionText, styles)}
            </View>
          ) : (
            <>
              <Text style={styles.textSegment}>{question.questionText}</Text>
              <View style={[styles.blankLine, { marginTop: 8 }]} />
            </>
          )}

          {/* Meta info */}
          {(showPoints || showType) && (
            <View style={styles.metaRow}>
              {showPoints && (
                <Text style={styles.metaText}>
                  [{question.points} {isRTL ? "درجة" : "pts"}]
                </Text>
              )}
              {showType && (
                <Text style={styles.metaText}>
                  {isRTL ? "أكمل الفراغ" : "Fill in the Blank"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
