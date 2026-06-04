---
epic: 06
sprint: Q3-2026
title: Communication
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

## Communication — School communication hub for announcements, broadcasts, and notifications

### Overview

Unified communication hub providing a centralized interface for school-wide announcements, broadcast messaging, notification management, and template-based communications. The client component implements a full-featured UI with conversation threads, file sharing, user presence, and multi-channel support (email, SMS, in-app).

### Capabilities by Role

- **ADMIN**: Full access -- compose broadcasts, manage templates, configure settings
- **TEACHER**: Send class-level announcements (TBD)
- **STAFF**: View and manage communications (TBD)

### Routes

| Route                                                                     | Page                   | Status |
| ------------------------------------------------------------------------- | ---------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/communication`           | Communication hub      | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/communication/broadcast` | Broadcast composer     | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/communication/templates` | Message templates      | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/school/communication/settings`  | Communication settings | Ready  |

### File Structure

```
src/components/school-dashboard/communication/
└── hub.tsx  # Client component -- full communication hub UI
```

### Status

**Completion:** 40% | **Blockers:** Single-file implementation; needs decomposition into actions/queries/authorization

### Integration Points

- `src/components/school-dashboard/messaging/` -- Direct messaging (1:1 and group chats)
- `src/lib/dispatch-notification.ts` -- Notification dispatch system
- Route pages at `src/app/[lang]/s/[subdomain]/(school-dashboard)/school/communication/`

### Agents & Skills

- `agent:nextjs` — Socket.io + webhook routes
- `agent:react` — messaging surface
- `agent:comment` — copy + i18n strings
- `skill:/wire` — UI layer sweep
- `skill:/check` — quality gate
