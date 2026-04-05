## Messaging — Real-time direct messages and group chats

### Overview

Full-featured messaging system supporting 1:1 direct messages and group conversations within a school. Includes cursor-based message pagination, read receipts, emoji reactions, conversation muting/archiving, file attachments, message search, and real-time updates via hooks. All operations are multi-tenant scoped -- participants must belong to the same school.

### Capabilities by Role

- **ADMIN**: Full access -- create conversations, manage participants, view all school conversations
- **TEACHER**: Direct messages with other staff, students, guardians; group chats for classes
- **STUDENT**: Direct messages with teachers (if configured), group chats
- **GUARDIAN**: Direct messages with teachers and admin
- **STAFF**: Direct messages with all school members

### Routes

| Route                                               | Page                | Status |
| --------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/messages` | Messaging interface | Ready  |

### File Structure

```
src/components/school-dashboard/messaging/
├── actions.ts                    # Server actions (conversations, messages, reactions, read receipts)
├── queries.ts                    # Read-only DB queries (conversation list, messages, participants)
├── authorization.ts              # RBAC and participant-level permission checks
├── validation.ts                 # Zod schemas for message/conversation input
├── serialization.ts              # Date serialization for client transfer
├── config.ts                     # Conversation type configuration (direct, group, channel, etc.)
├── types.ts                      # TypeScript type definitions
├── content.tsx                   # Server component (entry point)
├── messaging-client.tsx          # Main client component (split-pane layout)
├── conversation-list.tsx         # Conversation sidebar
├── conversation-card.tsx         # Single conversation preview card
├── chat-interface.tsx            # Active chat view
├── message-list.tsx              # Scrollable message list
├── message-group.tsx             # Grouped messages by sender
├── message-bubble.tsx            # Individual message bubble
├── message-input.tsx             # Compose area with attachments
├── message-search.tsx            # Message search overlay
├── new-conversation-dialog.tsx   # Create conversation dialog
├── attachment-upload.tsx         # File attachment upload UI
├── auto-scroller.tsx             # Auto-scroll to latest message
├── empty-state.tsx               # Empty state placeholder
├── notification-helpers.ts       # Notification utility functions
├── upload-actions.ts             # File upload server actions
├── whatsapp-bridge.ts            # WhatsApp dual-delivery bridge (Evolution API)
├── og-unfurl.ts                  # Link preview / OG metadata extraction
├── link-preview.tsx              # Link preview component
├── mail-icon.tsx                 # Header mail icon with unread badge
├── audit.ts                      # Audit logging for messaging actions
├── index.ts                      # Public exports
├── hooks/
│   ├── index.ts
│   ├── use-realtime-messages.ts  # Real-time message subscription hook
│   └── use-presence.ts           # User online presence hook
├── contacts/
│   ├── config.ts                 # Contact categories per role
│   ├── types.ts                  # ContactDTO, ContactGroup types
│   ├── queries.ts                # Contact queries with domain model enrichment
│   ├── contacts-panel.tsx        # WhatsApp-style contacts sidebar
│   ├── contact-card.tsx          # Individual contact card
│   └── contact-search.tsx        # Contact search input
├── QUERY_OPTIMIZATION.md         # Performance optimization notes
└── __tests__/
    ├── actions.test.ts           # Action unit tests
    ├── authorization.test.ts     # Authorization tests
    ├── multi-tenant.test.ts      # Multi-tenant isolation tests
    ├── validation.test.ts        # Validation tests
    ├── whatsapp-bridge.test.ts   # WhatsApp bridge tests (32 tests)
    ├── link-preview.test.ts      # Link preview tests
    └── rtl-verification.test.ts  # RTL layout verification tests
```

### Status

**Completion:** 90% | **Blockers:** Real-time WebSocket/SSE infrastructure TBD (polling fallback active)

### WhatsApp Integration

Messages sent in-app are automatically dual-delivered to WhatsApp when the school has an active WhatsApp session. The integration is bidirectional -- incoming WhatsApp replies are bridged back into conversations.

**Key files:**

- `whatsapp-bridge.ts` -- Dispatch, phone resolution (Guardian > Teacher > StaffMember), retry with exponential backoff
- `src/lib/whatsapp/evolution-client.ts` -- REST client for self-hosted Evolution API
- `src/app/api/webhooks/whatsapp/route.ts` -- Webhook handler for incoming messages and status updates
- `src/app/api/cron/process-whatsapp-notifications/route.ts` -- Retry failed dispatches every 5 minutes

**How it works:**

1. `createConversation()` checks for active WhatsApp session -- auto-enables if connected
2. `sendMessage()` calls `dispatchMessageToWhatsApp()` non-blocking when `conversation.whatsappEnabled`
3. Phone numbers resolved from domain models: Guardian > Teacher > StaffMember
4. Rate limited: 1 msg/sec, 500 DMs/day per school
5. Failed dispatches retried with exponential backoff (max 5 attempts)
6. Chat header has a **W** toggle to enable/disable per conversation
7. Message bubbles show WhatsApp delivery status (sent/delivered/read/failed)

### Integration Points

- `src/components/school-dashboard/communication/` -- Broadcast and announcement system
- `src/lib/dispatch-notification.ts` -- Push notification on new messages
- `src/lib/whatsapp/` -- WhatsApp Evolution API client, rate limiter, templates
- `src/components/school-dashboard/whatsapp/` -- WhatsApp admin dashboard (QR connection, groups, templates)
- Route: `src/app/[lang]/s/[subdomain]/(school-messaging)/messages/page.tsx`
- Header icon: `mail-icon.tsx` with unread badge (polls `/api/messages/unread-count` every 30s)
- Prisma models: Conversation, ConversationParticipant, Message, MessageReaction, WhatsAppSession, WhatsAppMessage
