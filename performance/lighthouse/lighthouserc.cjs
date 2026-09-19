// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Lighthouse CI for the PUBLIC first screens — the marketing home and the
 * tenant login, the two pages every new visitor lands on with a cold cache.
 *
 *   pnpm dlx @lhci/cli autorun --config=performance/lighthouse/lighthouserc.cjs
 *   LHCI_BASE=https://demo.balqalam.com LHCI_HOME=https://balqalam.com pnpm dlx @lhci/cli autorun --config=…
 *
 * Signed-in routes are measured by `pnpm perf:playwright` (real flows) and
 * `pnpm perf:lighthouse -- --role teacher` (session passed as a header): LHCI's
 * own login story needs a Puppeteer dependency this repo does not carry.
 *
 * Assertions mirror performance/config/budgets.json. They are budgets on what
 * the page SHIPS and how long it BLOCKS — not on the performance score, which
 * moves with the runner's CPU and proves nothing about a teacher's phone.
 */
const base = process.env.LHCI_BASE || "http://demo.localhost:3000"
const home = process.env.LHCI_HOME || "http://localhost:3000"

module.exports = {
  ci: {
    collect: {
      url: [`${home}/ar`, `${base}/ar/login`],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ["performance"],
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // Bytes do not depend on the runner — these are the hard gates.
        "resource-summary:document:size": ["error", { maxNumericValue: 204800 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 614400 }],
        "resource-summary:stylesheet:size": ["warn", { maxNumericValue: 112640 }],
        "resource-summary:font:size": ["warn", { maxNumericValue: 307200 }],
        "resource-summary:total:count": ["warn", { maxNumericValue: 80 }],
      },
    },
    upload: { target: "filesystem", outputDir: "performance/reports/latest/lhci" },
  },
}
