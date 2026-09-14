// Renders the real VideoWatermark to static markup for the capture harness.
// Usage: pnpm exec tsx scripts/watermark/render.tsx <userId> <email> > mark.html
import { renderToStaticMarkup } from "react-dom/server"

import { VideoWatermark } from "../../src/components/lumos/shared/video-player/video-watermark"

const [userId = "cmtp5d31g042f8osfuasp2ul7", email = "student@balqalam.com"] =
  process.argv.slice(2)

process.stdout.write(
  renderToStaticMarkup(<VideoWatermark userId={userId} userEmail={email} />)
)
