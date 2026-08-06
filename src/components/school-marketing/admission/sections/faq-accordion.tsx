"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

export interface FaqEntry {
  question: string
  answer: string
  listItems?: string[]
}

/**
 * Zenda's FAQ accordion (`zenda.com/parents` → `components/parents/faq.tsx`),
 * rebuilt native rather than ported.
 *
 * Two deliberate divergences from the source, both for reasons this page has
 * and zenda doesn't:
 *
 *  1. **No GSAP, no `.zenda-clone`.** The reference measures `scrollHeight` and
 *     tweens `height`; this uses a `grid-template-rows: 0fr → 1fr` transition,
 *     which needs no measurement and survives the answer reflowing (Arabic sets
 *     to a different height than English at the same width). The zenda class
 *     scope is English/LTR-only, so the geometry below is transcribed from
 *     `.faq_*` in zenda-clone.css instead of inherited from it.
 *  2. **A real <button> per row.** The reference binds click to a <div>, which
 *     no keyboard or screen reader can reach. Same visuals, `aria-expanded`
 *     and `aria-controls` wired up.
 *
 * Geometry is zenda's: 0.875rem row gap, 1.5rem corner, translucent white that
 * goes solid when open, 1.75rem/2rem question inset (1rem/1.5rem on phones),
 * and a chevron that flips 180deg.
 */
export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  // One open at a time, all closed initially -- zenda's behaviour.
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <div
            key={item.question}
            className={`overflow-hidden rounded-3xl transition-colors duration-[400ms] ${
              open ? "bg-white" : "bg-white/40"
            }`}
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`faq-answer-${i}`}
                onClick={() => setOpenIndex(open ? null : i)}
                className="zenda-body flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-start text-xl font-medium tracking-[-0.02em] md:px-8 md:py-7"
              >
                {item.question}
                <svg
                  viewBox="0 0 22 13"
                  fill="none"
                  aria-hidden="true"
                  className={`w-4 flex-none transition-transform duration-[460ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] md:w-5 ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M1.57812 2.01074L10.9375 11.3701L20.2969 2.01074"
                    stroke="currentColor"
                    strokeWidth="2.51285"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h3>

            {/* The 0fr/1fr row is what animates; the inner div must be
             * `min-h-0 overflow-hidden` or it refuses to shrink below its
             * content height and the row snaps instead of sliding. */}
            <div
              id={`faq-answer-${i}`}
              className={`grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`zenda-body px-6 pb-4 text-base transition-all duration-[400ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] md:px-8 md:pb-7 md:text-lg ${
                    open
                      ? "translate-y-0 opacity-100"
                      : "translate-y-[40%] opacity-0"
                  }`}
                >
                  <p>{item.answer}</p>
                  {item.listItems && item.listItems.length > 0 && (
                    <ul className="mt-4 list-outside list-disc space-y-2 ps-4">
                      {item.listItems.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
