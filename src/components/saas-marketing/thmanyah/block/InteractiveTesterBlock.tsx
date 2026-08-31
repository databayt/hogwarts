"use client"

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"

import {
  FAMILIES,
  FRAMER_SPRING,
  type FamilyId,
} from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * The tester — 1:1 mirror of font.thmanyah.com's "B Display" block
 * (.framer-ykech4-container → .framer-gFeSo "B Display" → 100vh
 * .framer-1obzdgi-container → .framer-z44sK "B / SDisplay").
 *
 *   panel    a full-bleed absolute backdrop (.framer-p1cmr7) whose colour is
 *            the current swatch — #000 (white type), #00bc6d or #fafafa
 *            (black type) — under a padded flex column (80 60 60 at ≥1200,
 *            124 40 44 at 810–1199, 40 at 600–809, 44 20 32 below)
 *   R, B     flex:1 column, gap 44: the wrapping controls row (font select ·
 *            weight select · alignment · ss01 switch, gap 36, max 792) and
 *            the textarea box at 75% of the column height
 *   menus    Framer portals the selects into #overlay: a white 12px-radius
 *            card (padding 4, shadow 0 10 20 rgba(0,0,0,.05)) of 48px items,
 *            the selected one Bold #00bc6d, 8px under the trigger and
 *            right-aligned 13px past the control's right edge
 *   caret    a decorative 2px bar the reference draws at the end of the copy
 *            while the textarea is *not* focused (the native caret takes
 *            over on focus); its position comes from a hidden mirror div
 *   pill     the swatch pill (padding 12, gap 12, radius 100, 2px ring) with
 *            a 30px "Backdrop" ring that springs to the active swatch
 *
 * Declarations live in globals.css under `.tester-*`.
 */

type Align = "right" | "center" | "left"
type Bg = "black" | "green" | "white"

const WEIGHT_MENU: Array<{
  label: string
  value: 300 | 400 | 500 | 700 | 900
  valueLabel: string
}> = [
  { label: "رفيـع", value: 300, valueLabel: "رفيــــع" },
  { label: "عادي", value: 400, valueLabel: "عادي" },
  { label: "متوسط", value: 500, valueLabel: "متوســط" },
  { label: "سميــك", value: 700, valueLabel: "سميــك" },
  { label: "ثقيــل", value: 900, valueLabel: "ثقيـــل" },
]

/* The editable specimen. Sized to the reference's own two lines so the
   panel opens at the same visual mass — at 72px/700 the reference inks 912
   and 2149px; these ink 882 and 2134 (−3.3% / −0.7%), so the box still
   opens 530px tall and wraps the same way. */
const DEFAULT_TEXT =
  "منظومة حيّة؛ تُنظّم يوم المدرسة.\nمن أول حصة إلى آخر تقرير، يبقى كل رقم في مكانه، ويرى كل طرفٍ ما يخصّه وحده."

const PANEL_BG: Record<Bg, string> = {
  black: "rgb(0, 0, 0)",
  green: "rgb(0, 188, 109)",
  white: "rgb(250, 250, 250)",
}
const INK: Record<Bg, string> = {
  black: "rgb(255, 255, 255)",
  green: "rgb(0, 0, 0)",
  white: "rgb(0, 0, 0)",
}

const SELECT_CHEVRON =
  'url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 14 14%22><path d=%22M 3 5.5 L 7 9.5 L 11 5.5%22 fill=%22transparent%22 stroke-width=%222%22 stroke=%22%23aaa%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22></path></svg>")'

/* ── Select (Framer's dropdown, portaled) ───────────────────────────────── */

