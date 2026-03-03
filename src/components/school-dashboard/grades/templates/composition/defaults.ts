// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CertificateCompositionConfig } from "./types"

export const DEFAULT_CERT_COMPOSITION: CertificateCompositionConfig = {
  slots: {
    header: "crest",
    title: "elegant",
    recipient: "centered",
    body: "achievement",
    scores: "badge-row",
    signatures: "dual",
    footer: "verification",
  },
  decorations: {
    border: { enabled: true, style: "gold", width: 2 },
    cornerOrnaments: { enabled: true },
    seal: { enabled: false },
    watermark: { enabled: false },
    ribbon: { enabled: false },
  },
  slotProps: {},
}
