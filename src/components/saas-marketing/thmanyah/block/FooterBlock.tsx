"use client"

import React from "react"

/**
 * Footer bottom bar — 1:1 mirror of font.thmanyah.com's .framer-15ptizc:
 * a 1320px-max, 3px-radius column (padding 16 24, gap 16 — 24 below 600)
 * holding the logo/licence row (thmanyah wordmark as a 64x24 SVG
 * background linking to company.thmanyah.com, "الترخيص" in sans Regular
 * 14px #808080 pushed to the far end) and the 13px #808080 copyright line
 * set with direction: ltr. Below 600 the row stacks and centres.
 *
 * Declarations live in globals.css under `.footer-bar*`.
 */

const LOGO =
  'url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 viewBox=%220 0 64.075 24%22 overflow=%22visible%22><g><path d=%22M 61.894 1.834 L 60.06 0 L 58.251 1.834 L 60.06 3.694 L 61.895 1.834 Z M 60.274 6.815 L 58.062 11.412 L 61.074 14.026 C 59.775 14.488 58.603 14.638 57.71 14.614 C 56.199 14.559 55.093 13.437 53.419 10.864 C 52.069 8.785 50.909 7.827 49.586 7.827 C 48.101 7.827 46.67 9.278 44.916 11.822 C 43.62 13.711 42.595 14.587 41.434 14.587 C 40.382 14.587 39.517 13.902 39.517 11.33 L 39.517 0 L 39.248 0 L 36.656 3.175 L 37.088 12.616 C 37.304 17.24 38.681 19.101 41.138 19.101 C 42.742 19.101 43.9 18.132 44.65 17.016 L 50.288 20.414 L 52.906 15.845 L 53.041 15.845 C 54.04 18.307 55.443 19.129 57.036 19.129 C 58.224 19.129 59.492 18.91 60.733 18.581 C 61.813 15.051 62.165 13.272 62.165 11.575 C 62.165 10.015 61.409 8.182 60.545 6.814 L 60.275 6.814 Z M 45.53 12.505 C 46.082 11.879 46.674 11.612 47.291 11.631 C 48.872 11.631 50.575 13.646 51.974 16.202 Z M 24.455 21.697 L 22.62 19.813 L 20.542 21.92 L 22.62 24 L 24.455 22.139 L 26.291 24 L 28.369 21.92 L 26.291 19.813 L 24.455 21.698 Z M 3.913 2.627 L 5.75 4.488 L 7.828 2.408 L 5.75 0.301 L 3.912 2.188 L 2.053 0.302 L 0 2.409 L 2.051 4.515 L 3.913 2.627 Z M 34.659 3.23 L 32.58 1.122 L 30.529 3.23 L 32.58 5.336 L 34.659 3.229 Z M 26.398 4.707 L 27.667 3.12 L 27.586 2.873 L 13.037 7.854 L 11.796 9.469 L 11.85 9.715 Z%22 fill=%22rgb(0, 0, 0)%22></path><path d=%22M 32.925 6.62 L 30.712 11.218 L 33.709 13.819 C 32.147 14.32 30.38 14.612 28.769 14.612 C 26.258 14.612 26.176 13.599 26.176 10.972 L 26.176 9.795 L 25.366 9.795 L 24.409 13.334 C 20.737 14.279 17.054 14.639 14.246 14.639 C 10.116 14.639 9.009 13.928 9.009 10.671 L 9.009 3.693 L 8.739 3.693 L 6.23 6.237 L 6.253 7.247 L 5.285 7.77 C 2.045 9.521 0.75 10.808 0.75 13.463 C 0.75 15.87 2.261 17.02 4.125 17.02 C 4.826 17.02 5.474 16.91 6.04 16.664 L 6.678 14.761 C 7.5 17.905 9.907 19.154 13.815 19.154 C 16.541 19.154 20.077 18.771 23.344 17.95 L 24.127 15.542 L 24.314 15.542 C 24.599 17.96 25.68 19.08 28.256 19.127 C 30.146 19.154 31.819 18.88 33.385 18.387 C 34.465 14.994 34.816 13.298 34.816 11.655 C 34.816 9.822 34.06 8.015 33.197 6.62 Z M 4.124 12.504 C 2.99 12.504 2.342 12.313 2.342 11.875 C 2.342 11.465 2.747 11.219 3.881 10.753 L 6.307 9.74 L 6.364 12.286 L 6.366 12.343 C 5.707 12.449 4.893 12.504 4.123 12.504 Z M 60.146 4.523 L 58.298 2.625 L 56.221 4.76 L 58.298 6.84 L 60.146 4.99 L 61.969 6.84 L 64.075 4.76 L 61.969 2.625 Z%22 fill=%22rgb(0, 0, 0)%22></path></g></svg>")'

export function FooterBlock() {
  return (
    <div className="footer-bar" data-framer-name="Footer">
      {/* .framer-d3pryj */}
      <div className="footer-bar-row">
        <a
          className="footer-logo-link"
          href="https://company.thmanyah.com/"
          target="_blank"
          rel="noopener"
          aria-label="ثمانية"
        >
          <div className="footer-logo" style={{ backgroundImage: LOGO }} />
        </a>
        <div className="footer-bar-links">
          <div className="footer-pre">
            <p dir="rtl" className="footer-license">
              <a href="/licenses">الترخيص</a>
            </p>
          </div>
        </div>
      </div>
      {/* .framer-sdl8gy */}
      <div className="footer-copy-box">
        <p dir="ltr" className="footer-copy">
          ⓒ جميع الحقوق محفوظة لشركة ثمانية للنشر والتوزيع
        </p>
      </div>
    </div>
  )
}