function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  menuWidth,
  ink,
  ctlClass,
  navName,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string; valueLabel?: string }>
  onChange: (v: T) => void
  menuWidth: number
  ink: string
  ctlClass: string
  navName: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const place = useCallback(() => {
    const nav = navRef.current
    const trig = triggerRef.current
    if (!nav || !trig) return
    const n = nav.getBoundingClientRect()
    const t = trig.getBoundingClientRect()
    setPos({
      top: t.bottom + window.scrollY + 8,
      right: document.documentElement.clientWidth - n.right - 13,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", place)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", place)
    }
  }, [open, place])

  const current = options.find((o) => o.value === value) ?? options[0]

  return (
    <div className={`tester-ctl ${ctlClass}`}>
      <nav
        ref={navRef}
        className="tester-select"
        data-framer-name={navName}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="tester-label-box">
          <p dir="rtl" className="tester-label" style={{ color: ink }}>
            {label}
          </p>
        </div>
        <div
          ref={triggerRef}
          className="tester-trigger"
          data-framer-name="Trigger 3"
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setOpen((v) => !v)
            }
          }}
        >
          <div className="tester-value-box">
            <p dir="rtl" className="tester-value" style={{ color: ink }}>
              {current.valueLabel ?? current.label}
            </p>
          </div>
          <div className="tester-chev-wrap">
            <div className="tester-chev" data-framer-name="Closed">
              <div className="tester-chev-frame" data-framer-name="Frame">
                <div
                  className="tester-chev-icon"
                  data-framer-name="Icon"
                  style={{ backgroundImage: SELECT_CHEVRON }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="tester-menu-layer"
            style={{ top: pos.top, right: pos.right, width: menuWidth }}
          >
            <div
              className="tester-menu-backdrop"
              onClick={() => setOpen(false)}
            />
            <div
              className="tester-menu"
              role="listbox"
              style={{ width: menuWidth }}
            >
              {options.map((o) => {
                const selected = o.value === value
                return (
                  <div key={String(o.value)} className="tester-menu-slot">
                    <div
                      className="tester-menu-item"
                      data-framer-name={selected ? "Variant 2" : "Variant 1"}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(o.value)
                        setOpen(false)
                      }}
                    >
                      <div className="tester-menu-text-box">
                        <p
                          dir="rtl"
                          className="tester-menu-text"
                          style={
                            selected
                              ? { fontWeight: 700, color: "rgb(0, 188, 109)" }
                              : undefined
                          }
                        >
                          {o.label}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

/* ── Block ───────────────────────────────────────────────────────────────── */

export function InteractiveTesterBlock() {
  const [family, setFamily] = useState<FamilyId>("display")
  const [weight, setWeight] = useState<300 | 400 | 500 | 700 | 900>(700)
  const [align, setAlign] = useState<Align>("right")
  const [ss01, setSs01] = useState(false)
  const [bg, setBg] = useState<Bg>("black")
  const [text, setText] = useState(DEFAULT_TEXT)
  const [focused, setFocused] = useState(false)
  const [caret, setCaret] = useState<{
    left: number
    top: number
    height: number
  } | null>(null)

  const ink = INK[bg]
  const fam = FAMILIES.find((f) => f.id === family) ?? FAMILIES[0]
  const fontFamily = `"${fam.css}", ${fam.id === "sans" ? "sans-serif" : "serif"}`

  const mirrorRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  /* Decorative caret: measured off the mirror's trailing marker, mirroring
     the reference's own technique (2px bar, 1.3em tall, min 20px). */
  const measureCaret = useCallback(() => {
    const m = mirrorRef.current
    const k = markerRef.current
    const ta = taRef.current
    if (!m || !k || !ta) return
    const mr = m.getBoundingClientRect()
    const kr = k.getBoundingClientRect()
    const fs = parseFloat(getComputedStyle(ta).fontSize)
    const lh = parseFloat(getComputedStyle(ta).lineHeight)
    const h = Math.max(20, fs * 1.3)
    /* The reference reads a collapsed Range at the end of the mirror's text:
       its rect top is the line's inline-box top (half-leading included), its
       left the caret x; only the height is overridden to 1.3em. */
    void lh
    setCaret({
      /* the live bar sits its padding + border (8 + 1px) left of the range x */
      left: kr.left - mr.left - 9,
      top: kr.top - mr.top - ta.scrollTop,
      height: h,
    })
  }, [])

  useLayoutEffect(() => {
    measureCaret()
  }, [measureCaret, text, family, weight, align, ss01])

  useEffect(() => {
    if (!document.fonts) return
    document.fonts.ready.then(measureCaret)
    window.addEventListener("resize", measureCaret)
    return () => window.removeEventListener("resize", measureCaret)
  }, [measureCaret])

  const typo: React.CSSProperties = {
    fontFamily,
    fontWeight: weight,
    textAlign: align,
    fontFeatureSettings: ss01 ? '"ss01" on' : "normal",
  }

  return (
    <div className="tester" data-framer-name="B Display">
      <div className="tester-vh">
        <div
          className="tester-panel"
          data-framer-name="B / SDisplay"
          data-bg={bg}
        >
          {/* .framer-p1cmr7 — the panel colour */}
          <motion.div
            className="tester-bg"
            animate={{ backgroundColor: PANEL_BG[bg] }}
            initial={false}
            transition={FRAMER_SPRING}
          />

          {/* .framer-1gevshe-container > "R, B" */}
          <div className="tester-body">
            <div className="tester-rb" data-framer-name="R, B">
              {/* .framer-t1meku — controls */}
              <div className="tester-controls">
                <Select
                  label="الخط"
                  navName="S Display"
                  ctlClass="tester-ctl--font"
                  ink={ink}
                  value={family}
                  onChange={(v) => setFamily(v)}
                  menuWidth={282}
                  options={FAMILIES.map((f) => ({
                    value: f.id,
                    /* live: the display family shows its one-tatweel select label
                       everywhere; text/sans use their two-tatweel titles */
                    label: f.id === "display" ? f.selectLabel : f.title,
                    valueLabel: f.id === "display" ? f.selectLabel : f.title,
                  }))}
                />
                <Select
                  label="الوزن"
                  navName="Bold"
                  ctlClass="tester-ctl--weight"
                  ink={ink}
                  value={weight}
                  onChange={(v) => setWeight(v)}
                  menuWidth={152}
                  options={WEIGHT_MENU.map((w) => ({
                    value: w.value,
                    label: w.label,
                    valueLabel: w.valueLabel,
                  }))}
                />

                {/* Toggle (.framer-1l4ym4v-container > nav "R") */}
                <div
                  className="tester-ctl tester-ctl--align"
                  data-framer-name="Toggle"
                >
                  <nav className="tester-align" data-framer-name="R">
                    <div className="tester-label-box">
                      <p
                        dir="rtl"
                        className="tester-label"
                        style={{ color: ink }}
                      >
                        المحاذاة
                      </p>
                    </div>
                    <div className="tester-align-row">
                      {(
                        [
                          {
                            id: "right",
                            name: "Item 3",
                            icon: "tester-align-icon--right",
                          },
                          {
                            id: "center",
                            name: "Item 2",
                            icon: "tester-align-icon--center",
                          },
                          {
                            id: "left",
                            name: "Item 1",
                            icon: "tester-align-icon--left",
                          },
                        ] as const
                      ).map((it) => (
                        <motion.div
                          key={it.id}
                          className="tester-align-item"
                          data-framer-name={it.name}
                          role="button"
                          aria-pressed={align === it.id}
                          animate={{ opacity: align === it.id ? 1 : 0.3 }}
                          initial={false}
                          transition={FRAMER_SPRING}
                          onClick={() => setAlign(it.id)}
                        >
                          <div
                            className={`tester-align-icon ${it.icon}`}
                            style={{ backgroundColor: ink }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </nav>
                </div>

                {/* Off (.framer-1y6q0zy-container > nav "Off") */}
                <div className="tester-ctl tester-ctl--ss">
                  <nav
                    className="tester-ss"
                    data-framer-name={ss01 ? "On" : "Off"}
                  >
                    <div className="tester-label-box">
                      <p
                        dir="rtl"
                        className="tester-label tester-label--ss01"
                        style={{ color: ink }}
                      >
                        الحروف مرسلة
                      </p>
                    </div>
                    <div className="tester-ss-row">
                      <div
                        className="tester-switch"
                        role="switch"
                        aria-checked={ss01}
                        tabIndex={0}
                        style={{
                          justifyContent: ss01 ? "flex-end" : "flex-start",
                        }}
                        onClick={() => setSs01((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSs01((v) => !v)
                          }
                        }}
                      >
                        <motion.div
                          layout
                          className="tester-knob"
                          animate={{
                            backgroundColor: ss01
                              ? "rgb(0, 188, 109)"
                              : "rgb(128, 128, 128)",
                          }}
                          initial={false}
                          transition={FRAMER_SPRING}
                        />
                      </div>
                    </div>
                  </nav>
                </div>
              </div>

              {/* .framer-mjo151-container — the textarea */}
              <div className="tester-ta-wrap">
                <div className="tester-ta-inner">
                  <textarea
                    ref={taRef}
                    className="tester-ta"
                    dir="rtl"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onScroll={measureCaret}
                    style={{ ...typo, color: ink, caretColor: ink }}
                  />
                  <div
                    ref={mirrorRef}
                    className="tester-mirror"
                    aria-hidden
                    style={typo}
                  >
                    {text}
                    <span ref={markerRef} />
                  </div>
                  {!focused && caret && (
                    <div
                      className="tester-caret"
                      aria-hidden
                      style={{
                        left: caret.left,
                        top: caret.top,
                        height: caret.height,
                        backgroundColor: ink,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* .framer-s33kk1 — swatch pill */}
          <div className="tester-pill">
            <motion.div
              className="tester-backdrop"
              data-framer-name="Backdrop"
              data-bg={bg}
              initial={false}
              animate={
                bg === "black"
                  ? { left: "auto", right: 7, x: 0, y: -15 }
                  : bg === "green"
                    ? { left: "50%", right: "auto", x: -15, y: -15 }
                    : { left: 7, right: "auto", x: 0, y: -15 }
              }
              transition={FRAMER_SPRING}
            >
              <div className="tester-mask" data-framer-name="Mask" />
            </motion.div>
            {(
              [
                { id: "black", cls: "tester-swatch--black" },
                { id: "green", cls: "tester-swatch--green" },
                { id: "white", cls: "tester-swatch--white" },
              ] as const
            ).map((s) => (
              <div
                key={s.id}
                className={`tester-swatch ${s.cls}`}
                role="button"
                aria-label={s.id}
                aria-pressed={bg === s.id}
                tabIndex={0}
                onClick={() => setBg(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setBg(s.id)
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
