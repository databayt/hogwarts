import type { UserRole } from "@prisma/client"

type WhatsAppAction =
  | "connect" // Connect/disconnect WhatsApp
  | "send_message" // Send individual messages
  | "manage_groups" // Create/edit/delete groups
  | "broadcast" // Send to multiple groups
  | "manage_templates" // Create/edit templates
  | "view" // View WhatsApp dashboard

const ACTION_PERMISSIONS: Record<WhatsAppAction, UserRole[]> = {
  connect: ["DEVELOPER", "ADMIN"],
  send_message: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
  manage_groups: ["DEVELOPER", "ADMIN"],
  broadcast: ["DEVELOPER", "ADMIN"],
  manage_templates: ["DEVELOPER", "ADMIN"],
  view: ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"],
}

export function canPerformWhatsAppAction(
  role: UserRole,
  action: WhatsAppAction
): boolean {
  return ACTION_PERMISSIONS[action]?.includes(role) ?? false
}

export function getWhatsAppPermissions(role: UserRole): WhatsAppAction[] {
  return Object.entries(ACTION_PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([action]) => action as WhatsAppAction)
}
