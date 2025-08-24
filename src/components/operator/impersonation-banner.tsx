"use client";
import { useEffect, useState } from "react";
import { stopImpersonation } from "@/components/operator/actions/impersonation/stop";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

export default function ImpersonationBanner() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_schoolId="));
    setSchoolId(cookie ? decodeURIComponent(cookie.split("=")[1]) : null);
    const exp = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_expires="));
    setExpiresAt(exp ? Number(decodeURIComponent(exp.split("=")[1])) : null);
    const hint = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_hint="));
    if (hint) {
      try {
        const json = JSON.parse(decodeURIComponent(hint.split("=")[1]));
        if (json?.name) {
          setSchoolId(`${json.name}`);
        }
      } catch {}
    }
  }, []);

  if (!schoolId) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-100 px-3 py-2 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
      <div className="text-xs">
        Impersonating: <span className="font-semibold">{schoolId}</span>
        {expiresAt && (
          <span className="ml-2">(expires {new Date(expiresAt).toLocaleTimeString()})</span>
        )}
      </div>
      <button
        className="text-xs underline"
        onClick={async () => {
          try {
            await stopImpersonation("manual stop via banner");
            SuccessToast();
            setSchoolId(null);
          } catch (e) {
            ErrorToast(e instanceof Error ? e.message : "Failed to stop impersonation");
          }
        }}
      >
        Stop impersonation
      </button>
    </div>
  );
}


