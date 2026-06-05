// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ComplianceProvider, ConnectorMode } from "@prisma/client"
import { describe, expect, it } from "vitest"

import { getConnector, listConnectorsForProvider } from "../registry"

describe("compliance connector registry", () => {
  describe("getConnector", () => {
    it("returns ADEK DRY_RUN connector", () => {
      const c = getConnector(
        ComplianceProvider.ADEK_ESIS,
        ConnectorMode.DRY_RUN
      )

      expect(c).toBeDefined()
      expect(c?.mode).toBe(ConnectorMode.DRY_RUN)
    })

    it("returns ADEK PIGGYBACK connector", () => {
      const c = getConnector(
        ComplianceProvider.ADEK_ESIS,
        ConnectorMode.PIGGYBACK
      )

      expect(c).toBeDefined()
      expect(c?.mode).toBe(ConnectorMode.PIGGYBACK)
    })

    it("returns ADEK OFFICIAL_API connector", () => {
      const c = getConnector(
        ComplianceProvider.ADEK_ESIS,
        ConnectorMode.OFFICIAL_API
      )

      expect(c).toBeDefined()
      expect(c?.mode).toBe(ConnectorMode.OFFICIAL_API)
    })

    it("returns ADEK RPA connector", () => {
      const c = getConnector(ComplianceProvider.ADEK_ESIS, ConnectorMode.RPA)

      expect(c).toBeDefined()
      expect(c?.mode).toBe(ConnectorMode.RPA)
    })

    it("returns null when DISABLED mode (not registered)", () => {
      const c = getConnector(
        ComplianceProvider.ADEK_ESIS,
        ConnectorMode.DISABLED
      )

      expect(c).toBeNull()
    })
  })

  describe("listConnectorsForProvider", () => {
    it("returns all 4 ADEK connectors (DRY_RUN, PIGGYBACK, OFFICIAL_API, RPA)", () => {
      const list = listConnectorsForProvider(ComplianceProvider.ADEK_ESIS)

      expect(list).toHaveLength(4)
      const modes = list.map((c) => c.mode)
      expect(modes).toContain(ConnectorMode.DRY_RUN)
      expect(modes).toContain(ConnectorMode.PIGGYBACK)
      expect(modes).toContain(ConnectorMode.OFFICIAL_API)
      expect(modes).toContain(ConnectorMode.RPA)
    })
  })

  describe("connector contract", () => {
    it("every connector has id, mode, isConfigured, submit", () => {
      const all = listConnectorsForProvider(ComplianceProvider.ADEK_ESIS)

      for (const c of all) {
        expect(c.id).toBeTypeOf("string")
        expect(c.mode).toBeTypeOf("string")
        expect(c.isConfigured).toBeTypeOf("function")
        expect(c.submit).toBeTypeOf("function")
      }
    })
  })
})
