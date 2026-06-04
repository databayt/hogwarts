// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { randomBytes } from "node:crypto"
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { decryptSecret, encryptSecret, rotateSecret } from "../encryption"

const KEY_V1 = randomBytes(32).toString("hex")
const KEY_V2 = randomBytes(32).toString("hex")

describe("compliance/encryption (AES-256-GCM)", () => {
  const originalEnv = { ...process.env }

  beforeAll(() => {
    process.env.COMPLIANCE_ENCRYPTION_KEY = KEY_V1
    process.env.COMPLIANCE_ENCRYPTION_KEY_V2 = KEY_V2
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    process.env.COMPLIANCE_ENCRYPTION_KEY = KEY_V1
    process.env.COMPLIANCE_ENCRYPTION_KEY_V2 = KEY_V2
  })

  describe("encryptSecret", () => {
    it("encrypts and returns ciphertext + keyVersion=1", () => {
      const envelope = encryptSecret("hello world")

      expect(envelope.ciphertext).toBeTypeOf("string")
      expect(envelope.keyVersion).toBe(1)
      expect(envelope.ciphertext).not.toContain("hello world")
    })

    it("produces different ciphertext for same input (random IV)", () => {
      const a = encryptSecret("same input")
      const b = encryptSecret("same input")

      expect(a.ciphertext).not.toBe(b.ciphertext)
    })

    it("throws when key env var is missing", () => {
      delete process.env.COMPLIANCE_ENCRYPTION_KEY

      expect(() => encryptSecret("oops")).toThrow(
        /Missing env var COMPLIANCE_ENCRYPTION_KEY/
      )
    })

    it("throws when key is wrong length", () => {
      process.env.COMPLIANCE_ENCRYPTION_KEY = "shortkey"

      expect(() => encryptSecret("oops")).toThrow(/must be 32 bytes/)
    })
  })

  describe("decryptSecret", () => {
    it("round-trips plaintext", () => {
      const original = JSON.stringify({ apiKey: "sk-test-123", user: "esis" })
      const envelope = encryptSecret(original)

      const decrypted = decryptSecret(envelope.ciphertext, envelope.keyVersion)

      expect(decrypted).toBe(original)
    })

    it("throws when ciphertext is too short", () => {
      expect(() => decryptSecret("short", 1)).toThrow(/too short/)
    })

    it("throws when tampered (auth tag mismatch)", () => {
      const envelope = encryptSecret("secret")
      const buf = Buffer.from(envelope.ciphertext, "base64")
      buf[buf.length - 1] ^= 0xff // flip last byte
      const tampered = buf.toString("base64")

      expect(() => decryptSecret(tampered, envelope.keyVersion)).toThrow()
    })

    it("throws when key version is missing from env", () => {
      const envelope = encryptSecret("x")
      delete process.env.COMPLIANCE_ENCRYPTION_KEY

      expect(() =>
        decryptSecret(envelope.ciphertext, envelope.keyVersion)
      ).toThrow(/Missing env var/)
    })
  })

  describe("rotateSecret", () => {
    it("re-encrypts under same key version (default v1 → v1)", () => {
      const v1 = encryptSecret("rotate me")
      const rotated = rotateSecret(v1.ciphertext, 1)

      expect(rotated.keyVersion).toBe(1)
      expect(rotated.ciphertext).not.toBe(v1.ciphertext) // new IV → new ciphertext
      expect(decryptSecret(rotated.ciphertext, 1)).toBe("rotate me")
    })

    it("re-encrypts under a newer key version (v1 → v2)", () => {
      const v1 = encryptSecret("rotate me to v2")
      const rotated = rotateSecret(v1.ciphertext, 1, 2)

      expect(rotated.keyVersion).toBe(2)
      expect(decryptSecret(rotated.ciphertext, 2)).toBe("rotate me to v2")
    })

    it("cannot decrypt v2-encrypted blob with v1 key", () => {
      const v2Envelope = rotateSecret(encryptSecret("data").ciphertext, 1, 2)

      expect(() => decryptSecret(v2Envelope.ciphertext, 1)).toThrow()
    })
  })
})
