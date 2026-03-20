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
├── audit.ts                      # Audit logging for messaging actions
├── index.ts                      # Public exports
├── hooks/
│   ├── index.ts
│   └── use-realtime-messages.ts  # Real-time message subscription hook
├── QUERY_OPTIMIZATION.md         # Performance optimization notes
└── __tests__/
    ├── actions.test.ts           # Action unit tests
    ├── authorization.test.ts     # Authorization tests
    ├── multi-tenant.test.ts      # Multi-tenant isolation tests
    └── validation.test.ts        # Validation tests
```

### Status

**Completion:** 80% | **Blockers:** Real-time WebSocket/SSE infrastructure TBD

### Integration Points

- `src/components/school-dashboard/communication/` -- Broadcast and announcement system
- `src/lib/dispatch-notification.ts` -- Push notification on new messages
- Route: `src/app/[lang]/s/[subdomain]/(school-dashboard)/messages/page.tsx`
- Prisma models: Conversation, ConversationParticipant, Message, MessageReaction
