// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// GENERATED from ../namespaces.ts — the whole Arabic dictionary as one static module.
// Same merge as the server `getDictionary`: the four flat files spread in
// order, then every feature namespace nested under its key. Regenerate when
// a namespace is added (the test in src/tests/i18n/client-dictionary.test.ts
// fails until you do).

import general from "../ar.json"
import type { Dictionary } from "../dictionaries"
import admin from "../dictionaries/ar/admin.json"
import attendance from "../dictionaries/ar/attendance.json"
import banking from "../dictionaries/ar/banking.json"
import compliance from "../dictionaries/ar/compliance.json"
import finance from "../dictionaries/ar/finance.json"
import generate from "../dictionaries/ar/generate.json"
import lab from "../dictionaries/ar/lab.json"
import library from "../dictionaries/ar/library.json"
import liveClasses from "../dictionaries/ar/live-classes.json"
import marking from "../dictionaries/ar/marking.json"
import messages from "../dictionaries/ar/messages.json"
import messaging from "../dictionaries/ar/messaging.json"
import notifications from "../dictionaries/ar/notifications.json"
import parentPortal from "../dictionaries/ar/parentPortal.json"
import profile from "../dictionaries/ar/profile.json"
import results from "../dictionaries/ar/results.json"
import sales from "../dictionaries/ar/sales.json"
import transportation from "../dictionaries/ar/transportation.json"
import whatsapp from "../dictionaries/ar/whatsapp.json"
import lumos from "../lumos-ar.json"
import operator from "../operator-ar.json"
import school from "../school-ar.json"

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
