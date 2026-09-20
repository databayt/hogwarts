/**
 * Rasterise a designed textbook cover (Figma export) to the shipped `cover.jpg`.
 *
 * The covers arrive as Figma SVG exports — one frame, a flat background and a
 * single embedded base64 raster, no text (the app prints stage/title/grade over
 * the board's free head). Biology's was done by hand on 2026-09-07; this is that
 * recipe, committed.
 *
 *   SVG -> headless Chromium at 2x -> sharp lanczos3 down -> JPEG q82 4:4:4
 *
 * Chromium rather than sharp's own SVG path: a Figma export leans on clip-paths
 * and a pattern fill, and librsvg renders those differently.
 *
 * Usage:
 *   node scripts/catalog/render-cover.mjs --in=<file.svg|file.png> --out=<file.jpg>
 *                                         [--width=1000] [--quality=82]
 *
 * The output is `--width` x round(width / frameRatio), so the frame's own ratio
 * is kept and nothing is cropped (the exports are 2669x3691 = the 1000x1383
 * target ratio already).
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, extname } from "node:path"

import { chromium } from "@playwright/test"
import sharp from "sharp"

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const IN = arg("in")
const OUT = arg("out")
const WIDTH = Number(arg("width", "1000"))
const QUALITY = Number(arg("quality", "82"))
// Render at 2x and resample down: the embedded rasters are ~1000 px, so going
// much above this only blurs, and going below loses the line art's edges.
const SUPERSAMPLE = 2

if (!IN || !OUT) {
  console.error("--in=<file.svg|file.png> and --out=<file.jpg> are required")
  process.exit(1)
}

/** The frame's intrinsic size, off the root <svg> element's own attributes. */
function frameSize(svg) {
  const w = Number(/\bwidth="(\d+(?:\.\d+)?)"/.exec(svg)?.[1])
  const h = Number(/\bheight="(\d+(?:\.\d+)?)"/.exec(svg)?.[1])
  if (!w || !h) throw new Error(`${IN}: no width/height on the root <svg>`)
  return { w, h }
}

async function rasterise() {
  if (extname(IN).toLowerCase() !== ".svg") return readFile(IN)

  const svg = await readFile(IN, "utf8")
  const { w, h } = frameSize(svg)
  const height = Math.round((WIDTH * h) / w)
  const renderW = WIDTH * SUPERSAMPLE
  const renderH = height * SUPERSAMPLE

  // The SVG is self-contained (its raster is a base64 data URI), so inlining it
  // sidesteps file:// subresource loading entirely.
  const sized = svg.replace(
    /^(\s*<svg\b[^>]*?)\swidth="[^"]*"\s+height="[^"]*"/,
    `$1 width="${renderW}" height="${renderH}"`
  )

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: renderW, height: renderH },
    })
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#fff">${sized}</body></html>`,
      { waitUntil: "load" }
    )
    return await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: renderW, height: renderH },
    })
  } finally {
    await browser.close()
  }
}

const raw = await rasterise()
const meta = await sharp(raw).metadata()
const height = Math.round((WIDTH * meta.height) / meta.width)

await mkdir(dirname(OUT), { recursive: true })
const jpeg = await sharp(raw)
  .resize(WIDTH, height, { kernel: "lanczos3" })
  .jpeg({
    quality: QUALITY,
    // 4:4:4 — line art bleeds badly at 4:2:0.
    chromaSubsampling: "4:4:4",
    progressive: true,
  })
  .toBuffer()
await writeFile(OUT, jpeg)

console.log(
  `${IN} -> ${OUT}  ${WIDTH}x${height}  ${(jpeg.length / 1024).toFixed(0)} KB`
)
