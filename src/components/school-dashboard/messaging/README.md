## Messaging — Real-time direct messages and group chats

### Overview

Full-featured messaging system supporting 1:1 direct messages and group conversations within a school. Includes cursor-based message pagination, read receipts, emoji reactions, conversation muting/archiving/pinning, file attachments, message search, typing indicators, online/offline presence, and real-time updates via Socket.IO. All operations are multi-tenant scoped -- participants must belong to the same school.

### Capabilities by Role

- **ADMIN**: Full access -- create conversations, manage participants, view all school conversations
- **TEACHER**: Direct messages with other staff, students, guardians; group chats for classes
- **STUDENT**: Direct messages with teachers (if configured), group chats
- **GUARDIAN**: Direct messages with teachers and admin
- **STAFF**: Direct messages with all school members

### Routes

| Route                                               | Page                | Status |
| --------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-messaging)/messages` | Messaging interface | Ready  |

Note: Uses standalone full-screen layout (`(school-messaging)` route group) with no header/sidebar/footer.

### File Structure

```
src/components/school-dashboard/messaging/
├── actions.ts                      # 28 server actions (conversations, messages, reactions, search, polling)
├── queries.ts                      # 25+ read-only DB queries (lists, stats, unread, search, participants)
├── authorization.ts                # RBAC and participant-level permission checks
├── validation.ts                   # Zod schemas for message/conversation input
├── serialization.ts                # Date serialization for client transfer
├── config.ts                       # Conversation types, roles, statuses, file limits, socket events, RBAC
├── types.ts                        # 20+ TypeScript DTOs and type definitions
├── content.tsx                     # Server component (entry point, data fetching + translation)
├── messaging-client.tsx            # Main client component (split-pane layout, Socket.IO wiring)
├── conversation-list.tsx           # Conversation sidebar
├── conversation-card.tsx           # Single conversation preview card
├── conversation-info-panel.tsx     # Conversation details panel (participants, media, actions)
├── chat-interface.tsx              # Active chat view
├── message-list.tsx                # Scrollable message list
├── message-group.tsx               # Grouped messages by sender
├── message-bubble.tsx              # Individual message bubble (with WhatsApp status)
├── message-input.tsx               # Compose area with attachment support
├── message-search.tsx              # Message search overlay
├── new-conversation-dialog.tsx     # Create conversation dialog
├── attachment-upload.tsx           # File attachment upload UI
├── auto-scroller.tsx               # Auto-scroll to latest message
├── empty-state.tsx                 # Empty state placeholder
├── notification-helpers.ts         # Push notification utilities
├── upload-actions.ts               # File upload server actions
├── whatsapp-bridge.ts              # WhatsApp dual-delivery bridge (Evolution API)
├── whatsapp-settings-dialog.tsx    # WhatsApp QR connect/disconnect dialog
├── og-unfurl.ts                    # Server-side Open Graph metadata extraction
├── link-preview.tsx                # Link preview card component
├── mail-icon.tsx                   # Header mail icon with unread badge (polls + Socket.IO)
├── audit.ts                        # Audit logging (13 event types)
├── index.ts                        # Public barrel exports
├── hooks/
│   ├── index.ts
│   ├── use-realtime-messages.ts    # Socket.IO real-time subscription hook (15 events)
│   └── use-presence.ts             # Online/offline presence tracking hook (Redis-backed)
├── contacts/
│   ├── config.ts                   # Role-based contact categories + sidebar filters
│   ├── types.ts                    # ContactDTO, ContactCategory, SidebarFilter types
│   ├── queries.ts                  # Contact queries with domain model enrichment
│   ├── contacts-panel.tsx          # WhatsApp-style contacts sidebar
│   ├── contact-card.tsx            # Individual contact card
│   └── contact-search.tsx          # Contact search input
├── QUERY_OPTIMIZATION.md           # Performance optimization guide
└── __tests__/
    ├── actions.test.ts             # Action unit tests
    ├── authorization.test.ts       # Authorization tests
    ├── multi-tenant.test.ts        # Multi-tenant isolation tests
    ├── validation.test.ts          # Validation tests
    ├── whatsapp-bridge.test.ts     # WhatsApp bridge tests (32 tests)
    ├── link-preview.test.ts        # Link preview tests
    └── rtl-verification.test.ts    # RTL layout verification tests
```

### Status

**Completion:** 100% | **Blockers:** None (Socket.IO server deploy-ready, polling fallback active until `fly deploy`)

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
