#!/usr/bin/env tsx
/**
 * Anthropic Asset Upload Script
 *
 * Downloads assets from Anthropic CDNs and uploads to our S3 bucket
 * under the `anthropic/` prefix, served via CloudFront.
 *
 * Idempotent: skips files already in S3 (HeadObject check).
 *
 * Usage:
 *   pnpm tsx scripts/upload-anthropic-assets.ts          # dry run
 *   pnpm tsx scripts/upload-anthropic-assets.ts --upload  # download + upload
 *   pnpm tsx scripts/upload-anthropic-assets.ts --manifest # output JSON manifest
 */
import "dotenv/config"

import { writeFileSync } from "fs"
import { join } from "path"
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------

const MIME_MAP: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
  json: "application/json",
  pdf: "application/pdf",
  mp4: "video/mp4",
  wav: "audio/wav",
  woff2: "font/woff2",
  ttf: "font/ttf",
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BUCKET = process.env.AWS_S3_BUCKET || "hogwarts-databayt"
const REGION = process.env.AWS_REGION || "us-east-1"
const CACHE_CONTROL = "public, max-age=31536000, immutable"

// ---------------------------------------------------------------------------
// Asset manifest: source URL → S3 key
//
// S3 structure: anthropic/{category}/{filename}.{ext}
// ---------------------------------------------------------------------------

