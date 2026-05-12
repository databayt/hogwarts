/**
 * Hogwarts-specific adapter for the shared report pipeline.
 *
 * Auth: hogwarts uses `@/auth` (next-auth v5) with rich session shape
 * (id, role, schoolId). User roles span DEVELOPER, ADMIN, TEACHER, GUARDIAN,
 * STUDENT, ACCOUNTANT, STAFF — all mapped in ROLE_BASE in score.ts.
 *
 * Rate-limit + dedup + corroboration: Upstash REST. Hogwarts already has the
 * @upstash/ratelimit + @upstash/redis packages but its existing rate-limit.ts
 * is request-shaped, not server-action-shaped, so we add a focused
 * report-specific assertion here.
 */

import { createHash } from "crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { auth } from "@/auth";

import {
  RateLimitError,
  type ReportAdapter,
} from "./adapters/adapter";
import type { PipelineEvent, ReporterContext, ReportInput } from "./types";

const REPO = process.env.GITHUB_REPO || "databayt/hogwarts";
const SALT = process.env.REPORT_IP_SALT || "hogwarts-default-salt";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const reportLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/report",
    })
  : null;

const reportTenantLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/report-tenant",
    })
  : null;

export const hogwartsReportAdapter: ReportAdapter = {
  repo: REPO,
  hostAllowlist: [
    "*.databayt.org",
    "databayt.org",
    "ed.databayt.org",
    "localhost",
    "127.0.0.1",
  ],

  async getReporter(_input: ReportInput): Promise<ReporterContext> {
    const ip = await getClientIpFromHeaders();
    const ipHash = hashIp(ip);

    const session = await auth().catch(() => null);
    const sessionUser = session?.user as
      | { id?: string; role?: string; email?: string | null }
      | undefined;
    if (sessionUser?.id) {
      return {
        kind: "authenticated",
        userId: sessionUser.id,
        role: sessionUser.role ?? "USER",
        emailVerified: Boolean(sessionUser.email),
        accountAgeDays: 30, // Phase 1 constant; Phase 2 reads from User.createdAt
        isSuspended: false,
        ipHash,
      };
    }
    return { kind: "anonymous", ipHash };
  },

  async checkRateLimit(identifier: string): Promise<void> {
    if (process.env.NODE_ENV === "development" || !redis) return;
    if (reportLimiter) {
      const r = await reportLimiter.limit(identifier);
      if (!r.success) throw new RateLimitError();
    }
    if (reportTenantLimiter) {
      const r = await reportTenantLimiter.limit("hogwarts");
      if (!r.success) throw new RateLimitError();
    }
  },

  async getRecentSelfSubmissions(identifier: string, withinSec: number): Promise<string[]> {
    if (!redis) return [];
    const key = `report:dedup:${identifier}`;
    const raw = (await redis.lrange<string>(key, 0, 19).catch(() => null)) ?? [];
    const cutoff = Date.now() - withinSec * 1000;
    return raw
      .map((s) => {
        const idx = s.indexOf("|");
        if (idx < 0) return null;
        const ts = Number(s.slice(0, idx));
        const head = s.slice(idx + 1);
        return ts >= cutoff ? head : null;
      })
      .filter((v): v is string => v !== null);
  },

  async getCorroborationCount(host: string, path: string, withinDays: number): Promise<number> {
    if (!redis) return 0;
    const key = `report:page:${host}:${normalizedPath(path)}`;
    const count = await redis.get<number>(key).catch(() => null);
    void withinDays;
    return count == null ? 0 : Number(count);
  },

  async isBanned(identifier: string): Promise<boolean> {
    if (!redis) return false;
    const banned = await redis.sismember("report:banned", identifier).catch(() => 0);
    return banned === 1;
  },

  async recordPipelineEvent(event: PipelineEvent): Promise<void> {
    console.info("[report]", JSON.stringify(event));

    if (!redis) return;

    if (event.outcome !== "silent-reject" && event.outcome !== "duplicate-corroborated") {
      const id =
        event.reporterKind === "authenticated"
          ? `user:${event.ipHash}`
          : `ip:${event.ipHash}`;
      const key = `report:dedup:${id}`;
      const entry = `${Date.now()}|${event.path.slice(0, 60)}`;
      await redis.lpush(key, entry).catch(() => {});
      await redis.ltrim(key, 0, 19).catch(() => {});
      await redis.expire(key, 60).catch(() => {});
    }

    if (event.outcome === "verified-report" && event.host && event.path) {
      const key = `report:page:${event.host}:${normalizedPath(event.path)}`;
      await redis.incr(key).catch(() => {});
      await redis.expire(key, 60 * 60 * 24 * 7).catch(() => {});
    }
  },

  async findExistingForUrl(host: string, path: string): Promise<{ issueNumber: number } | null> {
    if (!redis) return null;
    const key = `report:issue:${host}:${normalizedPath(path)}`;
    const num = await redis.get<number>(key).catch(() => null);
    return num ? { issueNumber: Number(num) } : null;
  },
};

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${SALT}`).digest("hex").slice(0, 16);
}

function normalizedPath(path: string): string {
  const beforeQuery = path.split("?")[0] ?? path;
  return beforeQuery.replace(/\/$/, "") || "/";
}
