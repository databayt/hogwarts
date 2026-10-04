# whatsapp — open items

- [x] Classes retired (class removal S11, 2026-10-04): auto groups are a
      section's parents only — the `class_parents` path (a raw "Class ID" box)
      and `getGuardianPhonesForClass` are gone; existing `class_parents` groups
      keep their type and label. A group tied to a section must be this
      school's section (it wasn't checked). Test:
      `src/tests/school-dashboard/whatsapp/groups.test.ts`.
- [ ] The auto-group dialog still asks for a raw section ID — make it a
      section picker.
- [ ] **Pair the King Fahad line** — someone with the school's WhatsApp phone
      scans the QR from the dashboard (Connect). Until then the lane is built
      but idle. (2026-09-13)
- [ ] Media to S3 — `S3_ENABLED` stays off in `cf/entry.cjs` until the AWS pair
      is rotated (kun#156); inbound media is fetched as base64 meanwhile.
- [ ] Evolution stores contacts/chats in Neon with its defaults; revisit the
      `DATABASE_SAVE_*` flags if the `evolution` database grows.
- [ ] `EVOLUTION_VERSION` is pinned to 2.3.7; bump deliberately (the emulated
      `npm ci` layer rebuilds, ~15 min on the Mac).
- [x] Railway trial expired → bridge offline (found 2026-09-13) → embedded in
      the balqalam container instead, $0.
- [x] Webhook URL pointed at the dead Vercel host via `NEXT_PUBLIC_APP_URL` →
      `WHATSAPP_WEBHOOK_BASE_URL` override (2026-09-13).
