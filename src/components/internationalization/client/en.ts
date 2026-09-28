// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// GENERATED from ../namespaces.ts — the whole English dictionary as one static module.
// Same merge as the server `getDictionary`: the four flat files spread in
// order, then every feature namespace nested under its key. Regenerate when
// a namespace is added (the test in src/tests/i18n/client-dictionary.test.ts
// fails until you do).

import type { Dictionary } from "../dictionaries"
import admin from "../dictionaries/en/admin.json"
import attendance from "../dictionaries/en/attendance.json"
import banking from "../dictionaries/en/banking.json"
import compliance from "../dictionaries/en/compliance.json"
import finance from "../dictionaries/en/finance.json"
import generate from "../dictionaries/en/generate.json"
import lab from "../dictionaries/en/lab.json"
import library from "../dictionaries/en/library.json"
import liveClasses from "../dictionaries/en/live-classes.json"
import marking from "../dictionaries/en/marking.json"
import messages from "../dictionaries/en/messages.json"
import messaging from "../dictionaries/en/messaging.json"
import notifications from "../dictionaries/en/notifications.json"
import parentPortal from "../dictionaries/en/parentPortal.json"
import profile from "../dictionaries/en/profile.json"
import results from "../dictionaries/en/results.json"
import sales from "../dictionaries/en/sales.json"
import transportation from "../dictionaries/en/transportation.json"
import whatsapp from "../dictionaries/en/whatsapp.json"
import general from "../en.json"
import lumos from "../lumos-en.json"
import operator from "../operator-en.json"
import school from "../school-en.json"

export const dictionary = {
  ...general,
  ...school,
  ...lumos,
  ...operator,
  library,
  banking,
  marking,
  generate,
  results,
  finance,
  admin,
  profile,
  notifications,
  messages,
  lab,
  sales,
  attendance,
  messaging,
  whatsapp,
  transportation,
  compliance,
  liveClasses,
  parentPortal,
} as unknown as Dictionary
