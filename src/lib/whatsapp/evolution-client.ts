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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!EVOLUTION_API_URL) {
    throw new EvolutionAPIError(
      500,
      "EVOLUTION_API_URL environment variable is not set"
    )
  }

  const url = `${EVOLUTION_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
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

  return res.json() as Promise<T>
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
