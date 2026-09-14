// Capture harness for the forensic watermark.
//
// Plays a real clip under the real VideoWatermark markup (scripts/watermark/
// render.tsx) and produces, for the same frame, a screenshot WITH the mark and
// one WITHOUT, plus a compressed screen recording (Playwright's VP8 WebM —
// the lossy path a leaked recording takes). scripts/watermark/reveal.py then
// measures how visible the mark is and tries to recover the code.
//
// Usage: node scripts/watermark/capture.mjs <mark.html> <video.mp4> <outDir>
import { mkdirSync, readFileSync, readdirSync, renameSync } from "node:fs"
import { join, resolve } from "node:path"
import { chromium } from "@playwright/test"

const [markPath, videoPath, outDir] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const mark = readFileSync(markPath, "utf8")

// Just the utilities the markup uses — the harness has no Tailwind build.
const css = `
  body{margin:0;background:#000}
  .stage{position:relative;width:1280px;height:720px;overflow:hidden;background:#000}
  video{width:100%;height:100%;object-fit:cover;display:block}
  .pointer-events-none{pointer-events:none}.absolute{position:absolute}
  .inset-0{inset:0}.overflow-hidden{overflow:hidden}.z-\\[5\\]{z-index:5}
  .inset-\\[-50\\%\\]{inset:-50%}.grid{display:grid}.content-center{align-content:center}
  .justify-center{justify-content:center}.gap-y-\\[clamp\\(2\\.5rem\\,9vw\\,7rem\\)\\]{row-gap:clamp(2.5rem,9vw,7rem)}
  .font-sans{font-family:system-ui,sans-serif}.font-black{font-weight:900}
  .whitespace-nowrap{white-space:nowrap}.flex{display:flex}
  .gap-x-\\[clamp\\(2rem\\,8vw\\,6rem\\)\\]{column-gap:clamp(2rem,8vw,6rem)}
  body.nomark [data-watermark]{display:none}
`
const html = `<!doctype html><style>${css}</style>
<div class="stage"><video id="v" src="file://${resolve(videoPath)}" muted playsinline></video>${mark}</div>`
const htmlPath = join(outDir, "harness.html")
await import("node:fs").then((fs) => fs.writeFileSync(htmlPath, html))

const browser = await chromium.launch()

// 1. Stills: the same decoded frame with and without the mark.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto(`file://${resolve(htmlPath)}`)
  for (const t of [2, 6, 11]) {
    await page.evaluate(async (time) => {
      const v = document.getElementById("v")
      if (v.readyState < 1) await new Promise((r) => (v.onloadedmetadata = r))
      v.currentTime = time
      await new Promise((r) => (v.onseeked = r))
    }, t)
    await page.evaluate(() => document.body.classList.remove("nomark"))
    await page.screenshot({ path: join(outDir, `still-${t}-mark.png`) })
    await page.evaluate(() => document.body.classList.add("nomark"))
    await page.screenshot({ path: join(outDir, `still-${t}-clean.png`) })
  }
  await page.close()
}

// 2. A compressed recording of playback with the mark on.
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  })
  const page = await context.newPage()
  await page.goto(`file://${resolve(htmlPath)}`)
  await page.evaluate(() => document.getElementById("v").play())
  await page.waitForTimeout(8000)
  await context.close()
  const webm = readdirSync(outDir).find((f) => f.endsWith(".webm") && f !== "recording.webm")
  if (webm) renameSync(join(outDir, webm), join(outDir, "recording.webm"))
}

await browser.close()
console.log("captured to", outDir)
