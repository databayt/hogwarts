"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"

import {
  BADGE,
  FAMILIES,
  FRAMER_SPRING,
  reveal,
  SPECIMEN_AR,
  SPECIMEN_EN,
  WEIGHTS,
  type Family,
} from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * #8-fonts — 1:1 mirror of font.thmanyah.com's families block
 * (.framer-1h7i90q). The reference renders two different components and
 * shows one per breakpoint; both are reproduced here and CSS picks:
 *
 *   ≥1200  .framer-Y4Kcd "Variant 1": a row of a 400px card column (the
 *          three family cards, active one #00bc6d with its description,
 *          the others #afe3b6) and a flex:1 column of five weight frames.
 *          Every weight frame holds a 64px clip box containing all three
 *          families' specimen rows; the active family is chosen with the
 *          clip's justify-content (flex-start / center / flex-end) and the
 *          rows glide there with Framer's default spring.
 *   <1200  .framer-wBo0j accordion: three rows separated by 1px #808080
 *          lines; the open row (opacity 1) shows its header + its own five
 *          weight frames, closed rows (opacity 0.5) show the header only.
 *          Opening a row closes the other, height / opacity / the 180°
 *          chevron all spring.
 *
 * Declarations live in globals.css under `.fonts-*`.
 */

const CHEVRON_SVG =
  'url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 24 24%22><path d=%22M 5.143 9.429 L 12 16.286 L 18.857 9.429%22 fill=%22transparent%22 stroke-width=%222%22 stroke=%22rgb(0, 0, 0)%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22></path></svg>")'

const JUSTIFY: Record<number, string> = {
  0: "flex-start",
  1: "center",
  2: "flex-end",
}

/* One weight frame: label + a clip box of specimen rows (one row per
   family passed in). `gapIndex` mirrors the reference's alternating 8/10px
   row gaps (frames 1 & 3 use 8, the rest 10). */
function WeightFrame({
  weight,
  families,
  justify,
  clipClass,
  gap,
}: {
  weight: (typeof WEIGHTS)[number]
  families: Family[]
  justify: string
  clipClass: string
  gap: number
}) {
  return (
    <div className="fonts-weight" data-framer-name={weight.label}>
      <div className="fonts-weight-label-box">
        <p
          dir="rtl"
          className="fonts-weight-label"
          style={{ fontWeight: weight.value }}
        >
          {weight.label}
        </p>
      </div>
      <motion.div
        className={clipClass}
        style={{ justifyContent: justify, gap }}
        {...reveal(clipClass === "fonts-clip" ? 60 : 30, 0)}
      >
        {families.map((f, i) => (
          <motion.div
            key={f.id}
            layout="position"
            className="fonts-row"
            data-framer-name={String(i + 1)}
            initial={{ opacity: 0.001, transformPerspective: 1200 }}
            animate={{ opacity: 1, transformPerspective: 1200 }}
            transition={FRAMER_SPRING}
          >
            <div className="fonts-line">
              <p
                dir="rtl"
                className="fonts-specimen"
                style={{
                  fontFamily: `"${f.css}", ${f.id === "sans" ? "sans-serif" : "serif"}`,
                  fontWeight: weight.value,
                }}
              >
                {SPECIMEN_AR}
              </p>
            </div>
            <div className="fonts-line">
              <p
                dir="ltr"
                className="fonts-specimen"
                style={{
                  fontFamily: `"${f.css}", ${f.id === "sans" ? "sans-serif" : "serif"}`,
                  fontWeight: weight.value,
                }}
              >
                {SPECIMEN_EN}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

const CARD_BG_ACTIVE = "rgb(0, 188, 109)"
const CARD_BG_IDLE = "rgb(175, 227, 182)"

export function FontFamiliesBlock() {
  const [active, setActive] = useState(0)

  return (
    <div id="8-fonts" className="fonts-section">
      {/* ── ≥1200: .framer-bdpu23-container > .framer-Y4Kcd "Variant 1" ── */}
      <motion.div className="fonts-desktop" {...reveal(60, 0.5)}>
        <div className="fonts-comp" data-framer-name="Variant 1">
          {/* Text (.framer-1pbjgc8) — the family cards */}
          <div className="fonts-cards" data-framer-name="Text">
            {FAMILIES.map((f, i) => {
              const isActive = i === active
              const serif = f.id !== "sans"
              return (
                <motion.div
                  key={f.id}
                  layout
                  transition={FRAMER_SPRING}
                  animate={{
                    backgroundColor: isActive ? CARD_BG_ACTIVE : CARD_BG_IDLE,
                  }}
                  initial={false}
                  className="fonts-card"
                  data-framer-name="Display"
                  data-highlight="true"
                  tabIndex={0}
                  role="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setActive(i)
                    }
                  }}
                >
                  <div className="fonts-card-head">
                    <div className="fonts-card-row">
                      <div className="fonts-card-title-box">
                        <p
                          dir="rtl"
                          className="fonts-card-title"
                          style={{
                            fontFamily: `"${f.css}", ${serif ? "serif" : "sans-serif"}`,
                            fontFeatureSettings: f.titleSs01
                              ? '"ss01" on'
                              : "normal",
                          }}
                        >
                          {f.title}
                        </p>
                      </div>
                      <div className="fonts-card-badge-box">
                        <p dir="rtl" className="fonts-card-badge">
                          {BADGE}
                        </p>
                      </div>
                    </div>
                    <div className="fonts-card-latin-box">
                      <p
                        dir="ltr"
                        className="fonts-card-latin"
                        style={{
                          fontFamily: `"${f.css}", ${serif ? "serif" : "sans-serif"}`,
                        }}
                      >
                        {f.latin}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="fonts-card-desc-box">
                      <p dir="rtl" className="fonts-card-desc">
                        {f.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Frame 129 (.framer-ihgfcl) — the five weight frames */}
          <div className="fonts-frames" data-framer-name="Frame 129">
            {WEIGHTS.map((w, i) => (
              <React.Fragment key={w.value}>
                {i > 0 && <div className="fonts-sep" aria-hidden />}
                <WeightFrame
                  weight={w}
                  families={FAMILIES}
                  justify={JUSTIFY[active]}
                  clipClass="fonts-clip"
                  gap={i === 0 || i === 2 ? 8 : 10}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── <1200: .framer-1j7m727-container > .framer-wBo0j accordion ── */}
      <div className="fonts-accordion">
        <div className="fonts-acc-comp">
          <div className="fonts-acc-text" data-framer-name="Text">
            {FAMILIES.map((f, i) => {
              const open = i === active
              const serif = f.id !== "sans"
              const fam = `"${f.css}", ${serif ? "serif" : "sans-serif"}`
              return (
                <React.Fragment key={f.id}>
                  {i > 0 && <div className="fonts-acc-sep" aria-hidden />}
                  <motion.div
                    layout
                    transition={FRAMER_SPRING}
                    animate={{ opacity: open ? 1 : 0.5 }}
                    initial={false}
                    className="fonts-acc-item"
                  >
                    <div
                      className="fonts-acc-row"
                      data-framer-name={`${f.id === "display" ? "Serif" : f.id === "text" ? "Text" : "Sans"} - ${open ? "Open" : "Closed"}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => setActive(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setActive(i)
                        }
                      }}
                    >
                      <div className="fonts-acc-head">
                        <div className="fonts-acc-headrow">
                          <div className="fonts-acc-titles">
                            <div className="fonts-acc-titlerow">
                              <div className="fonts-acc-title-box">
                                <p
                                  dir="rtl"
                                  className="fonts-acc-title"
                                  style={{
                                    fontFamily: fam,
                                    fontFeatureSettings: f.titleSs01
                                      ? '"ss01" on'
                                      : "normal",
                                  }}
                                >
                                  {f.title}
                                </p>
                              </div>
                              <div className="fonts-acc-badge-box">
                                <p
                                  dir="rtl"
                                  className="fonts-acc-badge"
                                  style={{ fontFamily: fam }}
                                >
                                  {BADGE}
                                </p>
                              </div>
                            </div>
                            <div className="fonts-acc-latin-box">
                              <p
                                dir="ltr"
                                className="fonts-acc-latin"
                                style={{ fontFamily: fam }}
                              >
                                {f.latin}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            className="fonts-acc-chevron"
                            data-framer-name="Frame"
                            animate={{ rotate: open ? 180 : 0 }}
                            initial={false}
                            transition={FRAMER_SPRING}
                          >
                            <div
                              className="fonts-acc-icon"
                              data-framer-name="Icon"
                              style={{ backgroundImage: CHEVRON_SVG }}
                            />
                          </motion.div>
                        </div>
                        <div className="fonts-acc-desc-box">
                          <p dir="rtl" className="fonts-acc-desc">
                            {f.description}
                          </p>
                        </div>
                      </div>

                      {open && (
                        <div
                          className="fonts-acc-frames"
                          data-framer-name="Frame 129"
                        >
                          {WEIGHTS.map((w, j) => (
                            <React.Fragment key={w.value}>
                              {j > 0 && (
                                <div className="fonts-sep" aria-hidden />
                              )}
                              <WeightFrame
                                weight={w}
                                families={[f]}
                                justify="flex-start"
                                clipClass="fonts-acc-clip"
                                gap={j === 0 || j === 2 ? 8 : 10}
                              />
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
