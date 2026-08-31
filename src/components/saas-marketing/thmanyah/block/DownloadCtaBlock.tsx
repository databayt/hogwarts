"use client"

import React, { useRef, useState } from "react"
import { motion } from "framer-motion"

import { FRAMER_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"
import { downloadFontPackage } from "@/components/saas-marketing/thmanyah/micro/FontDownloadService"

/**
 * Footer CTA card — 1:1 mirror of font.thmanyah.com's .framer-jrpp8o: the
 * mint (#9fe5b1) 56px-radius card that fills the 76vh footer (flex 1 0 0),
 * two centred 52px lines (serif display Light / Black; 44px at 600–809,
 * 36px below 600) over the "تحميل الخط" pill.
 *
 * The pill is the reference's <button> component (.framer-OBtxy): 44px
 * tall, padding 20 36, black, its width set by an invisible sans Regular
 * copy of the label; the visible label (sans Medium 16/0.8em, white) and
 * the 17px download icon sit absolutely centred. Hover darkens it to
 * rgba(0,0,0,.85). A click switches it to the "Open 2" variant — 340px
 * wide, white, padding 0 — where the label fades and slides out, the icon
 * re-centres and the e-mail form the button always carries (absolute,
 * opacity 0, 340x44: a white 100px-radius input padded 10 46 10 16 with a
 * 36px "↑" submit disc at rgba(0,0,0,.1)) becomes visible. A 3000px "Close
 * trigger" behind the content closes it again. All of that DOM is the live
 * one, including the form nested inside the button.
 *
 * Submitting downloads the font package client-side (the live form posts
 * the e-mail to Framer's form backend, which we cannot mirror).
 *
 * Declarations live in globals.css under `.footer-*`.
 */

export function DownloadCtaBlock() {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const bg = open
    ? "rgb(255, 255, 255)"
    : hover
      ? "rgba(0, 0, 0, 0.85)"
      : "rgb(0, 0, 0)"
  const ink = open ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"

  return (
    <div className="footer-card">
      {/* .framer-5jxo0q */}
      <div className="footer-cta-text">
        <p dir="rtl" className="footer-cta-line footer-cta-line--light">
          كن أول من يستخــــدم
        </p>
        <p dir="rtl" className="footer-cta-line footer-cta-line--black">
          خـــط ثمانيـــة
        </p>
      </div>

      {/* .framer-5c66p5 > .framer-1y03iye-container */}
      <div className="footer-cta-row">
        <div className="footer-btn-wrap">
          <motion.button
            type="button"
            className="footer-btn"
            data-framer-name={open ? "Open 2" : hover ? "Hover" : "Default"}
            data-open={open || undefined}
            data-highlight="true"
            data-reset="button"
            layout
            transition={FRAMER_SPRING}
            animate={{ backgroundColor: bg }}
            initial={false}
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
            onClick={() => {
              if (!open) {
                setOpen(true)
                requestAnimationFrame(() => inputRef.current?.focus())
              }
            }}
          >
            {/* .framer-zplkui — icon + label, centred */}
            <div className="footer-btn-content">
              <svg
                className="footer-btn-icon"
                role="presentation"
                viewBox="0 0 24 24"
                style={
                  {
                    ["--1m6trwb" as string]: 0,
                    ["--21h8s6" as string]: ink,
                    ["--pgex8v" as string]: 2,
                  } as React.CSSProperties
                }
              >
                <path
                  d="M 1.5 0 L 15 0 C 15.828 0 16.5 0.672 16.5 1.5 L 16.5 16.5 L 16.5 16.5 L 0 16.5 L 0 16.5 L 0 1.5 C 0 0.672 0.672 0 1.5 0 Z"
                  fillOpacity="var(--1m6trwb, 0)"
                  fill="var(--21h8s6, rgb(0, 0, 0))"
                  transform="translate(3.75 3)"
                />
                <path
                  d="M 0 10.5 L 0 0"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="var(--pgex8v, 1.5)"
                  stroke="var(--21h8s6, rgb(0, 0, 0))"
                  transform="translate(12 3)"
                />
                <path
                  d="M 16.5 0 L 16.5 6 L 0 6 L 0 0"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="var(--pgex8v, 1.5)"
                  stroke="var(--21h8s6, rgb(0, 0, 0))"
                  transform="translate(3.75 13.5)"
                />
                <path
                  d="M 7.5 0 L 3.75 3.75 L 0 0"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="var(--pgex8v, 1.5)"
                  stroke="var(--21h8s6, rgb(0, 0, 0))"
                  transform="translate(8.25 9.75)"
                />
              </svg>
              <motion.div
                className="footer-btn-label-box"
                animate={{ opacity: open ? 0 : 1 }}
                initial={false}
                transition={FRAMER_SPRING}
              >
                <p
                  dir="rtl"
                  className="footer-btn-label"
                  style={{ color: ink }}
                >
                  تحميل الخط
                </p>
              </motion.div>
            </div>

            {/* .framer-rj90pg "Helper" — invisible sans Regular copy that sizes the pill */}
            <div
              className="footer-btn-helper"
              data-framer-name="Helper"
              aria-hidden
            >
              <p dir="rtl" className="footer-btn-helper-text">
                تحميل الخط
              </p>
            </div>

            {/* .framer-1ssg7vc-container — the e-mail form */}
            <motion.div
              className="footer-form-wrap"
              animate={{ opacity: open ? 1 : 0 }}
              initial={false}
              transition={FRAMER_SPRING}
              style={{ pointerEvents: open ? "auto" : "none" }}
            >
              <div className="footer-form-inner">
                <form
                  method="POST"
                  className="footer-form"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (busy || !email.includes("@")) return
                    setBusy(true)
                    try {
                      await downloadFontPackage({ email, agreedToTerms: true })
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <input
                    ref={inputRef}
                    type="email"
                    name="email"
                    className="footer-email"
                    placeholder="hala@thmanyah.com"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    tabIndex={open ? 0 : -1}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="footer-submit-wrap">
                    <input
                      type="submit"
                      className="footer-submit"
                      value="↑"
                      tabIndex={open ? 0 : -1}
                      aria-label="submit"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </form>
              </div>
            </motion.div>

            {/* .framer-1d07fe5 "Close trigger" */}
            <div
              className="footer-close-trigger"
              data-framer-name="Close trigger"
              onClick={(e) => {
                if (!open) return
                e.stopPropagation()
                setOpen(false)
              }}
            />

            {/* .framer-1j2wem4 "Helper" — the 340x44 box that widens the open pill */}
            <div
              className="footer-helper2"
              data-framer-name="Helper"
              aria-hidden
            />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
