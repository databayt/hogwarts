"use client"

import React from "react"

import { ReportIssue } from "@/components/report-issue"

/**
 * Footer bottom bar — the reference's .framer-15ptizc: a 1320px-max,
 * 3px-radius column (padding 16 24) whose row is 24px tall, set by the
 * reference's 64x24 wordmark. Below 600 the row stacks and centres.
 *
 * Everything the reference put here was thmanyah's own — the wordmark SVG
 * linking to company.thmanyah.com, an "الترخيص" link and their copyright
 * notice — so the CONTENT is ours while the row keeps its shape:
 *   · "بالقلم" is set the way the reference sets ثمانية — the display face
 *     at Black with ss01, the same treatment `WordmarkWriting` uses in the
 *     "8" panel — at 19px, where "بالقلم" measures 42x24 and so lands on
 *     the reference's exact 24px logo height. "من داتابيت" carries the same
 *     treatment, so the whole lockup is one string in one element (a normal
 *     word space rather than the link's 10px flex gap), inside the link to
 *     databayt.org.
 *   · the link slot carries the app's real <ReportIssue variant="text" />,
 *     the same component marketing-header/site-footer.tsx uses, so a report
 *     lands in the existing queue. Its "الإبلاغ عن مشكلة" label comes from
 *     the component's own dictionary.
 * The reference's copyright line is dropped, so the bar is one row (56px).
 *
 * Declarations live in globals.css under `.footer-bar*`.
 */

/* Inline rather than a `.footer-*` rule in thmanyah-clone.css: that file is
   being rewritten by other work, and an appended rule was silently lost
   once already — the lockup fell back to inherited type and wrapped to two
   lines (30x51 instead of 156x24). Inline keeps it with the markup, and
   matches how HeroBlock styles its own text.

   Both properties are load-bearing. `height: 24px` is the reference's logo
   height, which is what sets the row height. `whiteSpace: nowrap` is
   required because .footer-logo-link is width:min-content + overflow:clip —
   sized for a fixed image — so wrapping text collapses to its widest word
   and the clip eats the rest. */
const WORDMARK_STYLE: React.CSSProperties = {
  /* block, not flex: a flex container turns the bare text node and the
     underlined <span> into separate anonymous flex items and eats the word
     space between them. A 24px line box centres the glyphs just the same. */
  display: "block",
  height: 24,
  lineHeight: "24px",
  whiteSpace: "nowrap",
  /* ثمانية's own treatment: the display face at Black with ss01. */
  fontFamily: '"thmanyah serif display", serif',
  fontSize: 19,
  fontWeight: 900,
  fontFeatureSettings: '"ss01" on',
  color: "#000",
}

export function FooterBlock() {
  return (
    <div className="footer-bar" data-framer-name="Footer">
      {/* .framer-d3pryj */}
      <div className="footer-bar-row">
        <a
          className="footer-logo-link"
          href="https://databayt.org"
          target="_blank"
          rel="noopener"
          aria-label="بالقلم من داتابيت"
        >
          <p dir="rtl" className="footer-wordmark" style={WORDMARK_STYLE}>
            {"بالقلم من "}
            <span
              style={{ textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {"داتابيت"}
            </span>
          </p>
        </a>
        <div className="footer-bar-links">
          <div className="footer-pre">
            <p dir="rtl" className="footer-license">
              <ReportIssue variant="text" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
