"use client"

import React from "react"
import { motion } from "framer-motion"

import {
  useThmanyahLocale,
  type AnswerPart,
  type FaqItem,
} from "@/components/saas-marketing/thmanyah/lib/copy"
import {
  FRAMER_SPRING,
  reveal,
} from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * FAQ — 1:1 mirror of font.thmanyah.com's #faq section (.framer-808h3m).
 *
 * A 1320px wrapping row (gap 64 76) of three flex:1 0 0 columns (gap 48).
 * The first starts with the heading row — the two-line 44px Black title
 * next to a 1px #808080 rule that stretches to its height (hidden below
 * 600) — and every Q&A is a 348px-max column: question in serif display
 * Bold 20/1.4em ss01, answer in sans Light 16/1.4em justified at 90% black.
 *
 * Markup is copied from the live DOM, faux bold included: the reference
 * wraps emphasised words in a span whose family is the single-face
 * "thmanyah sans Regular" and puts a <strong> inside it, so the browser
 * synthesises the bold — the `.faq-reg` alias family reproduces that
 * rather than substituting the real Bold cut. Link colour is 70% black,
 * underlined. The answers are authored in `lib/copy.ts` as runs — plain
 * text, `{bold}`, `{link}` — and each run becomes one text node, so the
 * rendered nodes still match the reference's one-for-one; spaces live
 * inside the runs, as they did when these were literals here.
 *
 * Below 1200 the row stacks (gap 64 at 600–1199 with 232px min columns,
 * gap 56 below 600) and the 348px caps are lifted; at ≥1800 they are
 * lifted too. Declarations live in globals.css under `.faq-*`.
 */

function Answer({ parts, lang }: { parts: AnswerPart[]; lang: string }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") return part
        if ("bold" in part) {
          return (
            <span key={i} className="faq-reg">
              <strong>{part.bold}</strong>
            </span>
          )
        }
        /* Internal hrefs carry the locale. Dropping `[lang]` here is what
           silently flipped an Arabic reader to English once before. */
        return (
          <a key={i} href={`/${lang}${part.href}`} className="faq-link">
            {part.link}
          </a>
        )
      })}
    </>
  )
}

function Qa({ item, lang }: { item: FaqItem; lang: string }) {
  return (
    <div className="faq-item">
      <div className="faq-q-box">
        <p className="faq-q">{item.q}</p>
      </div>
      <motion.div
        className="faq-answer"
        initial={{ opacity: 0.001 }}
        animate={{ opacity: 1 }}
        transition={FRAMER_SPRING}
      >
        <p className={item.flush ? "faq-a faq-a--right" : "faq-a"}>
          <Answer parts={item.a} lang={lang} />
        </p>
      </motion.div>
    </div>
  )
}

export function FaqBlock() {
  const { lang, copy } = useThmanyahLocale()
  const { titleLine1, titleLine2Lead, titleLine2Mark, columns } = copy.faq

  return (
    <div id="faq" className="faq" data-framer-name="FAQ">
      <motion.div className="faq-grid" {...reveal(60, 0.5)}>
        {columns.map((column, col) => (
          /* column 1 (.framer-10zo1qp) · 2 (.framer-ebbquz) · 3 (.framer-wrzzgg) */
          <div key={col} className="faq-col">
            {col === 0 && (
              <div className="faq-head">
                <div className="faq-head-text">
                  <p className="faq-title">{titleLine1}</p>
                  <p className="faq-title">
                    {titleLine2Lead}
                    <span className="faq-ss01">{titleLine2Mark}</span>
                  </p>
                </div>
                <div className="faq-divider" aria-hidden>
                  <div className="faq-divider-line" />
                </div>
              </div>
            )}
            {column.map((item) => (
              <Qa key={item.q} item={item} lang={lang} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
