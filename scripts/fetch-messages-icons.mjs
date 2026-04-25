import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const OUTPUT_DIR = join(__dirname, "..", "public", "icons", "whatsapp")

const ASSET = (uuid) => `https://www.figma.com/api/mcp/asset/${uuid}`

const ICONS = {
  "ic-wa-chevron-lt-32": ASSET("9f73de96-8744-45e7-8631-025d5a3af560"),
  "ic-wa-video-32": ASSET("e8ba8628-d6f6-4455-9a55-2cb9b1cc0119"),
  "ic-wa-phone-32": ASSET("a9c38a3a-fb99-4b81-8b1c-8f7020aad8d0"),
  "ic-wa-plus-input-32": ASSET("2c84f04f-a34b-4b05-b772-c40f76bf8974"),
  "ic-wa-sticker-24": ASSET("13f705f5-a2fc-4964-a358-b4033d377e1b"),
  "ic-wa-camera-small-32": ASSET("ff50e012-e0a0-471c-88e3-a8c175005012"),
  "ic-wa-mic-32": ASSET("7e2059ea-b8f2-4488-9bdb-cdfc76f3c167"),
  "ic-wa-bubble-tail": ASSET("0c738e78-440a-4d79-870e-04733b852d0f"),
  "ic-wa-bubble-tail-mask": ASSET("aab09af1-f701-447e-bae7-62d748a9773e"),
  "ic-wa-bubble-tail-fill": ASSET("cc771166-ba40-453f-9a14-59b59a268b2e"),
  "ic-wa-check-bubble-17": ASSET("41495059-429c-42bd-87a0-75a014dd29f7"),
  "pic-wa-contact-doc": ASSET("263612c1-2294-4069-9ba2-5bd3d5360b60"),
}

async function download(name, url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}`)
  const contentType = res.headers.get("content-type") || ""
  const buf = Buffer.from(await res.arrayBuffer())
  let ext = "bin"
  if (
    contentType.includes("svg") ||
    buf.slice(0, 5).toString("utf8").includes("<svg") ||
    buf.slice(0, 5).toString("utf8").includes("<?xml")
  )
    ext = "svg"
  else if (
    contentType.includes("png") ||
    buf.slice(0, 4).toString("hex") === "89504e47"
  )
    ext = "png"
  else if (contentType.includes("jpeg") || contentType.includes("jpg"))
    ext = "jpg"
  else if (contentType.includes("webp")) ext = "webp"
  await writeFile(join(OUTPUT_DIR, `${name}.${ext}`), buf)
  return { ext, size: buf.length }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const entries = Object.entries(ICONS)
  console.log(`Fetching ${entries.length} messages assets → ${OUTPUT_DIR}\n`)
  let ok = 0,
    fail = 0
  for (const [name, url] of entries) {
    try {
      const { ext, size } = await download(name, url)
      console.log(`  ✓ ${name}.${ext}  (${(size / 1024).toFixed(1)} KB)`)
      ok++
    } catch (e) {
      console.log(`  ✗ ${name}  ${e.message}`)
      fail++
    }
  }
  console.log(`\n${ok} ok / ${fail} failed`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
