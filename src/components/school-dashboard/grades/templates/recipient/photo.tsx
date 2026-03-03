// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { CertRecipientProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e5e7eb",
    marginRight: 16,
  },
  textBlock: { alignItems: "flex-start" },
  prefix: { marginBottom: 2 },
  name: { fontWeight: "bold" },
  id: { marginTop: 2 },
})

export function PhotoRecipient({ data, theme }: CertRecipientProps) {
  const name = theme.isRTL
    ? data.studentNameAr || data.studentName
    : data.studentName
  return (
    <View
      style={[
        styles.container,
        { flexDirection: theme.isRTL ? "row-reverse" : "row" },
      ]}
    >
      {data.photoUrl ? (
        <Image
          src={data.photoUrl}
          style={[
            styles.photo,
            theme.isRTL ? { marginLeft: 16, marginRight: 0 } : {},
          ]}
        />
      ) : (
        <View
          style={[
            styles.photoPlaceholder,
            theme.isRTL ? { marginLeft: 16, marginRight: 0 } : {},
          ]}
        />
      )}
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.prefix,
            {
              fontSize: theme.typography.bodySize,
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {theme.isRTL ? "يُمنح هذا إلى" : "This is awarded to"}
        </Text>
        <Text
          style={[
            styles.name,
            {
              fontSize: theme.typography.subtitleSize + 2,
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {name}
        </Text>
        {data.studentId && (
          <Text
            style={[
              styles.id,
              {
                fontSize: theme.typography.smallSize,
                color: theme.colors.textLight,
                fontFamily: theme.typography.fontFamily,
              },
            ]}
          >
            {theme.isRTL ? `الرقم: ${data.studentId}` : `ID: ${data.studentId}`}
          </Text>
        )}
      </View>
    </View>
  )
}
