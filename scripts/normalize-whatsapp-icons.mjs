import { readdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DIR = join(__dirname, "..", "public", "icons", "whatsapp")

function normalize(svg, name) {
  let out = svg

  out = out.replace(
    /fill="var\(--fill-\d+,\s*#[0-9A-Fa-f]{3,8}\)"/g,
    'fill="currentColor"'
  )

  out = out.replace(/preserveAspectRatio="none"/g, "")
  out = out.replace(/\swidth="100%"/g, "")
  out = out.replace(/\sheight="100%"/g, "")
  out = out.replace(/\soverflow="visible"/g, "")
  out = out.replace(/\sstyle="display:\s*block;?"/g, "")

  out = out.replace(/\sid="Ico"/g, "")

  out = out.replace(/\s+>/g, ">").replace(/\s{2,}/g, " ")
  out = out.trim() + "\n"

  return out
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".svg"))
  let changed = 0
  for (const f of files) {
    const path = join(DIR, f)
    const original = await readFile(path, "utf8")
    const next = normalize(original, f)
    if (next !== original) {
      await writeFile(path, next)
      changed++
    }
  }
  console.log(`Normalized ${changed} / ${files.length} SVGs`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
