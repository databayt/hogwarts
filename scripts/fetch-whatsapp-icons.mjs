import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const OUTPUT_DIR = join(__dirname, "..", "public", "icons", "whatsapp")

const ASSET = (uuid) => `https://www.figma.com/api/mcp/asset/${uuid}`

const ICONS = {
  "ic-wa-lock-12": ASSET("014eef1e-2daf-4679-b4b3-2375f3d80bff"),
  "ic-wa-disappearing-16": ASSET("31f9292b-5987-4131-b644-8dad5c63704e"),
  "ic-wa-pin-16": ASSET("1f0a991e-d51f-4600-a30b-a2792e02ad7d"),
  "ic-wa-archived-24": ASSET("2a607511-76c1-4ccd-86e1-46dee34e7495"),
  "ic-wa-plus-filter-24": ASSET("d8e4588a-9509-4816-9935-4593a607a1c3"),
  "ic-wa-meetball-24": ASSET("7bfc139c-ee60-47a8-b4d9-c5e2973be9b4"),
  "ic-wa-camera-24": ASSET("009b6045-5ae5-4b20-ab76-f52db2ecd767"),
  "ic-wa-plus-add-24": ASSET("31ba1e77-9927-40e0-afca-b6ac81405d6b"),
  "ic-wa-search-24": ASSET("c4890b24-0876-47ac-818b-0c9a8da411f1"),
  "ic-wa-check-read-19": ASSET("a5d3d52f-c63c-4c33-acfb-47147ee504a8"),
  "ic-wa-check-sent-19": ASSET("58956d2d-5b5a-41b9-a63f-c91b7bad13d3"),
  "ic-wa-voice-16": ASSET("62fe17bb-f235-4d3c-9505-273a3f5ea225"),
  "ic-wa-deleted-16": ASSET("194005df-593e-4bba-98a2-6ee1b877850b"),
  "ic-wa-location-16": ASSET("33919608-6607-43df-95f1-089132b8669b"),
  "ic-wa-group-16": ASSET("97e9ddb0-ba6e-4bb9-9678-23a02c31bc19"),
  "ic-wa-tab-updates-32": ASSET("9add81f4-7e80-42c8-92fc-c10d5fac51f7"),
  "ic-wa-tab-calls-32": ASSET("8a40b55a-44f8-4c8a-87f5-f14fe2524e74"),
  "ic-wa-tab-communities-32": ASSET("b5be8739-25b2-4d35-90fd-153fad7f52ac"),
  "ic-wa-tab-chats-32": ASSET("ead5911e-1bff-4b1a-a631-ebaf3737ebcd"),
  "ic-wa-tab-settings-32": ASSET("c1908667-dad0-4dae-8adf-5793ea7d8a84"),
  "ic-wa-meta-ai-circle": ASSET("51eaa736-846c-46f4-a34f-3d05daf2c8e5"),
  "ic-wa-updates-ring-full": ASSET("cb4332d4-cbd9-4e27-982f-07b3e8e75ef6"),
  "ic-wa-updates-ring-right": ASSET("7e99ea64-f2c5-4060-bf0f-593e461bd59d"),
  "ic-wa-updates-ring-left": ASSET("7ec22e50-aac7-4e22-94e5-3355faae1165"),
  "ic-wa-updates-ring-top": ASSET("bd2f78be-fb01-4779-8cc2-27e197be586a"),
  "ic-wa-updates-ring-bottom": ASSET("2726963a-68fe-45cb-a560-0775a2d83af0"),
  "ic-wa-updates-ring-quarter": ASSET("1ec193dd-273b-4ee7-8b42-9d2484740d9b"),
  "ic-wa-status-cellular": ASSET("11f49008-c9b1-468b-ac76-0c3dc2805a1a"),
  "ic-wa-status-wifi": ASSET("d6c58a43-2bca-452b-a895-490759d4c56e"),
  "ic-wa-status-battery": ASSET("829fa83a-3ab5-4785-b936-27fead85df31"),
  "pic-wa-sample-jenny": ASSET("804fbcfa-f1ff-492a-bdf5-33fbbbb185f1"),
  "pic-wa-sample-mom": ASSET("867e58d4-2289-4673-8bda-8cd59d63d69a"),
  "pic-wa-sample-daddy": ASSET("64f67dd0-c3c2-41a4-8b6d-1f93f780509e"),
  "pic-wa-sample-biff": ASSET("f2f098f1-681d-4d1b-9dd3-c5129e3341cf"),
  "pic-wa-sample-clocktower": ASSET("546b39b2-9458-43d1-8ec4-440a321dac0f"),
  "pic-wa-sample-strickland": ASSET("5f304f37-1d46-4150-8d4e-d766741f9e94"),
  "pic-wa-sample-doc": ASSET("0d17b74f-2d98-4ded-a299-bb81bece3055"),
  "pic-wa-sample-dave": ASSET("e94bb5ee-9f31-4deb-9d66-1d9dbbe90fdc"),
  "pic-wa-sample-lynda": ASSET("30c78525-6a79-4537-a0df-c9328812962f"),
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
  ) {
    ext = "svg"
  } else if (
    contentType.includes("png") ||
    buf.slice(0, 4).toString("hex") === "89504e47"
  ) {
    ext = "png"
  } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    ext = "jpg"
  } else if (contentType.includes("webp")) {
    ext = "webp"
  }

  const path = join(OUTPUT_DIR, `${name}.${ext}`)
  await writeFile(path, buf)
  return { path, ext, size: buf.length }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const entries = Object.entries(ICONS)
  console.log(`Fetching ${entries.length} WhatsApp assets → ${OUTPUT_DIR}\n`)

  let ok = 0,
    fail = 0
  const summary = []

  for (const [name, url] of entries) {
    try {
      const { ext, size } = await download(name, url)
      console.log(`  ✓ ${name}.${ext}  (${(size / 1024).toFixed(1)} KB)`)
      summary.push({ name, ext, size })
      ok++
    } catch (e) {
      console.log(`  ✗ ${name}  ${e.message}`)
      fail++
    }
  }

  await writeFile(
    join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(
      { generated: new Date().toISOString(), count: ok, assets: summary },
      null,
      2
    )
  )

  console.log(`\n${ok} ok / ${fail} failed`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
