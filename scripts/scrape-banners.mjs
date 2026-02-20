/**
 * Scrape all 62 ClickView subject banner IDs using Playwright,
 * then download each banner at 2048px via the ClickView image API.
 *
 * Usage: node scripts/scrape-banners.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs"
import https from "https"
import { join } from "path"
import { chromium } from "playwright"

const SUBJECTS_PATH = join(
  import.meta.dirname,
  "clickview-data/complete-subjects.json"
)
const BANNERS_DIR = join(import.meta.dirname, "../public/clickview/banners")
const OUTPUT_JSON = join(import.meta.dirname, "clickview-data/banner-ids.json")

const BASE_URL = "https://www.clickview.net"
const BANNER_API =
  "https://img.clickviewapp.com/v2/banners/{id}?width=2048&ratio=1200%3A222&resizeType=2"

// Parse the background-image URL to extract the banner ID
function extractBannerId(bgImage) {
  // url("https://img.clickviewapp.com/v2/banners/9DNoG6?width=...")
  const match = bgImage.match(/\/v2\/banners\/([^?/]+)/)
  return match ? match[1] : null
}

// Download a file from URL to disk
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const makeRequest = (reqUrl) => {
      https.get(reqUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          makeRequest(response.headers.location)
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${reqUrl}`))
          return
        }
        const chunks = []
        response.on("data", (chunk) => chunks.push(chunk))
        response.on("end", () => {
          writeFileSync(dest, Buffer.concat(chunks))
          resolve()
        })
        response.on("error", reject)
      })
    }
    makeRequest(url)
  })
}

async function main() {
  const data = JSON.parse(readFileSync(SUBJECTS_PATH, "utf-8"))
  mkdirSync(BANNERS_DIR, { recursive: true })

  const levels = ["elementary", "middle", "high"]
  const allSubjects = []
  for (const level of levels) {
    for (const subject of data[level]) {
      allSubjects.push({ ...subject, level })
    }
  }

  console.log(`Total subjects: ${allSubjects.length}`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 2048, height: 1200 },
  })

  const bannerIds = {}
  const errors = []

  // Process in parallel batches of 4 pages
  const BATCH_SIZE = 4

  for (let i = 0; i < allSubjects.length; i += BATCH_SIZE) {
    const batch = allSubjects.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (subject) => {
      const key = `${subject.level}-${subject.slug}`
      const url = `${BASE_URL}${subject.href}`

      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
        await page.waitForTimeout(2000)

        // Find the banner header element with background-image
        const bannerEl = page.locator(
          '[style*="background-image"][class*="banner"]'
        )
        const count = await bannerEl.count()

        if (count === 0) {
          // Fallback: look for any element with banner background
          const fallback = page.locator("header.banner")
          const fallbackCount = await fallback.count()
          if (fallbackCount > 0) {
            const bgImg = await fallback
              .first()
              .evaluate((el) => getComputedStyle(el).backgroundImage)
            const id = extractBannerId(bgImg)
            if (id) {
              bannerIds[key] = {
                bannerId: id,
                level: subject.level,
                slug: subject.slug,
                name: subject.name,
              }
              console.log(
                `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: ${id}`
              )
            } else {
              errors.push({ key, error: "No banner ID in fallback background" })
              console.log(
                `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: NO BANNER ID (fallback)`
              )
            }
          } else {
            errors.push({ key, error: "No banner element found" })
            console.log(
              `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: NO BANNER ELEMENT`
            )
          }
        } else {
          const bgImg = await bannerEl
            .first()
            .evaluate((el) => getComputedStyle(el).backgroundImage)
          const id = extractBannerId(bgImg)
          if (id) {
            bannerIds[key] = {
              bannerId: id,
              level: subject.level,
              slug: subject.slug,
              name: subject.name,
            }
            console.log(
              `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: ${id}`
            )
          } else {
            errors.push({ key, error: "No banner ID in background" })
            console.log(
              `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: NO BANNER ID`
            )
          }
        }
      } catch (err) {
        errors.push({ key, error: err.message })
        console.log(
          `  [${i + batch.indexOf(subject) + 1}/${allSubjects.length}] ${key}: ERROR - ${err.message}`
        )
      } finally {
        await page.close()
      }
    })

    await Promise.all(promises)
  }

  await browser.close()

  // Save banner IDs
  writeFileSync(OUTPUT_JSON, JSON.stringify(bannerIds, null, 2))
  console.log(
    `\nSaved ${Object.keys(bannerIds).length} banner IDs to ${OUTPUT_JSON}`
  )

  if (errors.length > 0) {
    console.log(`\n${errors.length} errors:`)
    for (const e of errors) {
      console.log(`  ${e.key}: ${e.error}`)
    }
  }

  // Download all banners
  console.log(
    `\nDownloading ${Object.keys(bannerIds).length} banners at 2048px...`
  )

  let downloaded = 0
  let dlErrors = 0

  for (const [key, info] of Object.entries(bannerIds)) {
    const url = BANNER_API.replace("{id}", info.bannerId)
    const dest = join(BANNERS_DIR, `${key}.jpg`)

    try {
      await downloadFile(url, dest)
      downloaded++
      if (downloaded % 10 === 0) {
        console.log(
          `  Downloaded ${downloaded}/${Object.keys(bannerIds).length}`
        )
      }
    } catch (err) {
      dlErrors++
      console.log(`  DOWNLOAD ERROR ${key}: ${err.message}`)
    }
  }

  console.log(`\nDone! Downloaded ${downloaded} banners, ${dlErrors} errors.`)
}

main().catch(console.error)
