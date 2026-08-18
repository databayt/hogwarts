/**
 * Twenty CRM webhook verification and event parsing.
 *
 * VENDORED from `mkan/src/lib/twenty-webhook.ts` (2026-08-18), identical below
 * this header. mkan hit the problem first and hardened the fix there; hogwarts
 * is the second consumer — the same path `scripts/crm/twenty-rest.ts` took.
 *
 * With two consumers this is now a candidate for a shared package. Deliberately
 * not done yet: extracting on the second copy usually means designing the
 * interface before the second caller has taught you what it needs.
 *
 * ── What it defends against ─────────────────────────────────────────────────
 *
 * mkan's receiver spent its whole life reading `{ event, object, action }`,
 * which Twenty does not send. Every branch guard compared `undefined`, every
 * delivery fell through, and it answered HTTP 200 — so both ends read healthy
 * while nothing was processed. A real delivery, verified against the fork's
 * `call-webhook.job.ts` / `webhook-job-data.type.ts`, is:
 *
 *   { targetUrl, eventName, objectMetadata: { id, nameSingular }, workspaceId,
 *     webhookId, eventDate, record, updatedFields?, userId?, workspaceMemberId? }
 *
 * Twenty signs with three headers, not an Authorization bearer:
 *
 *   X-Twenty-Webhook-Timestamp  Date.now().toString()
 *   X-Twenty-Webhook-Signature  HMAC-SHA256(secret, `${timestamp}:${body}`) hex
 *   X-Twenty-Webhook-Nonce      random hex, for replay protection
 *
 * The signature covers the payload with `secret` already stripped — exactly the
 * bytes we receive — so verification runs against the RAW body text, never a
 * re-stringified parse whose key order and spacing are not guaranteed to match.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Twenty's `DatabaseEventAction` values. `destroyed` is a hard delete; `deleted` is soft. */
export type TwentyAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'destroyed'
  | 'restored'
  | 'upserted';

export interface TwentyEvent {
  /** Object name, e.g. "home", "host", "opportunity", "company". */
  object: string;
  action: TwentyAction | string;
  /** The full `object.action` string as Twenty sent it. */
  eventName: string;
  record: Record<string, any>;
  /** Present on update events — lets a handler react only to the fields it cares about. */
  updatedFields: string[];
  webhookId?: string;
  eventDate?: string;
}

export type VerifyResult =
  | { ok: true; reason?: never }
  | { ok: false; reason: string };

/** Deliveries older than this are rejected, so a captured request cannot be replayed later. */
export const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

/**
 * Verify a Twenty webhook delivery against the shared secret.
 *
 * `rawBody` MUST be the unparsed request text. Re-serializing a parsed object
 * can reorder keys or change spacing, and the HMAC is over exact bytes.
 */
export function verifyTwentySignature(args: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string | undefined;
  now?: number;
}): VerifyResult {
  const { rawBody, signature, timestamp, secret } = args;
  const now = args.now ?? Date.now();

  // No secret configured is a deployment error, not a reason to accept. The old
  // behaviour — open endpoint when unset — is how an unauthenticated caller
  // could have driven listing publish state.
  if (!secret) return { ok: false, reason: 'no_secret_configured' };
  if (!signature || !timestamp) return { ok: false, reason: 'missing_signature_headers' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' };
  if (Math.abs(now - ts) > MAX_TIMESTAMP_SKEW_MS) return { ok: false, reason: 'stale_timestamp' };

  const expected = createHmac('sha256', secret).update(`${timestamp}:${rawBody}`).digest('hex');

  // Compare in constant time. Length must match first — timingSafeEqual throws
  // on differing lengths, which would itself leak length through an exception.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return { ok: false, reason: 'bad_signature' };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: 'bad_signature' };

  return { ok: true };
}

/**
 * Normalize a Twenty delivery into `{ object, action, record, updatedFields }`.
 *
 * `objectMetadata.nameSingular` is authoritative for the object when present —
 * `eventName` is only split as a fallback, because an object name could in
 * principle contain a dot even though none does today.
 *
 * Returns null when the body carries no usable event, so the caller answers
 * 400 instead of returning a cheerful 200 for something it did not understand.
 */
export function parseTwentyEvent(body: any): TwentyEvent | null {
  if (!body || typeof body !== 'object') return null;

  const eventName: string | undefined =
    typeof body.eventName === 'string' ? body.eventName : undefined;

  const fromMetadata: string | undefined =
    typeof body.objectMetadata?.nameSingular === 'string'
      ? body.objectMetadata.nameSingular
      : undefined;

  let object = fromMetadata;
  let action: string | undefined;

  if (eventName) {
    const dot = eventName.lastIndexOf('.');
    if (dot > 0) {
      object = object ?? eventName.slice(0, dot);
      action = eventName.slice(dot + 1);
    }
  }

  if (!object || !action) return null;
  if (!body.record || typeof body.record !== 'object') return null;

  return {
    object,
    action,
    eventName: eventName ?? `${object}.${action}`,
    record: body.record,
    updatedFields: Array.isArray(body.updatedFields) ? body.updatedFields : [],
    webhookId: typeof body.webhookId === 'string' ? body.webhookId : undefined,
    eventDate: typeof body.eventDate === 'string' ? body.eventDate : undefined,
  };
}
