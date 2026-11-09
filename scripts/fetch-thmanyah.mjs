#!/usr/bin/env node

/**
 * Thmanyah Font Fetcher — خط ثمانية
 *
 * Downloads the Thmanyah 1.2 webfonts from the official specimen site's own
 * asset host into src/fonts/thmanyah/ (git-ignored).
 *
 * WHY FETCH INSTEAD OF COMMIT: the Thmanyah license (font.thmanyah.com/licenses)
 * permits embedding in websites/apps and commercial use, but forbids
 * redistribution — the font may only be downloaded from the official site.
 * kun is a public repo, so the files must never land in git or on a public
 * CDN as raw font files. This script keeps every machine/CI downloading from
 * the source, which is both compliant and self-healing.
 *
 * Runs automatically via predev/prebuild (idempotent — skips files that
 * already exist). A 404 here means Thmanyah shipped a new version: refresh
 * the manifest from the @font-face rules on https://font.thmanyah.com.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, "..", "public", "fonts", "thmanyah")

// Pinned from the @font-face rules on font.thmanyah.com (2026-07-13).
// ORIGINAL generation — the families the specimen site itself typesets with
// (its headlines are "thmanyah serif display" Black + ss01). The "1.2" files
// on the same page are a partial improvement preview (display only ships 400
// there) and do NOT match the site's look; switch only when Thmanyah rolls
// 1.2 out across all weights.
const MANIFEST_VERSION = "original-2026-07-13"
const MANIFEST = {
  "thmanyah-sans-300.woff2":
    "https://framerusercontent.com/assets/Lh8puxCFq405qBv7dKpg9NsHZNk.woff2",
  "thmanyah-sans-400.woff2":
    "https://framerusercontent.com/assets/x6EBzvXf1Fi35XhsRoHxePDVo.woff2",
  "thmanyah-sans-500.woff2":
    "https://framerusercontent.com/assets/oE98mOPE28KTzUeptOLRIaqW1I.woff2",
  "thmanyah-sans-700.woff2":
    "https://framerusercontent.com/assets/LZvgFRUsP7pGWYj3tKxMUrKuhSY.woff2",
  "thmanyah-sans-900.woff2":
    "https://framerusercontent.com/assets/ulQLGTktcl2Qq4AmD6RuVgELZKg.woff2",
  "thmanyah-serif-display-300.woff2":
    "https://framerusercontent.com/assets/zmxf3YlIwMxBTz61cviQtq5n3zU.woff2",
  "thmanyah-serif-display-400.woff2":
    "https://framerusercontent.com/assets/s1q2LvVNWBbqzMxMBxsexY73tE.woff2",
  "thmanyah-serif-display-500.woff2":
    "https://framerusercontent.com/assets/ahIxG21c1088n0jA0bPQBjKu6M.woff2",
  "thmanyah-serif-display-700.woff2":
    "https://framerusercontent.com/assets/AAY5hsAWwWmVC7qlScZUGjzCgE8.woff2",
  "thmanyah-serif-display-900.woff2":
    "https://framerusercontent.com/assets/a9r2dKNoQcqFiTkwxTUnXgAfjws.woff2",
  "thmanyah-serif-text-300.woff2":
    "https://framerusercontent.com/assets/pXAhTrUNoEDB4CTUcjXvXy1gFAc.woff2",
  "thmanyah-serif-text-400.woff2":
    "https://framerusercontent.com/assets/3WPjrTAizPcMoDaKDtKdNB0Jo50.woff2",
  "thmanyah-serif-text-500.woff2":
    "https://framerusercontent.com/assets/bsVNF5mKouPfUJiPWsBKDU324NM.woff2",
  "thmanyah-serif-text-700.woff2":
    "https://framerusercontent.com/assets/L62MixAFhJojtLTRD19wOsCnFg.woff2",
  "thmanyah-serif-text-900.woff2":
    "https://framerusercontent.com/assets/z8brS6Wjld2pvgVBkmzMQpyPO4.woff2",
  // The 1.2 preview files, for the two clone rules that set "… 1.2" families
  // (.trials-row-number, .modern-eyebrow). Hashes matched to the committed
  // copies they replace, 2026-11-09.
  "thmanyah-sans-1.2-300.woff2":
    "https://framerusercontent.com/assets/2MgF2LENj0ar3gdEjyf3HoLd6iw.woff2",
  "thmanyah-sans-1.2-400.woff2":
    "https://framerusercontent.com/assets/Ej0k3h4Mi5O7TSo2w2JaDCPRgvo.woff2",
  "thmanyah-sans-1.2-500.woff2":
    "https://framerusercontent.com/assets/3XGelYpTgxSxBXN4Oieg9Dt3bc.woff2",
  "thmanyah-sans-1.2-700.woff2":
    "https://framerusercontent.com/assets/JUv6rms2ye2kYL3UI3O9YyExQcQ.woff2",
  "thmanyah-serif-display-1.2-400.woff2":
    "https://framerusercontent.com/assets/gUSrlMNsoOIspcnYhQl24uNZZo.woff2",
  "thmanyah-serif-text-1.2-300.woff2":
    "https://framerusercontent.com/assets/3oNNmhaqdwdOlTnrXg8UrU8.woff2",
  "thmanyah-serif-text-1.2-400.woff2":
    "https://framerusercontent.com/assets/pTIPpIhdyoUL1Tl7cDpv1Ze80uQ.woff2",
  "thmanyah-serif-text-1.2-500.woff2":
    "https://framerusercontent.com/assets/oVoRwZKk5rDtzCpYG0Ol1gigl5s.woff2",
  "thmanyah-serif-text-1.2-700.woff2":
    "https://framerusercontent.com/assets/kzVXDC4kJxZgS0rOVcbdPBBC5sw.woff2",
  "thmanyah-serif-text-1.2-900.woff2":
    "https://framerusercontent.com/assets/e1GJ2wtz2b2fMo8i7AbRPck4Qo.woff2",
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  // Generation bump invalidates previously fetched files under the same names.
  const versionFile = path.join(outDir, ".manifest-version")
  const currentVersion = fs.existsSync(versionFile)
    ? fs.readFileSync(versionFile, "utf8").trim()
    : ""
  if (currentVersion !== MANIFEST_VERSION) {
    for (const file of fs.readdirSync(outDir)) {
      if (file.endsWith(".woff2")) fs.unlinkSync(path.join(outDir, file))
    }
    fs.writeFileSync(versionFile, MANIFEST_VERSION)
  }
  const missing = Object.entries(MANIFEST).filter(
    ([file]) => !fs.existsSync(path.join(outDir, file))
  )
  if (!missing.length) {
    console.log(
      `✅ Thmanyah fonts present (${Object.keys(MANIFEST).length} files)`
    )
    return
  }
  console.log(
    `⬇️  Fetching ${missing.length} Thmanyah font file(s) from the official host…`
  )
  let failed = 0
  for (const [file, url] of missing) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      // woff2 magic: wOF2
      if (buf.subarray(0, 4).toString("ascii") !== "wOF2")
        throw new Error("not a woff2 file")
      fs.writeFileSync(path.join(outDir, file), buf)
      console.log(`  ✓ ${file} (${(buf.length / 1024).toFixed(0)} KB)`)
    } catch (err) {
      failed++
      console.error(`  ✗ ${file}: ${err.message}`)
    }
  }
  if (failed) {
    console.error(
      `❌ ${failed} file(s) failed — Thmanyah may have shipped a new version; refresh MANIFEST from the @font-face rules on https://font.thmanyah.com`
    )
    process.exit(1)
  }
  console.log("✅ Thmanyah fonts ready")
}

main()
