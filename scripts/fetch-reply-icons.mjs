import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "public", "icons", "whatsapp")
const ASSET = (uuid) => `https://www.figma.com/api/mcp/asset/${uuid}`

const ICONS = {
  "ic-wa-close-circular-24": ASSET("81a18799-2401-4187-8d2f-a8d9660a93da"),
  "ic-wa-send-24": ASSET("49b88e00-bc58-43f5-89b0-18ecdcf5dc95"),
}

async function download(name, url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const head = buf.slice(0, 5).toString("utf8")
  const ext =
    head.includes("<svg") || head.includes("<?xml")
      ? "svg"
      : buf.slice(0, 4).toString("hex") === "89504e47"
        ? "png"
        : "bin"
  await writeFile(join(OUT, `${name}.${ext}`), buf)
  return { ext, size: buf.length }
}

await mkdir(OUT, { recursive: true })
for (const [n, u] of Object.entries(ICONS)) {
  const { ext, size } = await download(n, u)
  console.log(`  ✓ ${n}.${ext} (${(size / 1024).toFixed(1)} KB)`)
}
