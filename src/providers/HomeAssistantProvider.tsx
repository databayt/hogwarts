"use client"

import { ReactNode, useEffect, useState } from "react"

import { getAccessToken, login } from "@/lib/haAuth"
import { haWebSocket } from "@/lib/haWebsocket"

function getImportMetaEnv(key: string): string | undefined {
  try {
    // @ts-ignore - import.meta may not exist in Next
    return typeof import.meta !== "undefined"
      ? import.meta.env?.[key]
      : undefined
  } catch {
    return undefined
  }
}

export function HomeAssistantProvider({
  children,
  useProxy = false,
}: {
  children: ReactNode
  useProxy?: boolean
}) {
  const [ready, setReady] = useState(false)
  const [path, setPath] = useState<string>("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPath(window.location.pathname)
    }
  }, [])
  const HA_URL =
    getImportMetaEnv("VITE_HA_URL") ||
    process.env.NEXT_PUBLIC_HA_URL ||
    process.env.HA_URL

  const HA_PORT =
    getImportMetaEnv("VITE_HA_PORT") ||
    process.env.NEXT_PUBLIC_HA_PORT ||
    process.env.HA_PORT

  const PROXY_URL =
    getImportMetaEnv("VITE_PROXY_URL") ||
    process.env.NEXT_PUBLIC_PROXY_URL ||
    process.env.PROXY_URL

  useEffect(() => {
    if (window.location.pathname.startsWith("/auth/")) {
      console.log("[HA] On auth route, skipping connection logic")
      return
    }
    const token = getAccessToken()
    if (!token) {
      login() // redirect to HA OAuth2
      return
    }

    async function connect() {
      if (!token) {
        return
      }
      try {
        await haWebSocket.connect(
          useProxy ? PROXY_URL! : `${HA_URL}:${HA_PORT}`,
          token,
          useProxy
        )
        setReady(true)
      } catch (err) {
        console.error("Failed to connect to HA WebSocket:", err)
      }
    }

    connect()
  }, [path, useProxy, HA_URL, HA_PORT, PROXY_URL])

  if (path.startsWith("/auth/")) {
    return <>{children}</>
  }
  if (!ready) {
    return <div>Connecting to Home Assistant...</div>
  }

  return <>{children}</>
}
