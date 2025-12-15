"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"

interface AIFluencySectionProps {
  dictionary?: any
  lang: Locale
}

export function AIFluencySection({ dictionary, lang }: AIFluencySectionProps) {
  const isRTL = lang === "ar"

  const content = {
    badge: dictionary?.aiFluency?.badge || "New",
    title:
      dictionary?.aiFluency?.title ||
      "Scale AI fluency across your organization",
    description:
      dictionary?.aiFluency?.description ||
      "Our new AI Packages help employees at all levels understand, communicate about, and implement AI solutions with confidence and ethical awareness.",
    cta: dictionary?.aiFluency?.cta || "Contact us",
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "450px",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "64px",
        backgroundImage: "url('/ai-fluency-hero.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Card Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: isRTL ? undefined : "48px",
          paddingRight: isRTL ? "48px" : undefined,
          justifyContent: isRTL ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "40px",
            maxWidth: "420px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#C2E9EB",
              borderRadius: "6px",
              padding: "6px 12px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{ fontSize: "14px", fontWeight: 500, color: "#0D5261" }}
            >
              {content.badge}
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "16px",
              lineHeight: 1.2,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {content.title}
          </h2>

          {/* Description */}
          <p
            style={{
              color: "#6a6f73",
              fontSize: "16px",
              lineHeight: 1.5,
              marginBottom: "24px",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {content.description}
          </p>

          {/* CTA Button */}
          <div style={{ textAlign: isRTL ? "right" : "left" }}>
            <Link
              href={`/${lang}/contact`}
              className={buttonVariants({ size: "lg" })}
            >
              {content.cta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
