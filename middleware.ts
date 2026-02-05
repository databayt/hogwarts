import { NextRequest } from "next/server"
import { config, proxy } from "@/proxy"

export function middleware(request: NextRequest) {
  return proxy(request)
}

export { config }