const ASSETS: Record<string, string> = {
  // ── Brand & Logos ─────────────────────────────────────────────────────
  "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg":
    "anthropic/brand/anthropic-wordmark.svg",
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg":
    "anthropic/brand/claude-wordmark.svg",
  "https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg":
    "anthropic/brand/claude-starburst.svg",
  "https://claude.ai/favicon.svg": "anthropic/brand/claude-favicon.svg",
  "https://claude.ai/apple-touch-icon.png":
    "anthropic/brand/claude-apple-touch-icon.png",
  "https://claude.ai/favicon-32x32.png":
    "anthropic/brand/claude-favicon-32.png",
  "https://claude.ai/images/claude_ogimage.png":
    "anthropic/brand/claude-og-image.png",
  "https://www.anthropic.com/images/icons/safari-pinned-tab.svg":
    "anthropic/brand/safari-pinned-tab.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/67d47b4c03b69d41f28cc15c_logo-lottie.json":
    "anthropic/brand/logo-lottie.json",
  "https://dka575ofm4ao0.cloudfront.net/pages-transactional_logos/retina/362807/NEW_claude_status_banner-183284a4-558d-4835-b3a4-a601e0a4daa8.png":
    "anthropic/brand/claude-status-banner.png",

  // Model wordmarks
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/cf1dd2167fcf12f5882333ddc58a5bc1f0026952-897x109.svg":
    "anthropic/brand/opus-4-6-wordmark-desktop.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/f880761f78784d4e468e6d6f0a8ccc96f88765f4-217x153.svg":
    "anthropic/brand/opus-4-6-wordmark-mobile.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/74d815931ecf4f5b94b2286e7880111df24201de-1680x166.svg":
    "anthropic/brand/sonnet-4-6-wordmark-desktop.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/1199923fafdbe19ee2a20164da1e1530c6256607-258x142.svg":
    "anthropic/brand/sonnet-4-6-wordmark-mobile.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/010a454678ca41505a40660f56af507bec9461ed-941x95.svg":
    "anthropic/brand/haiku-4-5-wordmark-desktop.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/7b47432bfe62bdc19ba2559d70b9de5bd6229db0-238x142.svg":
    "anthropic/brand/haiku-4-5-wordmark-mobile.svg",

  // ── Illustrations (1000x1000 SVGs) ────────────────────────────────────
  "https://cdn.sanity.io/images/4zrzovbb/website/46e4aa7ea208ed440d5bd9e9e3a0ee66bc336ff1-1000x1000.svg":
    "anthropic/illustrations/hand-head-node-think.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/1c3e87fd90491089b2971dc34f9f75bb8a80f713-1000x1000.svg":
    "anthropic/illustrations/code-magnifier.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/60a35c504cedb3e3f581b211e4b8aef372ffe031-1000x1000.svg":
    "anthropic/illustrations/node-head-constellation.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/ac2fa660649f361111949b32136a308ef35b6864-1000x1000.svg":
    "anthropic/illustrations/hourglass-cosmic.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/1576ae23eaf481f33bd36ab468171cc69d12361a-1000x1000.svg":
    "anthropic/illustrations/hand-node-line.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/9f6a378a1e3592cf8d27447457409ba12284faef-1000x1000.svg":
    "anthropic/illustrations/hand-node-pair.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/c1ef4c0b6882dfe985555b52999d370ea88a3c50-1000x1000.svg":
    "anthropic/illustrations/hand-node-graph.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/6b1470e7fa2fb7280502291f204b88c412690076-1000x1000.svg":
    "anthropic/illustrations/node-branch.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/e69f9d8245799a0c2688d72e997f708475233d6b-1000x1000.svg":
    "anthropic/illustrations/node-constitution.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/f06ca06f9d08ca4a85f26357eb896c3730274507-1000x1000.svg":
    "anthropic/illustrations/hand-abacus.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/77dd9077412abc790bf2bc6fa3383b37724d6305-1000x1000.svg":
    "anthropic/illustrations/lamp-paper.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/710b64c2542329ce05316098b4e405bb1c11e4d4-1000x1000.svg":
    "anthropic/illustrations/hand-reflection.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/83d7d2fe412ceb4dfe627f0d5f3d64aff1a3f5db-1000x1000.svg":
    "anthropic/illustrations/hand-keyboard.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/1c3d1af62032009538b8bf5864139ca124b06741-1000x1000.svg":
    "anthropic/illustrations/hand-node-book.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/036c01a9e427ea0f4d1e6c7221e4f6dce2259bf7-1000x1000.svg":
    "anthropic/illustrations/hand-key.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/cd4fd51deacd067d4e30aee4f4b149f6cba1b97b-1000x1000.svg":
    "anthropic/illustrations/hand-build.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/0df729ce74e4c9dd62c3342c9549ce6c7cef1202-1000x1000.svg":
    "anthropic/illustrations/hand-puzzle.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/e750c875fbd7f08ffb6495efa180a8ed60de3611-1000x1000.svg":
    "anthropic/illustrations/node-box.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/97cf99624aa60f59b75f9e08cdf0f00d33c34804-1000x1000.svg":
    "anthropic/illustrations/scale-shapes.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/74409af25137110ac04cc39e4d5ea0a2fbcea421-1000x1000.svg":
    "anthropic/illustrations/hand-node-tree.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/8d339ae8ecedecc1409db8f5bbb99c958db56946-1000x1000.svg":
    "anthropic/illustrations/chat.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/6507d83d1197bb8630131d363fb8bea838d79ca7-1000x1000.svg":
    "anthropic/illustrations/hand-node-slide.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/43abe7e54b56a891e74a8542944dfbd33f07f49c-1000x1000.svg":
    "anthropic/illustrations/puzzle.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/5f455d24ea80569b34eb4347f06152d8a5508722-1000x1000.svg":
    "anthropic/illustrations/node-globe.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/cd9cf56a7f049285b7c1c8786c0a600cf3d7f317-1000x1000.svg":
    "anthropic/illustrations/hand-house.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/6905c83d0735e1bc430025fdd1748d1406079036-1000x1000.svg":
    "anthropic/illustrations/hand-shape-build.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/589b94b913c4cee1c3c1ce2cb04f638d09c465b1-1000x1000.svg":
    "anthropic/illustrations/object-desktop-balance.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/9dc697ebe294bef5961c93928128a9b561fc1f66-1000x1000.svg":
    "anthropic/illustrations/object-book.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/b68cbb43d7c8f56f0b14cc867e8d4d74445f78b0-1000x1000.svg":
    "anthropic/illustrations/hand-globe.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/8925ac952fa2cb8eb5e845b2e44f3e71b33fd695-1000x1000.svg":
    "anthropic/illustrations/node-cursor.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/33dbe8f783d4835a838b4c4ae85d3c04e352fee1-1000x1000.svg":
    "anthropic/illustrations/hand-quill.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/e029027e0b3beeb5b629bd4a26143597e7775b38-1000x1000.svg":
    "anthropic/illustrations/object-lock.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/802260d34a0653f23fd4944fae43064df367aa44-1000x1000.svg":
    "anthropic/illustrations/object-laptop-secure.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/6e00dbffcddc82df5e471c43453abfc74ca94e8d-1000x1000.svg":
    "anthropic/illustrations/object-government.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/ffc0d7957a232518519f13c0d64896921ea215e2-1000x1000.svg":
    "anthropic/illustrations/object-globe-detailed.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/a62b6eb169818f14c35b7a192af269e283f8fa93-1000x1000.svg":
    "anthropic/illustrations/hand-shape-arrow.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/e44a6b53398f189b9fd0d4f70516db614ac84db3-1000x1000.svg":
    "anthropic/illustrations/hand-bar-chart.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/f8f4644253bde2f901550431b871b6dcf91e5d9d-1000x1000.svg":
    "anthropic/illustrations/hand-head-node.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/423062049d4676b41d52b16068cbb5e21603190e-1000x1000.svg":
    "anthropic/illustrations/hand-book.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/d6058e0db8e477dc782dacae46e2ec6663d165d9-1000x1000.svg":
    "anthropic/illustrations/object-double-helix.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/c9d8dd2af6d065e1ace8bd4bb29c716eb53ffffb-1000x1000.svg":
    "anthropic/illustrations/hand-telescope.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/6457c34fbcb012acf0f27f15a6006f700d0f50de-1000x1000.svg":
    "anthropic/illustrations/hand-head-bolt.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/225a673c4c38ae4b0d89639836c93b27e363f185-1000x1000.svg":
    "anthropic/illustrations/object-code-chat.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/a5be087781bd5c60788beba7d8148d147bc4d0ed-1000x1000.svg":
    "anthropic/illustrations/object-heartbeat.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/3e4133edf828c818931bcfb6433836d0e6f21e4a-1300x1241.svg":
    "anthropic/illustrations/transparency-hub-hero.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/87fb2c684ff3d95b4fa9edf208af33f467a8af5b-1000x1000.svg":
    "anthropic/illustrations/rsp-policy-badge.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/928166e443bc1b1f19ebadf4fd11b7c45fce4153-1000x1000.svg":
    "anthropic/illustrations/notebook-pages.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/a542a6657627a5e114365ca69168490c5e8b0443-1000x1000.svg":
    "anthropic/illustrations/constitution-icon.svg",

  // ── Company Values ────────────────────────────────────────────────────
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/39db33950eb113e504a5b9fc56db490a64673e96-1000x1000.svg":
    "anthropic/values/hold-light-and-shade.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/3da76509c888ac18be74e3e9dc0752c66d1a8202-1000x1000.svg":
    "anthropic/values/be-good-to-users.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/b1ce510c468b2920d4f8f61c17a50906801f939a-1000x1000.svg":
    "anthropic/values/race-to-the-top.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/60d39963d844bc1104a780c762c540c9ba1baefe-1000x1000.svg":
    "anthropic/values/put-mission-first.svg",

  // ── Engineering Blog SVGs ─────────────────────────────────────────────
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/d428d11fcf4123ff0d0859d03fba459ad4d3d01a-2554x2554.svg":
    "anthropic/engineering/infrastructure-noise.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/b87185e4d533134bc3f9b949a874396dcfcb2e80-500x500.svg":
    "anthropic/engineering/claude-code-auto-mode.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/af0acebfbd57ac4b26ae7d7ae124d7326a3e47e4-1200x1200.svg":
    "anthropic/engineering/harness-design.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/641d32b3291956d595c7e820d5bf94c5f44baa28-500x500.svg":
    "anthropic/engineering/browsecomp-eval.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/44e93e074d53285f64ff717365b04c4a2164a445-1200x1200.svg":
    "anthropic/engineering/c-compiler.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/dc34c3eeae881b105ef652d5630d84de6a1fa01a-1200x1200.svg":
    "anthropic/engineering/ai-resistant-evaluations.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/2aa849e93e76ae567502dcae2db8921062531fa1-500x500.svg":
    "anthropic/engineering/advanced-tool-use.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/848e961961a97ada3a7edb2d1d17378792c3288d-500x500.svg":
    "anthropic/engineering/mcp-code-execution.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/33d37e1ae729f4e960d11fecf143ac14c0fb369d-500x500.svg":
    "anthropic/engineering/claude-code-sandboxing.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/c041b5e0498972014414a7c3d044727982f26bde-500x500.svg":
    "anthropic/engineering/effective-harnesses.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/a048404a96b599af98c05da5bdd1db07222e4e7b-500x500.svg":
    "anthropic/engineering/context-engineering.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/b4fe0845239779c6fc1e045edb6272c3f500944a-500x500.svg":
    "anthropic/engineering/writing-tools-for-agents.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/dde35f184e14e5c37b0b3ab5a1c0bbad06ac123b-500x500.svg":
    "anthropic/engineering/desktop-extensions.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/c423cdaa6733c03a5d10f38c76e1ecf1900c6716-1200x1200.svg":
    "anthropic/engineering/claude-code-best-practices.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/461ea9ed02230ba02ab830e5a5b23df66ea23bc8-1200x1200.svg":
    "anthropic/engineering/think-tool.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/ef693b8c4ebfcead4e17af7bd87b66f8bc70b8cc-1200x1200.svg":
    "anthropic/engineering/swe-bench-sonnet.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/14b20fce6e93c79be47352da0fa4bebd597ebfa8-1200x1200.svg":
    "anthropic/engineering/building-effective-agents.svg",

  // ── Partner Logos ─────────────────────────────────────────────────────
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/ff1601aa704506064c9ddee37079f17f9b0799cd-150x48.svg":
    "anthropic/partners/replit.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/6d031c0893b24dd00e9f207c7635d6b91d809729-124x24.svg":
    "anthropic/partners/asana.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/7cfef6cd8ce2515a6abd52560ac4189f89f9ad35-116x40.svg":
    "anthropic/partners/notion.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/da50e4c43d4b95fe1a2105c344050c6ba2397f3f-150x48.svg":
    "anthropic/partners/cognition.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/d74b2a5f8dc7d22b0febb8c69feabff0999da79d-151x36.svg":
    "anthropic/partners/cursor.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/501ebc6538c68e98ae6cfab79a5747009700f4a1-100x30.svg":
    "anthropic/partners/harvey.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/652c487024ae6e67508571e7e5f64b7d482bdadd-150x48.svg":
    "anthropic/partners/rakuten.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/96f4d2262959c4c1ecdc9dc2d93b9087115d789f-140x26.svg":
    "anthropic/partners/lovable.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/ade72922c1b58726e1b7c17f0e500054e3d74aa0-92x37.svg":
    "anthropic/partners/bolt.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/1919e4705bd67f47c2f5bfe4950d0d2969dfaf4d-118x32.svg":
    "anthropic/partners/ramp.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/6e6ecfcd7c8ed79ef1c46cc27c4ecc4ab1ca7490-219x42.svg":
    "anthropic/partners/sentinelone.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/7522fc92399dcb4a68f11c7e147e711fcadbe75b-126x36.svg":
    "anthropic/partners/github.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/db59fdbf8e7fa64d1bfcafecb933917ccd33f79a-140x34.svg":
    "anthropic/partners/palantir.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/ff031ea5953adc10e50782ff6c8124ad6ce28ba6-213x31.svg":
    "anthropic/partners/thomson-reuters.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/eba077a5df68d0e74010602595c597520c850a0d-80x30.svg":
    "anthropic/partners/figma.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/84a8b2df3606dc68dda827c8e457144c6bb633b8-148x43.svg":
    "anthropic/partners/shopify.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/49b99af78924f43f878d39a25d574da293c68596-60x32.svg":
    "anthropic/partners/box.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/7415f908eca858ec4c3453c5d8151e46a0fb1e6d-150x48.svg":
    "anthropic/partners/windsurf.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/f33102478c7f5cc19de9c7aeea317ce9f8721a6a-191x26.svg":
    "anthropic/partners/augment.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/5d27d5fd738921411bb1e39bc27c396c6c075b4b-157x38.svg":
    "anthropic/partners/nbim.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/9f4b0bb77875debc1a7af803741a56da3482972b-120x24.svg":
    "anthropic/partners/vercel-v0.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/8c153469c592cbedc960e3fb424dfd752f1f00bd-132x36.svg":
    "anthropic/partners/elicit.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/d63496e64e1df5ab874fcbb53fdd7cf4ebbb6faf-164x24.svg":
    "anthropic/partners/factory.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/17ae0c7a20f0ed1247c21a3fe65dcc7d88696de6-104x40.svg":
    "anthropic/partners/hex.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/aad0da69057f1510832dbb52e56a7dc96f352c17-136x24.svg":
    "anthropic/partners/hebbia.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/fc34c8fa8fc563302d37e13bf4485b8f855b7d47-578x160.svg":
    "anthropic/partners/greptile.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/40ca41da6a9c5c318d7032e72b56a477ee8bb23b-148x38.svg":
    "anthropic/partners/quantium.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/dc8e3b29b23d0bf06698ea830b56cf17790ee598-2152x314.svg":
    "anthropic/partners/coderabbit.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/9cdf5ed2ae750f0b6795490071eed41576bd1e1a-189x24.svg":
    "anthropic/partners/atlassian.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/af30f9e79df810a09be342cd95bc88538a266f42-382x115.svg":
    "anthropic/partners/postman.svg",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/08635efbe5b258fa2b79ce7153c142ce104db879-104x28.svg":
    "anthropic/partners/zapier.svg",

  // ── Benchmark Charts ──────────────────────────────────────────────────
  "https://cdn.sanity.io/images/4zrzovbb/website/6e29759b50e8b3a8363b38b1f573d854df968671-3840x2160.png":
    "anthropic/benchmarks/gdpval-aa-knowledge-work.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/018d6d882034d50727948b22e3ad3844a43ee09c-3840x2160.png":
    "anthropic/benchmarks/deepsearchqa-agentic.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/b8cfd7ebd6c82febce5f428f519d68a5dcf5d16f-3840x2160.png":
    "anthropic/benchmarks/terminal-bench-2-coding.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/b8d511155f209c57e4d6a92ab115ebfc7c8832ff-3840x2160.png":
    "anthropic/benchmarks/expert-reasoning.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/ae7ae61aefff3c9b059975957335785f8ebd59d6-3840x2160.png":
    "anthropic/benchmarks/long-context-retrieval.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/9a32a76a983d4c8f709683b38ff3af6664b5128a-3840x2160.png":
    "anthropic/benchmarks/long-context-reasoning.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/653e04afc43612d3a0f8427da86b6549800005f9-3840x2160.png":
    "anthropic/benchmarks/root-cause-analysis.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/542044519014a793cf042a08a730ebd8977c57b0-3840x2160.png":
    "anthropic/benchmarks/multilingual-coding.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/6c1b33e985bcae9163b77bc25620e85abd5d9a7b-3840x2160.png":
    "anthropic/benchmarks/long-term-coherence.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/8a421f45125743fd9e9078aae992c6e5f236a3da-3840x2160.png":
    "anthropic/benchmarks/cybersecurity.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/f7dff66d47d54dfaabddc82bf9b96658df00634a-3840x2160.png":
    "anthropic/benchmarks/life-sciences.png",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/f3860f2517f355c24fbdc3b5ac8d1460d7c1e8a5-2600x2968.png":
    "anthropic/benchmarks/opus-benchmark-table.png",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/9a27a40207eb06287bfcdb6a74aba8420a4fdb26-2600x2960.png":
    "anthropic/benchmarks/sonnet-benchmark-table.png",

  // ── Social / OG Cards ─────────────────────────────────────────────────
  "https://cdn.sanity.io/images/4zrzovbb/website/c07f638082c569e8ce1e89ae95ee6f332a98ec08-2400x1260.jpg":
    "anthropic/social/default-og.jpg",
  "https://cdn.sanity.io/images/4zrzovbb/website/32d7f6f9e251f4885b84ee8d5cd72540dd9a6b38-2400x1260.jpg":
    "anthropic/social/opus-4-6-card.jpg",
  "https://cdn.sanity.io/images/4zrzovbb/website/01d06528567e4bd22c3ddedc87f609ee5716a009-2400x1260.png":
    "anthropic/social/opus-4-6-announcement.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/e256440534a1c8ecc85c745a451cd8725e6c00b4-2400x1260.jpg":
    "anthropic/social/haiku-4-5-card.jpg",
  "https://cdn.sanity.io/images/4zrzovbb/website/c4bd33e7c8e809a2f9a9a5896ee13961e2a738ec-2400x1260.png":
    "anthropic/social/academy-card.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/5b3eb6e1368dfeeaa206fd0bee001f58d9e2ea36-1920x1080.png":
    "anthropic/social/space-to-think.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/f206078bb0920966fe2255156c317f4274ebe652-2400x1260.png":
    "anthropic/social/rsp-card.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/d63af41b0aa9d5531ac43fec0cb018b3d476f230-1900x1000.png":
    "anthropic/social/economic-futures-card.png",
  "https://www-cdn.anthropic.com/images/4zrzovbb/website/a9200829eaf63ae342ede66e46d7439367a705bc-1920x1080.png":
    "anthropic/social/featured-hero.png",

  // ── Research Images ───────────────────────────────────────────────────
  "https://cdn.sanity.io/images/4zrzovbb/website/ac8a8d902d506953105e80ea8ee0363c3a02dbc2-1800x1013.jpg":
    "anthropic/research/constitutional-classifiers.jpg",
  "https://cdn.sanity.io/images/4zrzovbb/website/021f5a89f9b3ba1755f9a2315bc63be855259532-3840x1762.png":
    "anthropic/research/assistant-axis.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/77411b5a7049200a7021270a6c44101d5b228ab9-1681x1261.png":
    "anthropic/research/how-people-use-claude.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/8972a735e56071176ba6318220552f99497b68f4-1680x1260.png":
    "anthropic/research/project-vend.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/a39f1a92805cb88b1c07fabd4723181c5a6e1f14-1681x1261.png":
    "anthropic/research/agentic-misalignment.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/9a0bd6057505b3aea24d1e7412943a4c6c98be0e-1681x1261.png":
    "anthropic/research/confidential-inference.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/86be055e775a25d264ab5b43a9ba35ac6041b609-1681x1261.png":
    "anthropic/research/circuit-tracing.png",
  "https://cdn.sanity.io/images/4zrzovbb/website/222ceb1a95a856bdc1ca5d3dd8c8d44dfdf05aa6-2400x1260.png":
    "anthropic/research/economic-index.png",

  // ── Maps ──────────────────────────────────────────────────────────────
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e8a957c5ef54c77cb2_events-header_north-america.svg":
    "anthropic/maps/north-america.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e840a6776a7f4f0393_events-header_south-america.svg":
    "anthropic/maps/south-america.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e87eae34fbb99cfb3b_events-header_europe.svg":
    "anthropic/maps/europe.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e882ac8a8bb8f677fd_events-header_middle-east.svg":
    "anthropic/maps/middle-east.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e8bbafe8194cf059ca_events-header_asia.svg":
    "anthropic/maps/asia.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e840a6776a7f4f0390_events-header_africa.svg":
    "anthropic/maps/africa.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/682558e8f55fd3be8776c2c1_events-header_australia.svg":
    "anthropic/maps/australia.svg",

  // ── Events ────────────────────────────────────────────────────────────
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/69b96c22d96f7b22bf879c21_code-with-claude-logo-vertical.svg":
    "anthropic/events/code-with-claude-logo.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/69bb579dafb6a11800c113d2_cwc-illos.svg":
    "anthropic/events/code-with-claude-illustrations.svg",
  "https://cdn.prod.website-files.com/67ed58c92cfedc451ebbbca1/6864753e1fa8e470fad9be8a_ClaudeforFinancialServices-StackedLogo.svg":
    "anthropic/events/claude-for-financial-services.svg",

  // ── Team Photos ───────────────────────────────────────────────────────
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/681d62091e3b46dac5428888_research.webp":
    "anthropic/team/research-team.webp",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/681d620978e48d8861871f7d_policy.webp":
    "anthropic/team/policy-team.webp",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/681d62094dad1585c366d2da_product.webp":
    "anthropic/team/product-team.webp",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/67d3c039bc939998a7c43b37_work-with-anthropic.webp":
    "anthropic/team/operations-team.webp",
  "https://cdn.sanity.io/images/4zrzovbb/website/daa9ebf989c197cae5ef84a639302083713a611e-1760x988.jpg":
    "anthropic/team/building-anthropic-video.jpg",

  // ── UI Icons ──────────────────────────────────────────────────────────
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/67ed683dbe1be372fb49776d_MagnifyingGlass.svg":
    "anthropic/icons/magnifying-glass.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/67ed7b8c9984ff61d7894ebc_Objects-LightningBolt.svg":
    "anthropic/icons/lightning-bolt.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/680268b1c5c214a0769c37be_Nodes-PlantGrowth.svg":
    "anthropic/icons/plant-growth-nodes.svg",
  "https://cdn.prod.website-files.com/67ce28cfec624e2b733f8a52/6892041a22121dadb0e34d89_Object-Envelope.svg":
    "anthropic/icons/envelope.svg",
  "https://cdn.sanity.io/images/4zrzovbb/website/2d4a112e61566fdcebc25aecc2bef75bb14a7fec-277x104.svg":
    "anthropic/icons/claude-logo-small.svg",

  // ── Animations ────────────────────────────────────────────────────────
  "https://cdn.sanity.io/files/4zrzovbb/website/9ac19583d019b85db5ca3af485f419f74f3fe4a5.json":
    "anthropic/animations/interview-1.json",
  "https://cdn.sanity.io/files/4zrzovbb/website/a9cde041d15765c23813279f5ccde115bd40f29a.json":
    "anthropic/animations/interview-2.json",
  "https://cdn.sanity.io/files/4zrzovbb/website/b9f944c5ea6207dd80c7204544457960642eda46.json":
    "anthropic/animations/interview-3.json",
  "https://cdn.sanity.io/files/4zrzovbb/website/c20ea6ec0dc231d3559c6d0fbcdae4f6a05fdd06.json":
    "anthropic/animations/interview-4.json",
  "https://cdn.sanity.io/files/4zrzovbb/website/cca8d23a9104ef0fc87b518ec18565aa8af41205.json":
    "anthropic/animations/interview-5.json",
}

