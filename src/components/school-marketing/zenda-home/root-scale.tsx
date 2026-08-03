// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Zenda's fluid root type scale, restored on the real `<html>` element.
 *
 * Zenda sizes its entire site in `rem` and drives those rem off a viewport-
 * derived root font size, so the whole page scales continuously between
 * breakpoints rather than stepping. `scripts/scope-zenda.mjs` rewrites `html`
 * selectors to `.zenda-clone`, which turned that ladder into
 * `.zenda-clone { font-size: … }` -- and `rem` resolves against the document
 * root, never an ancestor, so the entire system quietly stopped working. The
 * clone matched zenda only at >= 1440px; at 1200px every rem-based size was
 * ~20% too large (hero heading 70.4px against zenda's 58.7px).
 *
 * The ladder can only live on `html`, so it cannot be scoped by a class. It is
 * rendered as a plain `<style>` from the homepage instead: page-level markup
 * mounts and unmounts with the route, so the rescale applies here and nowhere
 * else. Sibling marketing pages keep the 16px root their Tailwind expects.
 *
 * The trade-off, taken deliberately: below 1440px the shared nav and footer
 * scale on this page and not on the siblings. Rescaling five pages of unrelated
 * Tailwind UI to avoid that would be the larger regression.
 *
 * Values copied verbatim from zenda's `app/globals.css` -- do not "simplify"
 * them, the fractional rem terms are what pin each breakpoint's endpoint.
 */
export function ZendaRootScale() {
  return (
    <style>{`
      html { font-size: 1rem; }
      @media screen and (max-width: 1440px) { html { font-size: calc(-0.00044642857142851433rem + 1.1116071428571428vw); } }
      @media screen and (max-width: 991px)  { html { font-size: calc(0.0006608280254774002rem + 1.9171974522293vw); } }
      @media screen and (max-width: 834px)  { html { font-size: calc(-0.003600746268656141rem + 1.925373134328357vw); } }
      @media screen and (max-width: 767px)  { html { font-size: calc(0.0007485029940121901rem + 2.6646706586826343vw); } }
      @media screen and (max-width: 600px)  { html { font-size: calc(-0.0010330578512397492rem + 2.669421487603306vw); } }
      @media screen and (max-width: 479px)  { html { font-size: calc(0.00035112359550615313rem + 4.101123595505616vw); } }
      @media screen and (max-width: 390px)  { html { font-size: calc(-0.26587499999999975rem + 5.1933333333333325vw); } }
      @media screen and (max-width: 240px)  { html { font-size: 0.513125rem; } }
    `}</style>
  )
}
