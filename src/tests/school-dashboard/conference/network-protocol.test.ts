// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { classifyFromStats } from "@/components/school-dashboard/conference/network-protocol"

/** Build a Map-backed RTCStatsReport stand-in from raw stat rows. */
function report(stats: Array<Record<string, unknown>>): RTCStatsReport {
  return new Map(
    stats.map((s) => [s.id as string, s])
  ) as unknown as RTCStatsReport
}

describe("classifyFromStats", () => {
  it("relay over TLS → turn-tcp-443", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "relay",
            relayProtocol: "tls",
            protocol: "udp",
            port: 5349,
          },
        ])
      )
    ).toBe("turn-tcp-443")
  })

  it("relay over TCP → turn-tcp-443", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "relay",
            protocol: "tcp",
            port: 3478,
          },
        ])
      )
    ).toBe("turn-tcp-443")
  })

  it("relay on port 443 → turn-tcp-443", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "relay",
            protocol: "udp",
            port: 443,
          },
        ])
      )
    ).toBe("turn-tcp-443")
  })

  it("relay over UDP → turn-udp", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "relay",
            relayProtocol: "udp",
            protocol: "udp",
            port: 49152,
          },
        ])
      )
    ).toBe("turn-udp")
  })

  it("server-reflexive → direct-udp", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "srflx",
            protocol: "udp",
            port: 51820,
          },
        ])
      )
    ).toBe("direct-udp")
  })

  it("host candidate → direct-udp", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "L" },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "host",
            protocol: "udp",
            port: 60000,
          },
        ])
      )
    ).toBe("direct-udp")
  })

  it("falls back to a nominated pair when transport has no pointer", () => {
    expect(
      classifyFromStats(
        report([
          {
            type: "candidate-pair",
            id: "P",
            nominated: true,
            localCandidateId: "L",
          },
          {
            type: "local-candidate",
            id: "L",
            candidateType: "host",
            protocol: "udp",
          },
        ])
      )
    ).toBe("direct-udp")
  })

  it("no resolvable pair → unknown", () => {
    expect(classifyFromStats(report([{ type: "transport", id: "T" }]))).toBe(
      "unknown"
    )
  })

  it("selected pair with a missing local candidate → unknown", () => {
    expect(
      classifyFromStats(
        report([
          { type: "transport", id: "T", selectedCandidatePairId: "P" },
          { type: "candidate-pair", id: "P", localCandidateId: "MISSING" },
        ])
      )
    ).toBe("unknown")
  })
})
