---
feature: settings
title: Personal Settings
status: partial
pillar: school-operations
personas: [teacher, parent, student, principal]
routes: [/ar/s/{school}/settings]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Personal Settings — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every person who signs in — teacher, parent, student or administrator — has one page to pick their colours, their language and their password.

## The school's day without it

A teacher who wants the screen in English has to ask someone to change it for the whole school. A parent given a temporary password keeps it forever because nobody showed them where to change it. Everyone sees the same screen whether they like it or not.

## What happens in Balqalam

1. Anyone signed in opens Settings (الإعدادات) from the sidebar — it is there for every role.
2. The page has four tabs: Appearance (المظهر), Notifications (الإشعارات), Password (كلمة المرور) and Language (اللغة).
3. Under Appearance they tap one of the ready-made colour themes and the whole dashboard changes at once.
4. Under Password they type their current password and a new one twice; the new one takes effect immediately. Someone who signed in with Google and never had a password can set one here.
5. Under Language they choose Arabic (right to left) or English (left to right), and the same page reloads in that language.

## Who it is for

- Teacher: changes the temporary password from the school and reads the screen in the language they prefer.
- Parent: sets their own password and switches between Arabic and English.
- Student: picks a colour theme they like.
- Principal: one place to send staff when they ask "how do I change my password?".

## Real screens to show

None yet — capture with /record. Routes to capture (Arabic first):

- /ar/s/{school}/settings — Appearance tab with the theme gallery
- /ar/s/{school}/settings — Password tab
- /ar/s/{school}/settings — Language tab showing Arabic and English side by side

Note: settings-ar.png in the repo root is not this page — it shows a reading-theme sheet over the Quick Guide card. Do not use it here.

## What you can say

- Every role has a Settings page, reachable from the sidebar. [src/components/template/platform-sidebar/config.ts]
- Anyone can change their own password; the current password is required first. [password/actions.ts]
- People who signed in with a Google account can add a password without knowing an old one. [password/actions.ts]
- Changing your password clears the school's "must change on next sign-in" flag. [password/actions.ts]
- The interface switches between Arabic (right to left) and English (left to right) from the Language tab. [content-enhanced.tsx]
- Ready-made colour themes change the look of the dashboard in one tap. [appearance-settings.tsx]

## Do not say

- Do not say notification choices are saved to the person's account. The Notifications tab (email, push, text message, quiet hours) only remembers choices in that one browser, and does not yet change what gets sent. [notification-settings.tsx]
- Do not promise "build your own theme". The custom theme builder says "coming soon".
- The chosen colour theme is remembered on that device, not across all of a person's devices.
- The README lists roles, permissions and academic-year setup under Settings — those moved to the School area. Do not describe them here. [ISSUE.md]
- No "advanced personalisation", no percentages, no time saved.

## Post angles

1. "Got a temporary password from the school? Here's where to change it." — parent — product-proof — a how-to showing the Password tab in three steps.
2. "Arabic or English — each person chooses, not the whole school." — teacher — product-proof — the Language tab switching the same page between directions.
3. "Same school, your colours." — student — product-proof — tapping through the ready-made themes.
4. "A teacher once asked us: can I have it in English? Yes — just for you." — teacher — school-operations — a persona view on a mixed-language staff room.
5. "What is the first thing you change when you get a new system?" — principal — trust — a question post that lands on the Settings page.

## Connects to

- [School Control Center](../school/SPOTLIGHT.md) — school-wide settings (name, branding, modules, members) live there, not here.
- [Credentials](../listings/credentials/SPOTLIGHT.md) — the temporary logins the school hands out are changed here by the person who receives them.

## Sources

- src/components/school-dashboard/settings/README.md
- src/components/school-dashboard/settings/ISSUE.md
- src/components/school-dashboard/settings/content-enhanced.tsx
- src/components/school-dashboard/settings/appearance-settings.tsx
- src/components/school-dashboard/settings/notification-settings.tsx
- src/components/school-dashboard/settings/password/actions.ts
- src/components/school-dashboard/settings/password/validation.ts
- src/components/school-dashboard/settings/ai-settings-actions.ts
- src/components/theme/preset-gallery.tsx
- src/store/theme-editor-store.ts
- src/components/template/platform-sidebar/config.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/settings/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/layout.tsx
- src/components/internationalization/school-ar.json, school-en.json (settings)
- content/docs-en/marketing-brief.mdx
