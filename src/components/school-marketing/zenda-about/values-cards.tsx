// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/values-cards). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"

/**
 * "Our Values" expanding accordion — a faithful port of zenda.com/about-us'
 * `vCardInteraction`.
 *
 * Four cards sit in a row; one is active (full width, light-blue, content shown)
 * while the rest collapse to 8rem showing a number + vertical label. Hovering a
 * card (desktop) or tapping it (touch) expands it and collapses the others, with
 * GSAP tweening width + autoAlpha. Below 768px the grid stacks and every card
 * shows its content (handled in CSS), so the accordion is disabled there.
 */
export function ValuesCards() {
  useEffect(() => {
    const cards = gsap.utils.toArray<HTMLElement>("[v-card]")
    if (!cards.length) return
    // Mobile: cards are stacked and fully open (CSS) — no accordion.
    if (window.matchMedia("(max-width: 768px)").matches) return

    const ctx = gsap.context(() => {
      const content = (c: HTMLElement) => c.querySelector("[v-card-content]")
      const sidebar = (c: HTMLElement) =>
        c.querySelector("[v-card-side-bar-text]")

      const deactivateAll = () => {
        cards.forEach((card) => {
          card.classList.remove("is-active")
          gsap.to(card, { width: "8rem", duration: 0.6, ease: "power2.out" })
          gsap.to(content(card), {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2.out",
          })
          gsap.to(sidebar(card), {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2.out",
          })
        })
      }

      const activateCard = (card: HTMLElement) => {
        if (card.classList.contains("is-active")) return
        deactivateAll()
        card.classList.add("is-active")
        gsap.to(card, { width: "100%", duration: 0.6, ease: "power2.out" })
        gsap.to(content(card), {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
        })
        gsap.to(sidebar(card), {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
        })
      }

      const evt = window.matchMedia("(pointer: coarse)").matches
        ? "click"
        : "mouseenter"
      const handlers = cards.map((card) => {
        const h = () => activateCard(card)
        card.addEventListener(evt, h)
        return h
      })

      // Stage the first card open on load (match the markup's is-active).
      const first = cards[0]
      if (first?.classList.contains("is-active")) {
        gsap.set(first, { width: "100%" })
        gsap.set(content(first), { autoAlpha: 1 })
        gsap.set(sidebar(first), { autoAlpha: 0 })
      }

      return () =>
        cards.forEach((card, i) => card.removeEventListener(evt, handlers[i]))
    })

    return () => ctx.revert()
  }, [])

  return null
}
