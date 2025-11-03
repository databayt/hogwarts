import type {
  MessagingAuthContext,
  ConversationContext,
  MessageContext,
  MessagingAction,
} from "./types"
import type { ConversationType, ConversationParticipantRole } from "@prisma/client"
import { CONVERSATION_CREATION_PERMISSIONS, canUserCreateConversationType } from "./config"

/**
 * Get auth context from session
 */
export function getAuthContext(session: any): MessagingAuthContext | null {
  if (!session?.user?.id || !session?.user?.schoolId || !session?.user?.role) {
    return null
  }

  return {
    userId: session.user.id,
    schoolId: session.user.schoolId,
    role: session.user.role,
  }
}

/**
 * Main permission check function
 */
export function checkMessagingPermission(
  auth: MessagingAuthContext,
  action: MessagingAction,
  conversation?: ConversationContext,
  message?: MessageContext,
  participantRole?: ConversationParticipantRole
): boolean {
  const { role, userId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  switch (action) {
    case "create_conversation":
      return canCreateConversation(role, conversation?.type)

    case "read_conversation":
      // Users can read conversations they're participants in
      return conversation?.participantIds?.includes(userId) ?? false

    case "update_conversation":
      // Owner or admin of conversation
      if (conversation?.createdById === userId) return true
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    case "delete_conversation":
      // Only owner or ADMIN role
      if (role === "ADMIN") return true
      if (conversation?.createdById === userId) return true
      return false

    case "archive_conversation":
      // Participants can archive for themselves
      return conversation?.participantIds?.includes(userId) ?? false

    case "add_participant":
      // Owner, admin, or based on conversation type
      if (participantRole === "owner" || participantRole === "admin") return true
      if (conversation?.type === "group" && participantRole === "member") return true
      return false

    case "remove_participant":
      // Owner or admin can remove others
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    case "send_message":
      // Must be participant with send permissions
      if (!conversation?.participantIds?.includes(userId)) return false
      if (participantRole === "read_only") return false
      return true

    case "read_message":
      // Must be conversation participant
      return conversation?.participantIds?.includes(userId) ?? false

    case "edit_message":
      // Can only edit own messages
      return message?.senderId === userId

    case "delete_message":
      // Can delete own messages or if admin/owner
      if (message?.senderId === userId) return true
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    case "react_to_message":
      // Must be conversation participant
      return conversation?.participantIds?.includes(userId) ?? false

    case "pin_message":
      // Owner or admin can pin
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    case "create_invite":
      // Owner or admin can invite
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    case "send_broadcast":
      // Only for announcement channels, admin/owner
      if (conversation?.type !== "announcement") return false
      if (role === "ADMIN") return true
      if (participantRole === "owner" || participantRole === "admin") return true
      return false

    default:
      return false
  }
}

/**
 * Assert permission (throws error if denied)
 */
export function assertMessagingPermission(
  auth: MessagingAuthContext,
  action: MessagingAction,
  conversation?: ConversationContext,
  message?: MessageContext,
  participantRole?: ConversationParticipantRole
): void {
  if (!checkMessagingPermission(auth, action, conversation, message, participantRole)) {
    throw new Error(`Permission denied: ${action}`)
  }
}

/**
 * Check if user can create conversation type
 */
export function canCreateConversation(
  role: string,
  type?: ConversationType
): boolean {
  if (!type) return false
  return canUserCreateConversationType(role, type)
}

/**
 * Get allowed conversation types for user
 */
export function getAllowedConversationTypes(role: string): ConversationType[] {
  const permissions = CONVERSATION_CREATION_PERMISSIONS[role]
  if (!permissions) return []

  const types: ConversationType[] = []
  if (permissions.canCreateDirect) types.push("direct")
  if (permissions.canCreateGroup) types.push("group")
  if (permissions.canCreateClass) types.push("class")
  if (permissions.canCreateDepartment) types.push("department")
  if (permissions.canCreateAnnouncement) types.push("announcement")

  return types
}

/**
 * Validate conversation type for user
 */
export function validateConversationType(
  auth: MessagingAuthContext,
  type: ConversationType
): void {
  if (!canCreateConversation(auth.role, type)) {
    throw new Error(
      `User with role ${auth.role} cannot create ${type} conversations`
    )
  }
}

/**
 * Check if user can send messages in conversation
 */
export function canSendMessage(
  participantRole?: ConversationParticipantRole
): boolean {
  if (!participantRole) return false
  return participantRole !== "read_only"
}

/**
 * Check if user can manage participants
 */
export function canManageParticipants(
  participantRole?: ConversationParticipantRole
): boolean {
  if (!participantRole) return false
  return participantRole === "owner" || participantRole === "admin"
}

/**
 * Check if user can edit conversation settings
 */
export function canEditConversation(
  participantRole?: ConversationParticipantRole
): boolean {
  if (!participantRole) return false
  return participantRole === "owner"
}

/**
 * Check if user can delete messages
 */
export function canDeleteMessages(
  participantRole?: ConversationParticipantRole
): boolean {
  if (!participantRole) return false
  return participantRole === "owner" || participantRole === "admin"
}

/**
 * Check if user can pin messages
 */
export function canPinMessages(
  participantRole?: ConversationParticipantRole
): boolean {
  if (!participantRole) return false
  return participantRole === "owner" || participantRole === "admin"
}

/**
 * Role-based messaging permissions matrix
 */
export const MESSAGING_PERMISSIONS_MATRIX = {
  DEVELOPER: {
    createDirect: true,
    createGroup: true,
    createClass: true,
    createDepartment: true,
    createAnnouncement: true,
    deleteAnyConversation: true,
    deleteAnyMessage: true,
    viewAllConversations: true,
  },
  ADMIN: {
    createDirect: true,
    createGroup: true,
    createClass: true,
    createDepartment: true,
    createAnnouncement: true,
    deleteAnyConversation: true,
    deleteAnyMessage: true,
    viewAllConversations: true,
  },
  TEACHER: {
    createDirect: true,
    createGroup: true,
    createClass: true,
    createDepartment: false,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
  STUDENT: {
    createDirect: true,
    createGroup: true,
    createClass: false,
    createDepartment: false,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
  GUARDIAN: {
    createDirect: true,
    createGroup: false,
    createClass: false,
    createDepartment: false,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
  ACCOUNTANT: {
    createDirect: true,
    createGroup: true,
    createClass: false,
    createDepartment: true,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
  STAFF: {
    createDirect: true,
    createGroup: true,
    createClass: false,
    createDepartment: false,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
  USER: {
    createDirect: false,
    createGroup: false,
    createClass: false,
    createDepartment: false,
    createAnnouncement: false,
    deleteAnyConversation: false,
    deleteAnyMessage: false,
    viewAllConversations: false,
  },
} as const

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: string) {
  return MESSAGING_PERMISSIONS_MATRIX[role as keyof typeof MESSAGING_PERMISSIONS_MATRIX] || MESSAGING_PERMISSIONS_MATRIX.USER
}

/**
 * Check specific permission for role
 */
export function hasRolePermission(
  role: string,
  permission: keyof typeof MESSAGING_PERMISSIONS_MATRIX.DEVELOPER
): boolean {
  const permissions = getRolePermissions(role)
  return permissions[permission] ?? false
}

/**
 * Participant role hierarchy (for permission inheritance)
 */
export const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  read_only: 1,
} as const

/**
 * Check if role has higher or equal hierarchy
 */
export function hasHigherOrEqualRole(
  role1: ConversationParticipantRole,
  role2: ConversationParticipantRole
): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

/**
 * Check if user can change another participant's role
 */
export function canChangeParticipantRole(
  currentUserRole: ConversationParticipantRole,
  targetUserRole: ConversationParticipantRole,
  newRole: ConversationParticipantRole
): boolean {
  // Must have higher role than target
  if (!hasHigherOrEqualRole(currentUserRole, targetUserRole)) return false

  // Can't promote someone to or above your own role (unless owner)
  if (currentUserRole !== "owner" && ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[currentUserRole]) {
    return false
  }

  return true
}

/**
 * Conversation type access rules
 */
export function canAccessConversationType(
  role: string,
  conversationType: ConversationType
): boolean {
  switch (conversationType) {
    case "direct":
      // All roles except USER can access direct messages
      return role !== "USER"

    case "group":
      // Most roles can access group chats
      return ["DEVELOPER", "ADMIN", "TEACHER", "STUDENT", "ACCOUNTANT", "STAFF"].includes(role)

    case "class":
      // Teachers, students, and admins can access class channels
      return ["DEVELOPER", "ADMIN", "TEACHER", "STUDENT"].includes(role)

    case "department":
      // Staff from same department can access
      return ["DEVELOPER", "ADMIN", "TEACHER", "ACCOUNTANT"].includes(role)

    case "announcement":
      // All verified users can read announcements
      return role !== "USER"

    default:
      return false
  }
}

/**
 * Message content restrictions
 */
export function validateMessageContent(
  content: string,
  conversationType: ConversationType
): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Message content cannot be empty" }
  }

  if (content.length > 4000) {
    return { valid: false, error: "Message is too long (max 4000 characters)" }
  }

  // Announcement channels may have stricter requirements
  if (conversationType === "announcement" && content.length < 10) {
    return { valid: false, error: "Announcement messages must be at least 10 characters" }
  }

  return { valid: true }
}

/**
 * File upload authorization
 */
export function canUploadFile(
  participantRole: ConversationParticipantRole,
  conversationType: ConversationType
): boolean {
  // Read-only participants cannot upload
  if (participantRole === "read_only") return false

  // Announcement channels: only admins/owners
  if (conversationType === "announcement") {
    return participantRole === "owner" || participantRole === "admin"
  }

  // Other conversation types: all non-read-only participants
  return true
}
