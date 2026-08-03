// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/rewards). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

import { RewardsScroll } from "./rewards-scroll"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const IMG = {
  leafs: CDN + "68677bf9dc4b788c9ef0fb91_leafs.webp",
  surface: CDN + "67e4cce8bab0dccbae7f3fc8_rewards-surface.webp",
  gift: CDN + "67e4cee17493c02f54e056e9_gift%201.webp",
  ulta: CDN + "67e4dfe65cc20aed35145d06_image%202829.webp",
  ribbon: CDN + "67e4dfe6187e70a30462641b_image%202824.webp",
  givingli: CDN + "67e4dfe69d21a1fd3580a854_image%202825.webp",
  coin: CDN + "67e4dfdecfe71e2e85fb7a29_coin1.webp",
  amazon: CDN + "6867e4c506712128ad9cb811_amazon.webp",
  talabat: CDN + "6867e4c58317e590e1b61347_talabat.webp",
  noon: CDN + "6867e4c6af4405a766bcdbd4_noon.webp",
} as const

// Render the literal attribute the GSAP timeline selects on (e.g. rewards-block-1).
const target = (name: string): Record<string, string> => ({ [name]: "" })

export function Rewards() {
  return (
    <section rewards-section="" className="section_rewards">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div rewards-wrap="" className="rewards_wrap">
            <div className="rewards_header">
              <div rewards-element="" className="tag is-text">
                REWARDS
              </div>
              <div className="padding-bottom padding-xxsmall"></div>
              <h2
                rewards-element=""
                className="rewards_heading heading-style-h2"
              >
                Unlock new experiences when you pay on zenda
              </h2>
              <div className="padding-bottom padding-small"></div>
              <div
                rewards-element=""
                className="max-width is-33rem align-center"
              >
                <p className="text-size-medium">
                  Make every school payment count — turn fees into a little
                  extra joy by earning gift cards and exclusive rewards.
                </p>
              </div>
              <div className="padding-bottom padding-large"></div>
              <div rewards-element="" className="button-group is-align-center">
                <div className="button_component">
                  <Link href="/parents" className="button-v2 w-inline-block">
                    <span className="button-v2_bg">
                      <span
                        style={{ "--index": 0 } as React.CSSProperties}
                        className="button-v2_bg-inner is-first"
                      ></span>
                      <span
                        style={{ "--index": 1 } as React.CSSProperties}
                        className="button-v2_bg-inner is-second"
                      ></span>
                    </span>
                    <span data-text="EXPLORE" className="button-v2_inner">
                      <span className="button-v2_text">EXPLORE</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="rewards_surface_component">
              <div className="rewards_surface_wrap">
                <div className="rewards_points-wrap">
                  <div className="rewards_points-number">Rewards</div>
                  <div className="rewards_points-title hide">POINTS</div>
                  <div className="rewards_points-img-wrap">
                    <img
                      src={IMG.leafs}
                      loading="lazy"
                      alt=""
                      className="img-auto"
                    />
                  </div>
                </div>

                <div rewards-globe="" className="rewards_circle-wrap">
                  <img
                    src={IMG.surface}
                    loading="lazy"
                    width={1024}
                    height={454}
                    alt=""
                    className="img-auto"
                  />
                </div>

                <div
                  rewards-progress-wrap=""
                  className="rewards_circle-progress"
                >
                  <div className="rewards_progress_embed w-embed">
                    <svg
                      width="100%"
                      viewBox="0 0 983 997"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        id="curve"
                        d="M35.8847 665.532C53.8538 592.137 86.1031 523 130.791 462.069C175.48 401.137 231.732 349.604 296.336 310.412C360.94 271.22 432.631 245.137 507.315 233.651C582 222.166 658.215 225.502 731.61 243.472C779.8 257.731 891.944 300.844 954.995 359.226"
                        stroke="url(#paint0_linear_2273_21631)"
                        strokeWidth="25.7341"
                        strokeLinecap="round"
                      ></path>
                      <circle
                        id="endpoint"
                        cx="35.8847"
                        cy="665.532"
                        r="19.7954"
                        fill="#B071F4"
                        stroke="white"
                        strokeWidth="7"
                      ></circle>
                      <defs>
                        <linearGradient
                          id="paint0_linear_2273_21631"
                          x1="867.124"
                          y1="288.544"
                          x2="396.603"
                          y2="930.09"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#B070F4"></stop>
                          <stop offset="0.995846" stopColor="#F4F2EC"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div rewards-gift="" className="rewards_gift_parent">
                  <div className="rewards_gift_wrap">
                    <div className="rewards_gift_img">
                      <img
                        src={IMG.gift}
                        loading="lazy"
                        width={204}
                        height={232}
                        alt=""
                        className="img-auto"
                      />
                    </div>
                  </div>
                  <div className="rewards_gift_clip hide"></div>
                </div>
              </div>
            </div>

            <div className="rewards_bg-wrap">
              <div className="rewards_bg-block-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div
                    key={n}
                    {...target(`rewards-block-${n}`)}
                    className={`rewards_bg-block is-${n}`}
                  ></div>
                ))}
              </div>

              <div className="rewards_bg-img-wrap">
                <div
                  {...target("rewards-img-1")}
                  className="rewards_bg-img is-ulta"
                >
                  <img
                    src={IMG.ulta}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
                <div
                  {...target("rewards-img-2")}
                  className="rewards_bg-img is-ribbon"
                >
                  <img
                    src={IMG.ribbon}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
                <div
                  {...target("rewards-img-3")}
                  className="rewards_bg-img is-givingli"
                >
                  <img
                    src={IMG.givingli}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
              </div>

              <div className="rewards_bg-coins-wrap">
                <div {...target("rewards-coin-1")} className="rewards_bg-coin">
                  <img
                    src={IMG.coin}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
                <div
                  {...target("rewards-coin-2")}
                  className="rewards_bg-coin is-2"
                >
                  <img
                    src={IMG.coin}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
              </div>

              <div className="rewards_coupons-wrap">
                <div
                  {...target("rewards-item-1")}
                  className="rewards_coupon is-1"
                >
                  <div className="rewards_img_wrap">
                    <img
                      src={IMG.amazon}
                      loading="lazy"
                      alt=""
                      className="img-auto"
                    />
                  </div>
                </div>
                <div
                  {...target("rewards-item-2")}
                  className="rewards_coupon is-2"
                >
                  <div className="rewards_img_wrap">
                    <img
                      src={IMG.talabat}
                      loading="lazy"
                      alt=""
                      className="img-auto"
                    />
                  </div>
                </div>
                <div
                  {...target("rewards-item-3")}
                  className="rewards_coupon is-3"
                >
                  <div className="rewards_img_wrap">
                    <img
                      src={IMG.noon}
                      loading="lazy"
                      alt=""
                      className="img-auto"
                    />
                  </div>
                </div>
              </div>
            </div>

            <RewardsScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
