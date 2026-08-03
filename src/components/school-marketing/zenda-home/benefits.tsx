// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/benefits). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */
import { BenefitsScroll } from "./benefits-scroll"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const GIFT = CDN + "67da6096879cc0328843d835_gift.webp"
const GIFT_500 = CDN + "67da6096879cc0328843d835_gift-p-500.webp"
const GIFT_800 = CDN + "67da6096879cc0328843d835_gift-p-800.webp"
const COIN = CDN + "67e4dfdecfe71e2e85fb7a29_coin1.webp"
const STAR = CDN + "682586d57eae34fbb9b8f719_star.webp"

const ITEMS = [
  "Activities",
  "Events",
  "Fees",
  "Canteen",
  "Transport",
  "Supplies",
  "Uniform",
  "Counselling",
]

export function Benefits() {
  return (
    <section className="section_benefits">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-medium">
          <div benefits-wrap="" className="benefits_wrap">
            {/* Left card — gift + heading, with two coins absolutely positioned.
                The w-node id makes this card span both grid rows on desktop. */}
            <div
              benefits-block-left=""
              id="w-node-_6b39d77d-72ac-d5d9-f7f6-914f9ea4a219-0feab224"
              className="benefits_header-block"
            >
              <div benefits-gift-img="" className="benefits_gift-wrap">
                <img
                  src={GIFT}
                  loading="lazy"
                  width={208}
                  height={232}
                  alt=""
                  srcSet={`${GIFT_500} 500w, ${GIFT_800} 800w, ${GIFT} 839w`}
                  sizes="208px"
                  className="img-auto"
                />
              </div>
              <div benefits-heading="" className="benefits_heading-wrap">
                <h2 className="benefits_heading heading-style-h3">
                  Rewards for everything school related
                </h2>
              </div>
              <div benefits-coin-1="" className="benefits_coin-wrap">
                <img src={COIN} loading="lazy" alt="" className="img-auto" />
              </div>
              <div benefits-coin-2="" className="benefits_coin-wrap is-second">
                <img src={COIN} loading="lazy" alt="" className="img-auto" />
              </div>
            </div>

            {/* Top-right card — dark "450+ institutions" with three stars. */}
            <div
              benefits-block-right=""
              className="benefits_block is-institutes"
            >
              <h3
                benefits-heading-right=""
                className="benefits_sub-heading heading-style-h2"
              >
                450+ institutions
              </h3>
              <div benefits-star-1="" className="benefits_star-wrap">
                <img src={STAR} loading="lazy" alt="" className="img-auto" />
              </div>
              <div benefits-star-2="" className="benefits_star-wrap is-2">
                <img src={STAR} loading="lazy" alt="" className="img-auto" />
              </div>
              <div benefits-star-3="" className="benefits_star-wrap is-3">
                <img src={STAR} loading="lazy" alt="" className="img-auto" />
              </div>
            </div>

            {/* Bottom-right card — the category pill list. */}
            <div benefits-block-right="" className="benefits_block">
              <div className="benefits_list">
                {ITEMS.map((item) => (
                  <div key={item} benefits-item="" className="benefits_item">
                    <div>{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <BenefitsScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
