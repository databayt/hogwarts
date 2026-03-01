// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Standard Student Info — name/ID/class/date field lines
 * Configurable field toggles, uses FieldLine atom
 */

import React from "react"
import { StyleSheet, View } from "@react-pdf/renderer"

import { FieldLine } from "../atom"
import type { StudentInfoSectionProps } from "../types"

export function StandardStudentInfo({
  theme,
  showName = true,
  showId = true,
  showClass = true,
  showDate = true,
  showSeatNumber = false,
}: StudentInfoSectionProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.mutedColor,
      borderRadius: 4,
      padding: 12,
      backgroundColor: theme.backgroundColor,
    },
    row: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 10,
    },
    lastRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 0,
    },
    field: {
      flex: 1,
      marginRight: theme.isRTL ? 0 : 20,
      marginLeft: theme.isRTL ? 20 : 0,
    },
    fieldSmall: {
      flex: 0.5,
      marginRight: theme.isRTL ? 0 : 20,
      marginLeft: theme.isRTL ? 20 : 0,
    },
  })

  const labels = {
    name: theme.isRTL ? "الاسم:" : "Name:",
    id: theme.isRTL ? "رقم الطالب:" : "Student ID:",
    class: theme.isRTL ? "الفصل:" : "Class:",
    date: theme.isRTL ? "التاريخ:" : "Date:",
    seat: theme.isRTL ? "رقم المقعد:" : "Seat No:",
  }

  type FieldEntry = { label: string; style: (typeof styles)["field"] }

  const row1Fields = [
    showName && { label: labels.name, style: styles.field },
    showId && { label: labels.id, style: styles.field },
  ].filter(Boolean) as FieldEntry[]

  const row2Fields = [
    showClass && { label: labels.class, style: styles.field },
    showDate && { label: labels.date, style: styles.fieldSmall },
    showSeatNumber && { label: labels.seat, style: styles.fieldSmall },
  ].filter(Boolean) as FieldEntry[]

  return (
    <View style={styles.container}>
      {row1Fields.length > 0 && (
        <View style={styles.row}>
          {row1Fields.map((f) => (
            <View key={f.label} style={f.style}>
              <FieldLine label={f.label} theme={theme} />
            </View>
          ))}
        </View>
      )}
      {row2Fields.length > 0 && (
        <View style={styles.lastRow}>
          {row2Fields.map((f) => (
            <View key={f.label} style={f.style}>
              <FieldLine label={f.label} theme={theme} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
