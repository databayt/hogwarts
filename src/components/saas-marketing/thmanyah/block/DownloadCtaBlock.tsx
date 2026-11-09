"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

import { useThmanyahLocale } from "@/components/saas-marketing/thmanyah/lib/copy"
import { FRAMER_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * Footer CTA card — 1:1 mirror of font.thmanyah.com's .framer-jrpp8o: the
 * mint (#9fe5b1) 56px-radius card that fills the 76vh footer (flex 1 0 0),
 * two centred 52px lines (serif display Light / Black; 44px at 600–809,
 * 36px below 600) over the "ابدأ الآن معنا" pill.
 *
 * The pill is the reference's <button> component (.framer-OBtxy): 44px
 * tall, padding 20 36, black, its width set by an invisible sans Regular
 * copy of the label; the visible label (sans Medium 16/0.8em, white) and
 * the 17px icon sit absolutely centred. Hover darkens it to
 * rgba(0,0,0,.85).
 *
 * Content and destination are ours, geometry is the reference's. The
 * reference's pill downloaded a font package: clicking it switched the
 * button to an "Open 2" variant — 340px wide, white — where the label slid
 * out and an e-mail form nested *inside* the button faded in, with a
 * 3000px "Close trigger" behind the content to dismiss it. We carried that
 * whole mechanic and pointed the form at `joinWaitlist`, so the site's last
 * CTA collected an address and upserted a `Prospect`.
 *
 * It now goes to `/{lang}/onboarding` instead — the wizard that actually
 * provisions a school, which is the conversion this page is asking for; a
 * waitlist was a stand-in for a product that could not yet be signed up
 * for. A click cannot both navigate and expand, so the open variant, the
 * form, the close trigger and the 340px width helper are gone with it, and
 * `joinWaitlist` (still exported from saas-marketing/actions) now has no
 * caller. What stays is everything that sets the pill's geometry: the
 * absolutely-centred icon + label, the invisible sans Regular helper that
 * sizes it, and the hover darken.
 *
 * `lang` comes from the route. It was already threaded here when the rest
 * of the shell was pinned Arabic, because onboarding is our own product with
 * a real English wizard and dropping `[lang]` on the way in is what silently
 * flipped Arabic users to English once before; now the whole page follows it.
 *
 * The ARABIC copy is width-matched to the reference at its own sizes: line 1
 * "من السهل أن تبـدأ مع" 394.2px vs "كن أول من يستخــــدم" 394.0 (52px
 * Light) — one tatweel, the same device the reference's own line uses;
 * line 2 "منصـة بالقلم" 260.1px vs
 * "خـــط ثمانيـــة" 257.9 (52px Black), "ابدأ الآن معنا" 80.6 vs "تحميل الخط"
 * 79.1 (16px sans) — one tatweel in منصـة does the headline fitting; the
 * label needs none, matching the reference's own untatweeled label. The
 * pill's width comes from the invisible helper copy of this string, so a
 * label that measures differently resizes the pill: "ابدأ الآن" alone is
 * 49.2px and would visibly shrink it.
 *
 * Declarations live in globals.css under `.footer-*`.
 */

const MotionLink = motion.create(Link)

export function DownloadCtaBlock({ lang }: { lang: string }) {
  const { copy } = useThmanyahLocale()
  /* The pill's width comes from the invisible helper copy of this string —
     both the visible label and the helper must read it, or the two disagree
     and the text overflows its own button. */
  const label = copy.footer.ctaLabel
  const [hover, setHover] = useState(false)

  const bg = hover ? "rgba(0, 0, 0, 0.85)" : "rgb(0, 0, 0)"
  const ink = "rgb(255, 255, 255)"

  return (
    <div className="footer-card">
      {/* .framer-5jxo0q */}
      <div className="footer-cta-text">
        <p className="footer-cta-line footer-cta-line--light">
          {copy.footer.ctaLine1}
        </p>
        <p className="footer-cta-line footer-cta-line--black">
          {copy.footer.ctaLine2}
        </p>
      </div>

      {/* .framer-5c66p5 > .framer-1y03iye-container */}
      <div className="footer-cta-row">
        <div className="footer-btn-wrap">
          <MotionLink
            href={`/${lang}/onboarding`}
            className="footer-btn"
            data-framer-name={hover ? "Hover" : "Default"}
            data-highlight="true"
            data-reset="button"
            transition={FRAMER_SPRING}
            animate={{ backgroundColor: bg }}
            initial={false}
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
          >
            {/* .framer-zplkui — the label, centred (no icon) */}
            <div className="footer-btn-content">
              <div className="footer-btn-label-box">
                <p className="footer-btn-label" style={{ color: ink }}>
                  {label}
                </p>
              </div>
            </div>

            {/* .framer-rj90pg "Helper" — invisible sans Regular copy that sizes the pill */}
            <div
              className="footer-btn-helper"
              data-framer-name="Helper"
              aria-hidden
            >
              <p className="footer-btn-helper-text">{label}</p>
            </div>
          </MotionLink>
        </div>
      </div>
    </div>
  )
}
