"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

import { FooterBlock } from "@/components/saas-marketing/thmanyah/block/FooterBlock"

export function LicensesEnTemplate() {
  return (
    <div
      className="flex min-h-screen flex-col justify-between bg-white font-sans text-neutral-900 selection:bg-[#9fe5b1] selection:text-black"
      dir="ltr"
    >
      {/* Top Header */}
      <header className="border-b border-neutral-100 px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            href="/licenses"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:border-black hover:text-black"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>النسخة العربية</span>
          </Link>
        </div>
      </header>

      {/* Main License Content */}
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-16 text-left sm:px-8">
        {/* Title */}
        <div className="space-y-4 border-b border-neutral-100 pb-8">
          <span className="font-mono text-xs font-bold tracking-widest text-[#00bc6d] uppercase">
            Legal & Terms
          </span>
          <h1 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl md:text-5xl">
            Thmanyah Font Software End User License Agreement
          </h1>
          <p className="font-mono text-sm text-neutral-500">
            Last Updated: 2026 • Thmanyah for Publishing and Distribution
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-10 text-base leading-relaxed text-neutral-800">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              1. Introduction and Acceptance of Terms
            </h2>
            <p>
              This End User License Agreement ("Agreement") governs the
              licensing and use of Thmanyah Font Software (including all digital
              files, glyphs, and font families) provided by Thmanyah for
              Publishing and Distribution ("Company"). By downloading,
              installing, copying, or otherwise using the Font Software, you
              agree to be bound by all terms and conditions herein.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              2. Grant of License and Permitted Uses
            </h2>
            <p>
              The Company grants you a free, non-exclusive, worldwide, revocable
              license to use the Font Software for the following purposes:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4 text-neutral-700">
              <li>
                <strong>Personal and Commercial Use:</strong> You may use the
                font in personal and commercial designs, printed materials,
                branding, packaging, video productions, and advertising.
              </li>
              <li>
                <strong>Web and Digital Applications:</strong> You may embed and
                host the font files (such as WOFF2) on websites, web
                applications, mobile applications, and digital platforms.
              </li>
              <li>
                <strong>Logos and Brand Identity:</strong> You may incorporate
                the font artwork into corporate identity systems and logos
                without paying royalties.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              3. Restrictions and Prohibitions
            </h2>
            <p>You may not, directly or indirectly:</p>
            <ul className="list-inside list-disc space-y-2 pl-4 text-neutral-700">
              <li>
                Sell, rent, sublicense, or distribute the Font Software as
                standalone font files for commercial profit.
              </li>
              <li>
                Modify the source code, rename the font family for
                redistribution, or reverse engineer the binary font structures.
              </li>
              <li>
                Use the Font Software in any unlawful context violating
                applicable laws in the Kingdom of Saudi Arabia.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              4. Intellectual Property Rights
            </h2>
            <p>
              All copyrights, trademarks, design patents, and proprietary
              intellectual property rights in and to the Font Software remain
              the sole and exclusive property of Thmanyah for Publishing and
              Distribution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              5. Disclaimer of Warranties
            </h2>
            <p className="text-sm text-neutral-600">
              THE FONT SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY
              KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR
              PURPOSE. IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY
              CONSEQUENTIAL OR INCIDENTAL DAMAGES.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-950">
              6. Governing Law and Language
            </h2>
            <p>
              This Agreement shall be governed by and construed in accordance
              with the laws of the Kingdom of Saudi Arabia. The competent courts
              in Riyadh, Saudi Arabia shall have exclusive jurisdiction. In the
              event of any discrepancy between this English translation and the
              original Arabic text, the Arabic version shall prevail.
            </p>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <FooterBlock />
    </div>
  )
}
