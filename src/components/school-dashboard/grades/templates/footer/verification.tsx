// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { QrCode } from "../atom"
import type { CertFooterProps } from "../types"

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    marginTop: "auto",
  },
  info: { flex: 1 },
  text: { marginBottom: 2 },
})

export function VerificationFooter({ data, theme }: CertFooterProps) {
  return (
    <View
      style={[
        styles.container,
        { flexDirection: theme.isRTL ? "row-reverse" : "row" },
      ]}
    >
      <View style={styles.info}>
        {data.certificateNumber && (
          <Text
            style={[
              styles.text,
              {
                fontSize: theme.typography.smallSize,
                color: theme.colors.textLight,
                fontFamily: theme.typography.fontFamily,
              },
            ]}
          >
            {theme.isRTL
              ? `رقم الشهادة: ${data.certificateNumber}`
              : `Certificate No: ${data.certificateNumber}`}
          </Text>
        )}
        <Text
          style={[
            styles.text,
            {
              fontSize: theme.typography.smallSize,
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {theme.isRTL
            ? `تاريخ الإصدار: ${data.issuedDate}`
            : `Date: ${data.issuedDate}`}
        </Text>
        {data.verificationCode && (
          <Text
            style={[
              styles.text,
              {
                fontSize: 7,
                color: theme.colors.textLight,
                fontFamily: theme.typography.fontFamily,
              },
            ]}
          >
            {theme.isRTL
              ? `رمز التحقق: ${data.verificationCode}`
              : `Verification: ${data.verificationCode}`}
          </Text>
        )}
      </View>
      {data.verificationCode && (
        <QrCode
          code={data.verificationCode}
          size={45}
          label={theme.isRTL ? "تحقق" : "Verify"}
        />
      )}
    </View>
  )
}