// ---------------------------------------------------------------------------
// S3 Client
// ---------------------------------------------------------------------------

function createS3(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set")
  }
  return new S3Client({
    region: REGION,
    credentials: { accessKeyId, secretAccessKey },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function existsInS3(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "databayt-asset-crawler/1.0" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function getMime(s3Key: string): string {
  const ext = s3Key.slice(s3Key.lastIndexOf(".") + 1).toLowerCase()
  return MIME_MAP[ext] || "application/octet-stream"
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const doUpload = args.includes("--upload")
  const doManifest = args.includes("--manifest")

  const entries = Object.entries(ASSETS)
  const cdnDomain =
    process.env.NEXT_PUBLIC_CDN_DOMAIN || "d1dlwtcfl0db67.cloudfront.net"

  console.log(`\n  Anthropic Asset Upload`)
  console.log(`  ══════════════════════`)
  console.log(`  Bucket:  ${BUCKET}`)
  console.log(`  Region:  ${REGION}`)
  console.log(`  CDN:     https://${cdnDomain}`)
  console.log(`  Mode:    ${doUpload ? "UPLOAD" : "DRY RUN"}`)
  console.log(`  Assets:  ${entries.length} files\n`)

  const manifest: Record<string, string> = {}
  let uploaded = 0
  let skipped = 0
  let errors = 0

  const s3 = doUpload ? createS3() : null

  for (const [sourceUrl, s3Key] of entries) {
    const cdnUrl = `https://${cdnDomain}/${s3Key}`
    manifest[sourceUrl] = cdnUrl

    if (!doUpload) {
      console.log(`  ✓  ${s3Key}`)
      continue
    }

    try {
      const exists = await existsInS3(s3!, s3Key)
      if (exists) {
        console.log(`  SKIP     ${s3Key}  (exists)`)
        skipped++
        continue
      }

      const buffer = await downloadBuffer(sourceUrl)
      await s3!.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: buffer,
          ContentType: getMime(s3Key),
          CacheControl: CACHE_CONTROL,
        })
      )
      console.log(
        `  UPLOAD   ${s3Key}  (${(buffer.length / 1024).toFixed(1)}KB)`
      )
      uploaded++
    } catch (err) {
      console.error(`  ERROR    ${s3Key}: ${(err as Error).message}`)
      errors++
    }
  }

  console.log(`\n  ─────────────────────`)
  if (doUpload) {
    console.log(`  Uploaded: ${uploaded}`)
    console.log(`  Skipped:  ${skipped}`)
  } else {
    console.log(`  Would upload: ${entries.length}`)
  }
  if (errors) console.log(`  Errors:   ${errors}`)
  console.log()

  if (doManifest) {
    const path = join(process.cwd(), "scripts/anthropic-asset-manifest.json")
    writeFileSync(path, JSON.stringify(manifest, null, 2))
    console.log(`  Manifest written to ${path}\n`)
  }
}

main().catch((err) => {
  console.error("Upload failed:", err)
  process.exit(1)
})
