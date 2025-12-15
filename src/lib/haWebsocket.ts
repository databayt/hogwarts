import {
  clearTokens,
  getAccessToken,
  getTimeToExpiryMs,
  login,
  refreshAccessToken,
} from "@/lib/haAuth"

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

class HAWebSocket {
  private ws: WebSocket | null = null
  private msgId = 1
  private refreshTimer: number | null = null

  private stateListeners: Map<string, ((state: any) => void)[]> = new Map()

  async connect(
    baseUrl: string,
    token: string,
    useProxy: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const HA_HOST =
        getImportMetaEnv("VITE_HA_URL") ||
        process.env.NEXT_PUBLIC_HA_URL ||
        process.env.HA_URL
      const HA_PORT =
        getImportMetaEnv("VITE_HA_PORT") ||
        process.env.NEXT_PUBLIC_HA_PORT ||
        process.env.HA_PORT
      const haWsUrl = `ws://${HA_HOST}:${HA_PORT}/api/websocket`
      const fullUrl = useProxy ? `${baseUrl}/ha` : haWsUrl

      console.log("[HA WS] Connecting:", fullUrl)
      this.ws = new WebSocket(fullUrl)

      this.ws.onopen = () => console.log("[HA WS] Opened")

      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === "auth_required") {
          this.ws?.send(JSON.stringify({ type: "auth", access_token: token }))
        } else if (msg.type === "auth_ok") {
          console.log("[HA WS] Authenticated")
          this.subscribeEvents("state_changed")
          this.scheduleRefresh(baseUrl, useProxy)
          resolve()
        } else if (msg.type === "auth_invalid") {
          console.warn("[HA WS] auth_invalid, trying refresh")
          try {
            const newTokens = await refreshAccessToken()
            const newToken = newTokens.access_token
            console.log("[HA WS] Token refreshed, retrying connect")
            await this.reconnect(baseUrl, newToken, useProxy)
            resolve()
          } catch (err) {
            console.error(
              "[HA WS] Refresh failed; clearing tokens and restarting login"
            )
            clearTokens()
            login()
            reject(err)
          }
        } else if (
          msg.type === "event" &&
          msg.event?.event_type === "state_changed"
        ) {
          const entityId = msg.event.data.entity_id
          this.notifyStateListeners(entityId, msg.event.data.new_state)
        }
      }

      this.ws.onerror = (err) => {
        console.error("[HA WS] WebSocket error:", err)
        reject(err)
      }

      this.ws.onclose = () => {
        console.warn("[HA WS] Closed")
        this.clearTimers()
      }
    })
  }

  private async reconnect(baseUrl: string, token: string, useProxy: boolean) {
    this.clearTimers()
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close()
    } catch {}
    return this.connect(baseUrl, token, useProxy)
  }

  private scheduleRefresh(baseUrl: string, useProxy: boolean) {
    this.clearRefreshTimer()
    const tte = getTimeToExpiryMs()
    if (tte == null) {
      console.log(
        "[HA WS] Token has no expiry; skipping proactive refresh (likely long-lived)"
      )
      return
    }
    const refreshIn = Math.max(tte - 5 * 60 * 1000, 10 * 1000) // 5 min before expiry, at least 10s
    console.log(
      "[HA WS] Scheduling refresh in",
      Math.round(refreshIn / 1000),
      "s"
    )
    this.refreshTimer = window.setTimeout(async () => {
      try {
        const newTokens = await refreshAccessToken()
        const newToken = newTokens.access_token
        console.log("[HA WS] Proactive refresh OK; reconnecting WS")
        await this.reconnect(baseUrl, newToken, useProxy)
      } catch (e) {
        console.error("[HA WS] Proactive refresh failed; restarting auth")
        clearTokens()
        login()
      }
    }, refreshIn)
  }

  private subscribeEvents(eventType: string) {
    const id = ++this.msgId
    this.ws?.send(
      JSON.stringify({
        id,
        type: "subscribe_events",
        event_type: eventType,
      })
    )
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer)
    this.refreshTimer = null
  }

  private clearTimers() {
    this.clearRefreshTimer()
  }

  getState(entityId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId

      const handleMessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data)
        if (msg.id === id && msg.type === "result") {
          this.ws?.removeEventListener("message", handleMessage)
          if (msg.success && Array.isArray(msg.result)) {
            const entity = msg.result.find((e: any) => e.entity_id === entityId)
            resolve(entity)
          } else {
            resolve(null)
          }
        }
      }

      this.ws?.addEventListener("message", handleMessage)

      this.ws?.send(
        JSON.stringify({
          id,
          type: "get_states",
        })
      )
    })
  }

  addStateListener(entityId: string, cb: (newState: any) => void) {
    const listeners = this.stateListeners.get(entityId) || []
    listeners.push(cb)
    this.stateListeners.set(entityId, listeners)
  }

  removeStateListener(entityId: string, cb: (newState: any) => void) {
    let listeners = this.stateListeners.get(entityId) || []
    listeners = listeners.filter((fn) => fn !== cb)
    this.stateListeners.set(entityId, listeners)
  }

  private notifyStateListeners(entityId: string, newState: any) {
    const listeners = this.stateListeners.get(entityId)
    if (listeners) listeners.forEach((fn) => fn(newState))
  }

  callService(domain: string, service: string, serviceData: any) {
    const id = ++this.msgId
    this.ws?.send(
      JSON.stringify({
        id,
        type: "call_service",
        domain,
        service,
        service_data: serviceData,
      })
    )
  }
  callServiceWithResponse(
    domain: string,
    service: string,
    serviceData: Record<string, any> = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId

      const handleMessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data)
        if (msg.id === id && msg.type === "result") {
          this.ws?.removeEventListener("message", handleMessage)
          if (msg.success) {
            // The response will be in msg.result
            resolve(msg.result)
          } else {
            reject(msg.error || new Error("Service call failed"))
          }
        }
      }

      this.ws?.addEventListener("message", handleMessage)

      // According to HA API, set `return_response: true` to get a payload back.
      this.ws?.send(
        JSON.stringify({
          id,
          type: "call_service",
          domain,
          service,
          service_data: serviceData,
          return_response: true,
        })
      )
    })
  }
  fireEvent(
    eventType: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId

      const handleMessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data)
        if (msg.id === id && msg.type === "result") {
          this.ws?.removeEventListener("message", handleMessage)
          if (msg.success) {
            resolve()
          } else {
            reject(msg.error)
          }
        }
      }

      this.ws?.addEventListener("message", handleMessage)

      this.ws?.send(
        JSON.stringify({
          id,
          type: "fire_event",
          event_type: eventType,
          event_data: eventData,
        })
      )
    })
  }
}

export const haWebSocket = new HAWebSocket()
