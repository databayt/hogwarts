// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ComposableCertificate — single entry point for certificate PDF generation.
 * Dynamically assembles variant components from the CERT_VARIANT_REGISTRY
 * based on a CertificateCompositionConfig.
 */

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { Locale } from "@/components/internationalization/config"

// Reuse font registration from exam templates
import { ensureFontsRegistered } from "../../exams/templates/fonts"
import { CornerOrnament, GoldBorder, Ribbon, Seal } from "./atom"
import { CERT_VARIANT_REGISTRY } from "./composition/registry"
import { resolveCertComposition } from "./composition/resolve"
import type { CertificateCompositionConfig } from "./composition/types"
import { getCertThemePreset, withCertLocale } from "./config"
import type { CertificateForPaper } from "./types"

interface ComposableCertificateProps {
  data: CertificateForPaper
  style?: string // "elegant" | "modern" | "classic"
  locale?: Locale
  orientation?: "landscape" | "portrait"
  pageSize?: "A4" | "LETTER"
  blockConfig?: Partial<CertificateCompositionConfig>
  regionPreset?: string | null
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    position: "relative",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "15%",
    transform: "rotate(-30deg)",
  },
  watermarkText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#e5e7eb",
  },
})

export function ComposableCertificate({
  data,
  style = "elegant",
  locale = "ar",
  orientation = "landscape",
  pageSize = "A4",
  blockConfig,
  regionPreset,
}: ComposableCertificateProps) {
  // 1. Register fonts
  ensureFontsRegistered()

  // 2. Resolve composition
  const composition = resolveCertComposition(blockConfig, regionPreset)

  // 3. Build theme
  const baseTheme = getCertThemePreset(style)
  const theme = withCertLocale(baseTheme, locale)

  // 4. Look up variant components
  const HeaderComponent =
    CERT_VARIANT_REGISTRY.header[composition.slots.header]?.component
  const TitleComponent =
    CERT_VARIANT_REGISTRY.title[composition.slots.title]?.component
  const RecipientComponent =
    CERT_VARIANT_REGISTRY.recipient[composition.slots.recipient]?.component
  const BodyComponent =
    CERT_VARIANT_REGISTRY.body[composition.slots.body]?.component
  const ScoresComponent =
    CERT_VARIANT_REGISTRY.scores[composition.slots.scores]?.component
  const SignaturesComponent =
    CERT_VARIANT_REGISTRY.signatures[composition.slots.signatures]?.component
  const FooterComponent =
    CERT_VARIANT_REGISTRY.footer[composition.slots.footer]?.component

  // 5. Build decoration elements
  const { decorations } = composition
  const useBorder = decorations.border.enabled
  const borderColor =
    decorations.border.style === "gold"
      ? "#C9A962"
      : decorations.border.style === "silver"
        ? "#A8A8A8"
        : decorations.border.style === "blue"
          ? "#2563eb"
          : theme.colors.border

  // Page dimensions for corner ornaments
  const isLandscape = orientation === "landscape"
  const pageWidth = isLandscape ? 842 : 595
  const pageHeight = isLandscape ? 595 : 842

  // Assemble header props with slotProps
  const headerProps = {
    data,
    theme,
    ...composition.slotProps.header,
  }

  const bodyProps = {
    data,
    theme,
    ...composition.slotProps.body,
  }

  const contentElement = (
    <View style={styles.content}>
      {/* Watermark */}
      {decorations.watermark.enabled && (
        <View style={styles.watermark}>
          <Text
            style={[
              styles.watermarkText,
              {
                opacity: decorations.watermark.opacity ?? 0.08,
                fontFamily: theme.typography.fontFamily,
              },
            ]}
          >
            {decorations.watermark.text || data.schoolName}
          </Text>
        </View>
      )}

      {/* Corner ornaments */}
      {decorations.cornerOrnaments.enabled && (
        <>
          <CornerOrnament
            position="tl"
            color={borderColor}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
          <CornerOrnament
            position="tr"
            color={borderColor}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
          <CornerOrnament
            position="bl"
            color={borderColor}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
          <CornerOrnament
            position="br"
            color={borderColor}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
        </>
      )}

      {/* Seal */}
      {decorations.seal.enabled && (
        <Seal
          logoUrl={data.schoolLogo}
          position={decorations.seal.position}
          opacity={0.12}
        />
      )}

      {/* Ribbon */}
      {decorations.ribbon.enabled && (
        <Ribbon text={decorations.ribbon.text} color={theme.colors.gold} />
      )}

      {/* Slot components */}
      {HeaderComponent && <HeaderComponent {...headerProps} />}
      {TitleComponent && <TitleComponent data={data} theme={theme} />}
      {RecipientComponent && <RecipientComponent data={data} theme={theme} />}
      {BodyComponent && <BodyComponent {...bodyProps} />}
      {ScoresComponent && <ScoresComponent data={data} theme={theme} />}
      {SignaturesComponent && <SignaturesComponent data={data} theme={theme} />}
      {FooterComponent && <FooterComponent data={data} theme={theme} />}
    </View>
  )

  return (
    <Document>
      <Page
        size={pageSize}
        orientation={orientation}
        style={[styles.page, { backgroundColor: theme.colors.background }]}
      >
        {useBorder ? (
          <GoldBorder color={borderColor} width={decorations.border.width ?? 2}>
            {contentElement}
          </GoldBorder>
        ) : (
          <View style={{ flex: 1, padding: theme.spacing.page }}>
            {contentElement}
          </View>
        )}
      </Page>
    </Document>
  )
}
