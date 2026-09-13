// Generate every PWA icon the manifest and the service worker name.
//
// Design (2026-09-13, Abdout): a Claude-orange box with the white feather
// sitting small inside it, clear of the edges — the feather spans ~56% of the
// box, well inside the maskable safe zone, so one artwork serves iOS (which
// rounds the corners itself), Android maskable icons and the browser tab.
// Source of the glyph: public/feather.png (black on transparent, 512²).
//   node scripts/gen-pwa-icons.mjs
import sharp from "sharp"

const ORANGE = "#e8704e" // measured off the reference swatch
const GLYPH = "public/feather.png"
const BOX = 512
const GLYPH_SIZE = Math.round(BOX * 0.56)

// White feather: keep the glyph's alpha, paint every opaque pixel white.
const alpha = await sharp(GLYPH)
  .resize(GLYPH_SIZE, GLYPH_SIZE, { fit: "inside" })
  .ensureAlpha()
  .extractChannel("alpha")
  .toBuffer()
const { width: gw, height: gh } = await sharp(alpha).metadata()
const white = await sharp({
  create: { width: gw, height: gh, channels: 3, background: "#ffffff" },
})
  .joinChannel(alpha)
  .png()
  .toBuffer()

const master = sharp({
  create: { width: BOX, height: BOX, channels: 4, background: ORANGE },
}).composite([{ input: white, gravity: "centre" }])
const masterBuf = await master.png().toBuffer()
await sharp(masterBuf).toFile("public/icon-512.png")
console.log("wrote public/icon-512.png", BOX, `(glyph ${gw}x${gh})`)

const jobs = [
  ["public/icon-72.png", 72, false],
  ["public/icon-96.png", 96, false],
  ["public/icon-192.png", 192, false],
  // iOS composites its own corner radius and refuses transparency — flatten.
  ["public/apple-touch-icon.png", 180, true],
]
for (const [out, size, flatten] of jobs) {
  let img = sharp(masterBuf).resize(size, size, { fit: "cover" })
  if (flatten) img = img.flatten({ background: ORANGE })
  await img.png().toFile(out)
  console.log("wrote", out, size)
}
