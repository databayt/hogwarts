/**
 * Evolution API REST Client
 *
 * Communicates with a self-hosted Evolution API instance (built on Baileys)
 * for WhatsApp messaging, group management, and session handling.
 *
 * @see https://github.com/EvolutionAPI/evolution-api
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? ""
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? ""

export type InstanceStatus = {
  instanceName: string
  state: "open" | "close" | "connecting"
}

export type QRCodeResponse = {
  pairingCode: string | null
  code: string | null // Raw QR code string
  base64: string | null // Base64-encoded QR image
  count: number
}

export type SendMessageResponse = {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: Record<string, unknown>
  messageTimestamp: string
  status: string
}

export type GroupInfo = {
  id: string // Group JID
  subject: string
  subjectOwner: string
  subjectTime: number
  size: number
  creation: number
  desc: string
  descId: string
  restrict: boolean
  announce: boolean
  participants: Array<{
    id: string
    admin: "admin" | "superadmin" | null
  }>
}

export type CreateGroupResponse = {
  id: string // Group JID
  subject: string
  participants: Array<{ id: string }>
}

class EvolutionAPIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "EvolutionAPIError"
  }
}

// Retry policy lives here (not in a shared lib) because Evolution's failure
// modes are specific: the self-hosted container can restart, the upstream
// WhatsApp socket can flake, and 502/504 from the reverse proxy are common.
// Generic fetch retries elsewhere in the app would over-trigger.
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 200
const DEFAULT_TIMEOUT_MS = 15_000
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  timeoutMs?: number
  /** Override the delay function for tests; receives attempt index (0-based). */
  delay?: (ms: number) => Promise<void>
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function backoffWithJitter(attempt: number, baseDelayMs: number): number {
  // 200ms, 400ms, 800ms with ±25% jitter so two failing schools don't
  // synchronize their retries and stampede a recovering Evolution API.
  const exponential = baseDelayMs * Math.pow(2, attempt)
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1)
  return Math.max(0, Math.round(exponential + jitter))
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof EvolutionAPIError) {
    return RETRYABLE_STATUS_CODES.has(err.status)
  }
  // Native fetch surfaces network failures + AbortError as TypeError /
  // DOMException. Treat both as transient.
  if (err instanceof TypeError) return true
  if (err instanceof DOMException && err.name === "AbortError") return true
  return false
}

async function request<T>(
  path: string,
  options?: RequestInit,
  retryOpts: RetryOptions = {}
): Promise<T> {
  if (!EVOLUTION_API_URL) {
    throw new EvolutionAPIError(
      500,
      "EVOLUTION_API_URL environment variable is not set"
    )
  }

  const maxAttempts = retryOpts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const baseDelayMs = retryOpts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const timeoutMs = retryOpts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const delay = retryOpts.delay ?? defaultDelay

  const url = `${EVOLUTION_API_URL}${path}`
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
          ...options?.headers,
        },
      })

      if (!res.ok) {
        const body = await res.text().catch(() => "Unknown error")
        throw new EvolutionAPIError(
          res.status,
          `Evolution API ${res.status}: ${body}`
        )
      }

      return (await res.json()) as T
    } catch (err) {
      lastError = err
      const isLastAttempt = attempt === maxAttempts - 1
      if (isLastAttempt || !isRetryableError(err)) {
        throw err
      }
      const waitMs = backoffWithJitter(attempt, baseDelayMs)
      console.warn(
        `[evolution-client] ${path} attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${waitMs}ms`,
        err
      )
      await delay(waitMs)
    } finally {
      clearTimeout(timeoutHandle)
    }
  }

  // Unreachable — the loop either returns or throws — but TS needs it.
  throw lastError
}

// Exported for unit tests; the public client API does not change.
export const __testing = {
  isRetryableError,
  backoffWithJitter,
  RETRYABLE_STATUS_CODES,
  EvolutionAPIError,
}

// =============================================================================
// Instance Management
// =============================================================================

/**
 * Create a new WhatsApp instance for a school
 */
export async function createInstance(
  instanceName: string,
  webhookUrl: string
): Promise<{ instance: { instanceName: string; status: string } }> {
  return request("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: [
          "CONNECTION_UPDATE",
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "SEND_MESSAGE",
          "GROUPS_UPSERT",
          "GROUPS_UPDATE",
          "GROUP_PARTICIPANTS_UPDATE",
        ],
      },
    }),
  })
}

/**
 * Delete a WhatsApp instance
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  await request(`/instance/delete/${instanceName}`, { method: "DELETE" })
}

/**
 * Get connection status of an instance
 */
export async function getInstanceStatus(
  instanceName: string
): Promise<InstanceStatus> {
  return request(`/instance/connectionState/${instanceName}`)
}

/**
 * Get QR code for connecting a device
 */
export async function getQRCode(instanceName: string): Promise<QRCodeResponse> {
  return request(`/instance/connect/${instanceName}`)
}

/**
 * Disconnect (logout) an instance
 */
