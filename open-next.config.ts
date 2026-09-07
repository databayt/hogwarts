import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Pilot defaults: no incremental cache binding yet, so `revalidate` and the
// fetch cache are no-ops and ISR pages serve their build-time render. Add an
// R2 bucket (NEXT_INC_CACHE_R2_BUCKET) once the runtime itself is proven.
export default defineCloudflareConfig()
