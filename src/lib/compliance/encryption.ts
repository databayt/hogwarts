// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * Reversible secret encryption for per-school regulator credentials.
 *
 * Algorithm: AES-256-GCM (authenticated encryption — tampering detected).
 *
 * Key sourcing: `COMPLIANCE_ENCRYPTION_KEY` env var, 32 bytes hex (64 chars).
 * Rotation: additional versions read from `COMPLIANCE_ENCRYPTION_KEY_V<N>`.
 *
 * Ciphertext layout (base64): `<iv:12><authTag:16><ciphertext:N>`.
 * The keyVersion is stored in a separate Prisma column, not embedded — so the
 * envelope can be re-encrypted under a new key without re-uploading the payload.
 */

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

function readKey(version: number): Buffer {
  const envName =
    version === 1
      ? "COMPLIANCE_ENCRYPTION_KEY"
      : `COMPLIANCE_ENCRYPTION_KEY_V${version}`
  const hex = process.env[envName]
  if (!hex) {
    throw new Error(
      `[compliance/encryption] Missing env var ${envName}. ` +
        `Generate with: openssl rand -hex 32`
    )
  }
  const buf = Buffer.from(hex, "hex")
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      `[compliance/encryption] ${envName} must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars), got ${buf.length}`
    )
  }
  return buf
}

export function encryptSecret(plaintext: string): {
  ciphertext: string
  keyVersion: number
} {
  const keyVersion = 1
  const key = readKey(keyVersion)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  const envelope = Buffer.concat([iv, authTag, encrypted]).toString("base64")
  return { ciphertext: envelope, keyVersion }
}

export function decryptSecret(ciphertext: string, keyVersion: number): string {
  const envelope = Buffer.from(ciphertext, "base64")
  if (envelope.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("[compliance/encryption] Ciphertext too short")
  }
  const iv = envelope.subarray(0, IV_LENGTH)
  const authTag = envelope.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const data = envelope.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const key = readKey(keyVersion)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  )
}

/** Re-encrypt under the latest key version. Used during key rotation. */
export function rotateSecret(
  ciphertext: string,
  oldKeyVersion: number,
  newKeyVersion = 1
): { ciphertext: string; keyVersion: number } {
  const plaintext = decryptSecret(ciphertext, oldKeyVersion)
  if (newKeyVersion === 1) return encryptSecret(plaintext)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, readKey(newKeyVersion), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([iv, authTag, encrypted]).toString("base64"),
    keyVersion: newKeyVersion,
  }
}