export async function logoutInstance(instanceName: string): Promise<void> {
  await request(`/instance/logout/${instanceName}`, { method: "DELETE" })
}

// =============================================================================
// Messaging
// =============================================================================

/**
 * Send a text message to a phone number or group
 */
export async function sendText(
  instanceName: string,
  to: string, // Phone number (E.164) or group JID
  text: string
): Promise<SendMessageResponse> {
  return request(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: to,
      text,
    }),
  })
}

/**
 * Send a media message (image, document, audio, video)
 */
export async function sendMedia(
  instanceName: string,
  to: string,
  mediaUrl: string,
  options?: {
    caption?: string
    mediatype?: "image" | "document" | "audio" | "video"
    fileName?: string
  }
): Promise<SendMessageResponse> {
  return request(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: to,
      mediatype: options?.mediatype ?? "image",
      media: mediaUrl,
      caption: options?.caption ?? "",
      fileName: options?.fileName,
    }),
  })
}

/**
 * Download media from a WhatsApp message.
 * Returns the media as a base64-encoded string with MIME type.
 */
export async function downloadMedia(
  instanceName: string,
  messageKey: { remoteJid: string; fromMe: boolean; id: string }
): Promise<{ base64: string; mimetype: string; fileName?: string }> {
  return request(`/chat/getBase64FromMediaMessage/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      message: { key: messageKey },
    }),
  })
}

/**
 * Mark messages as read on WhatsApp
 */
export async function readMessages(
  instanceName: string,
  remoteJid: string,
  messageIds: string[]
): Promise<void> {
  const jid = remoteJid.includes("@")
    ? remoteJid
    : `${remoteJid.replace(/\+/g, "")}@s.whatsapp.net`

  await request(`/chat/markMessageAsRead/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({
      readMessages: messageIds.map((id) => ({
        remoteJid: jid,
        fromMe: false,
        id,
      })),
    }),
  })
}

// =============================================================================
// Group Management
// =============================================================================

/**
 * Create a new WhatsApp group
 */
export async function createGroup(
  instanceName: string,
  name: string,
  participants: string[] // Phone numbers in E.164 format
): Promise<CreateGroupResponse> {
  return request(`/group/create/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      subject: name,
      participants,
    }),
  })
}

/**
 * Update group subject (name)
 */
export async function updateGroupSubject(
  instanceName: string,
  groupJid: string,
  subject: string
): Promise<void> {
  await request(`/group/updateSubject/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({ groupJid, subject }),
  })
}

/**
 * Update group description
 */
export async function updateGroupDescription(
  instanceName: string,
  groupJid: string,
  description: string
): Promise<void> {
  await request(`/group/updateDescription/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({ groupJid, description }),
  })
}

/**
 * Add participants to a group
 */
export async function addGroupParticipants(
  instanceName: string,
  groupJid: string,
  participants: string[]
): Promise<void> {
  await request(`/group/updateParticipant/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({
      groupJid,
      action: "add",
      participants,
    }),
  })
}

/**
 * Remove participants from a group
 */
export async function removeGroupParticipants(
  instanceName: string,
  groupJid: string,
  participants: string[]
): Promise<void> {
  await request(`/group/updateParticipant/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({
      groupJid,
      action: "remove",
      participants,
    }),
  })
}

/**
 * Promote participant to admin
 */
export async function promoteGroupAdmin(
  instanceName: string,
  groupJid: string,
  participants: string[]
): Promise<void> {
  await request(`/group/updateParticipant/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({
      groupJid,
      action: "promote",
      participants,
    }),
  })
}

/**
 * Get group info including participants
 */
export async function getGroupInfo(
  instanceName: string,
  groupJid: string
): Promise<GroupInfo> {
  return request(
    `/group/findGroupInfos/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`
  )
}

/**
 * Get all groups for an instance
 */
export async function getAllGroups(instanceName: string): Promise<GroupInfo[]> {
  return request(`/group/fetchAllGroups/${instanceName}?getParticipants=false`)
}

/**
 * Leave a group
 */
export async function leaveGroup(
  instanceName: string,
  groupJid: string
): Promise<void> {
  await request(`/group/leaveGroup/${instanceName}`, {
    method: "DELETE",
    body: JSON.stringify({ groupJid }),
  })
}

/**
 * Set group profile picture
 */
export async function setGroupImage(
  instanceName: string,
  groupJid: string,
  imageUrl: string
): Promise<void> {
  await request(`/group/updateGroupPicture/${instanceName}`, {
    method: "PUT",
    body: JSON.stringify({ groupJid, image: imageUrl }),
  })
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Check if Evolution API is reachable
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await request("/instance/fetchInstances")
    return true
  } catch {
    return false
  }
}

/**
 * Format phone number to WhatsApp format (remove + prefix, add @s.whatsapp.net)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, "")
  return cleaned
}

/**
 * Parse a WhatsApp JID to get the phone number
 */
export function parseJidToPhone(jid: string): string {
  return "+" + jid.split("@")[0]
}

export { EvolutionAPIError }
