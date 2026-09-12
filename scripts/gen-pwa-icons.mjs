// Generate every PWA icon the manifest and the service worker name, from the
// 512 master. Run once after changing public/icon-512.png:
//   node scripts/gen-pwa-icons.mjs
import sharp from "sharp"

const master = "public/icon-512.png"
const jobs = [
  ["public/icon-72.png", 72, false],
  ["public/icon-96.png", 96, false],
  ["public/icon-192.png", 192, false],
  // iOS composites its own corner radius and refuses transparency — flatten.
  ["public/apple-touch-icon.png", 180, true],
]
for (const [out, size, flatten] of jobs) {
  let img = sharp(master).resize(size, size, { fit: "cover" })
  if (flatten) img = img.flatten({ background: "#ffffff" })
  await img.png().toFile(out)
  console.log("wrote", out, size)
}
